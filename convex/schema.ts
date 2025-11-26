import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    storageId: v.id("_storage"), // Convex Storage ID
    userId: v.optional(v.string()), // Clerk userId or null
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    expiresAt: v.number(), // Timestamp
    maxDownloads: v.optional(v.number()), // null = unlimited
    downloadCount: v.number(),
    passwordHash: v.optional(v.string()),
    createdAt: v.number(),
    createdIpHash: v.optional(v.string()), // For rate limiting
    status: v.union(v.literal("pending"), v.literal("ready"), v.literal("expired")),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  rateLimits: defineTable({
    key: v.string(), // IP hash or User ID
    timestamp: v.number(),
  })
    .index("by_key_timestamp", ["key", "timestamp"])
    .index("by_timestamp", ["timestamp"]),
});
