import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const cleanup = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Cleanup Expired Files
    const timeExpired = await ctx.db
      .query("files")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .take(100);

    for (const file of timeExpired) {
      try {
        await ctx.storage.delete(file.storageId);
      } catch (e) {
        // Storage might already be gone
      }
      await ctx.db.patch(file._id, { status: "expired" });
    }

    // 2. Cleanup Rate Limit Logs (older than 24h)
    const oldLogs = await ctx.db
      .query("rateLimits")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", now - 24 * 60 * 60 * 1000))
      .take(100);

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }
  },
});

const crons = cronJobs();

crons.interval(
  "cleanup-expired-files",
  { minutes: 60 },
  internal.crons.cleanup
);

export default crons;
