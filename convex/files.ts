import { checkRateLimit } from "./rateLimit";

// ... imports

// ... inside handler
if (userId) {
    await checkRateLimit(ctx, {
        key: userId,
        maxRequests: 20,
        windowMs: 60 * 60 * 1000, // 1 hour
    });
}

// 2. Filename Sanitization
// Remove any non-alphanumeric chars except dots, dashes, underscores
const sanitizedFileName = args.fileName.replace(/[^a-zA-Z0-9._-]/g, "");
if (sanitizedFileName.length === 0) throw new Error("Invalid filename");

const uploadUrl = await ctx.storage.generateUploadUrl();

return uploadUrl;
    },
});

// Actual creation after upload
export const saveFile = mutation({
    args: {
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
        expiryDurationMs: v.number(),
        maxDownloads: v.optional(v.number()),
        passwordHash: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject;

        const now = Date.now();
        const expiresAt = now + args.expiryDurationMs;

        const fileId = await ctx.db.insert("files", {
            storageId: args.storageId,
            userId: userId ?? undefined, // Ensure undefined if null/missing
            fileName: args.fileName,
            fileSize: args.fileSize,
            mimeType: args.mimeType,
            expiresAt: expiresAt,
            maxDownloads: args.maxDownloads,
            downloadCount: 0,
            passwordHash: args.passwordHash,
            createdAt: now,
            status: "ready",
        });

        return fileId;
    },
});

export const getFileInfo = query({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        const file = await ctx.db.get(args.fileId);
        if (!file) return null;

        const result = {
            ...file,
            storageId: undefined, // Hide storageId from public
            passwordRequired: !!file.passwordHash,
        };

        if (isExpired(file)) {
            return { ...result, isExpired: true };
        }

        return { ...result, isExpired: false };
    },
});

export const getDownloadUrl = mutation({
    args: {
        fileId: v.id("files"),
        passwordHash: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const file = await ctx.db.get(args.fileId);
        if (!file) throw new Error("File not found");

        if (isExpired(file)) throw new Error("File expired");

        if (file.passwordHash) {
            if (file.passwordHash !== args.passwordHash) {
                throw new Error("Incorrect password");
            }
        }

        // Increment download count
        await ctx.db.patch(args.fileId, {
            downloadCount: file.downloadCount + 1,
        });

        // Check if this download maxed it out
        if (file.maxDownloads !== undefined && file.maxDownloads !== null) {
            if (file.downloadCount + 1 >= file.maxDownloads) {
                // Mark as expired? Or just let isExpired handle it?
                // Let's mark it for clarity/cleanup queries
                // But isExpired logic handles it dynamically.
            }
        }

        return await ctx.storage.getUrl(file.storageId);
    },
});

export const getUserFiles = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const files = await ctx.db
            .query("files")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();

        return files.map(f => ({
            ...f,
            isExpired: isExpired(f),
        }));
    },
});

export const deleteFile = mutation({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const file = await ctx.db.get(args.fileId);
        if (!file) throw new Error("Not found");

        if (file.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.storage.delete(file.storageId);
        await ctx.db.delete(args.fileId);
    },
});
