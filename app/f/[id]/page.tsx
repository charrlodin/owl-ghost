"use client";

import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navigation from "@/components/Navigation";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";


export default function DownloadPage({ params }: { params: { id: string } }) {
    const fileId = params.id as Id<"files">;

    const fileInfo = useQuery(api.files.getFileInfo, { fileId });
    const getDownloadUrl = useMutation(api.files.getDownloadUrl);

    const [password, setPassword] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleDownload = async () => {
        setDownloading(true);
        setError(null);
        try {
            // 1. Get Key from URL Hash
            const keyStr = window.location.hash.substring(1); // Remove '#'
            if (!keyStr) throw new Error("Missing decryption key in URL");

            // 2. Verify Password (if needed)
            let passwordHash = undefined;
            if (fileInfo?.passwordRequired) {
                if (!password) throw new Error("Password required");
                const { hashPassword } = await import("@/lib/crypto");
                passwordHash = await hashPassword(password);
            }

            // 3. Get Download URL
            const url = await getDownloadUrl({
                fileId,
                passwordHash
            });
            if (!url) throw new Error("Could not generate download link");

            // 4. Fetch Encrypted Blob
            const response = await fetch(url);
            if (!response.ok) throw new Error("Download failed");
            const encryptedBlob = await response.blob();

            // 5. Decrypt
            const { importKey, decryptFile } = await import("@/lib/crypto");
            const key = await importKey(keyStr);
            const decryptedBlob = await decryptFile(encryptedBlob, key, fileInfo!.mimeType);

            // 6. Trigger Download
            const downloadUrl = URL.createObjectURL(decryptedBlob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileInfo!.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Download failed");
        } finally {
            setDownloading(false);
        }
    };

    if (fileInfo === undefined) return <div className="h-screen flex items-center justify-center font-mono uppercase animate-pulse">Loading...</div>;
    if (fileInfo === null) return <div className="h-screen flex items-center justify-center font-display text-4xl text-red-500">404 - Not Found</div>;

    return (
        <main className="h-screen w-full bg-background text-foreground overflow-hidden relative">
            <Navigation />

            <div className="grid grid-cols-1 md:grid-cols-12 h-full w-full">
                {/* LEFT: File Info (Span 7) */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-end p-6 md:p-12 border-r border-white/10 relative">
                    <div className="absolute inset-0 bg-surface/20 pointer-events-none" />

                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">Incoming Transfer</div>
                        <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter break-words mb-6">
                            {fileInfo.fileName}
                        </h1>
                        <div className="flex gap-8 font-mono text-sm uppercase text-white/60">
                            <span>{(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                            <span>Expires {new Date(fileInfo.expiresAt).toLocaleDateString()}</span>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT: Action Zone (Span 5) */}
                <div className="col-span-1 md:col-span-5 flex flex-col justify-center p-6 md:p-12 bg-surface/5">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        {fileInfo.isExpired ? (
                            <div className="text-center space-y-4">
                                <h2 className="font-display text-4xl text-white/20">Expired</h2>
                                <p className="font-mono text-xs uppercase text-white/40">This file has vanished.</p>
                            </div>
                        ) : (
                            <>
                                {fileInfo.passwordRequired && (
                                    <div className="space-y-2">
                                        <label className="font-mono text-xs uppercase tracking-widest text-white/40">Password Protected</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-transparent border-b border-white/20 py-4 text-2xl font-display focus:border-primary focus:outline-none transition-colors placeholder:text-white/10"
                                            placeholder="••••••"
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="text-red-500 font-mono text-xs uppercase tracking-widest border-l-2 border-red-500 pl-4 py-2">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={() => { handleDownload(); }}
                                    disabled={downloading}
                                    className="w-full bg-primary text-black font-bold uppercase py-4 text-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {downloading ? "Downloading..." : "Download"}
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
