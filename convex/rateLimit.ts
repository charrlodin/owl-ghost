import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";

// Simple Token Bucket Rate Limiter
// We allow X requests per window.

export const checkRateLimit = async (
    ctx: MutationCtx,
    config: {
        key: string;
        maxRequests: number;
        windowMs: number;
    }
) => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Cleanup old entries (optional, or rely on TTL if we had it)
    // For now, we just query count.

    // We need a table for this. Let's assume we add 'rateLimits' to schema.
    // actually, querying count of a log table is better for sliding window.

    // Let's use a 'rateLimits' table that stores { key, timestamp }

    const recentRequests = await ctx.db
        .query("rateLimits")
        .withIndex("by_key_timestamp", (q) =>
            q.eq("key", config.key).gt("timestamp", windowStart)
        )
        .collect();

    if (recentRequests.length >= config.maxRequests) {
        throw new Error(`Rate limit exceeded. Try again later.`);
    }

    // Record this request
    await ctx.db.insert("rateLimits", {
        key: config.key,
        timestamp: now,
    });
};
