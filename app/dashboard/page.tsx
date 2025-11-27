"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

import { Id } from "@/convex/_generated/dataModel";

export default function Dashboard() {
    const files = useQuery(api.files.getUserFiles);
    const deleteFile = useMutation(api.files.deleteFile);

    const handleDelete = async (fileId: Id<"files">) => {
        if (confirm("Are you sure you want to delete this file?")) {
            await deleteFile({ fileId });
        }
    };

    const copyLink = (fileId: string) => {
        const url = `${window.location.origin}/f/${fileId}`;
        navigator.clipboard.writeText(url);
        alert("Link copied!");
    };

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black relative">
            <Navigation />

            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>

            <SignedIn>
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen">
                    {/* LEFT: Header (Span 4) */}
                    <div className="col-span-1 md:col-span-4 p-6 md:p-12 border-r border-white/10 flex flex-col justify-end sticky top-0 h-screen">
                        <h1 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.8] mb-8">
                            Your<br />Ghosts
                        </h1>
                        <div className="font-mono text-xs uppercase tracking-widest text-primary">
                            {files?.length || 0} Active Files
                        </div>
                    </div>

                    {/* RIGHT: List (Span 8) */}
                    <div className="col-span-1 md:col-span-8 p-6 md:p-12 pt-32">
                        <div className="grid gap-4">
                            {files === undefined ? (
                                <div className="animate-pulse font-mono uppercase tracking-widest text-white/30">Loading...</div>
                            ) : files.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-white/10">
                                    <p className="font-mono uppercase tracking-widest text-white/30">No active files</p>
                                </div>
                            ) : (
                                files.map((file, i) => (
                                    <motion.div
                                        key={file._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group border-b border-white/10 hover:bg-white/5 transition-colors py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-4 mb-2">
                                                <h3 className="font-display text-2xl truncate" title={file.fileName}>{file.fileName}</h3>
                                                {file.isExpired && (
                                                    <span className="bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest px-2 py-1">Expired</span>
                                                )}
                                                {file.passwordHash && (
                                                    <span className="bg-white/10 text-white/70 text-[10px] uppercase tracking-widest px-2 py-1">Locked</span>
                                                )}
                                            </div>
                                            <div className="flex gap-6 font-mono text-xs uppercase tracking-widest text-white/40">
                                                <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                <span>{file.downloadCount} / {file.maxDownloads ?? "∞"} Downloads</span>
                                                <span>Expires: {new Date(file.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-6 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => copyLink(file._id)}
                                                className="text-xs uppercase tracking-widest hover:text-primary transition-colors"
                                            >
                                                Copy
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file._id)}
                                                className="text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </SignedIn>
        </main>
    );
}
