"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState(24 * 60 * 60 * 1000); // 1 Day default
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.files.createUploadSession);
  const saveFile = useMutation(api.files.saveFile);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // 1. Generate E2EE Key
      const { generateKey, exportKey, encryptFile, hashPassword } = await import("@/lib/crypto");
      const key = await generateKey();
      const keyStr = await exportKey(key);

      // 2. Encrypt File
      const encryptedBlob = await encryptFile(file, key);

      // 3. Hash Password (if set)
      let passwordHash = undefined;
      if (password) {
        passwordHash = await hashPassword(password);
      }

      // 4. Get Upload URL
      const postUrl = await generateUploadUrl({
        fileName: file.name,
        fileSize: encryptedBlob.size, // Use encrypted size!
        mimeType: file.type,
        expiryDurationMs: expiry,
        maxDownloads: maxDownloads,
        passwordHash,
      });

      // 5. Upload Encrypted Blob
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: encryptedBlob,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      // 6. Save Metadata
      const fileId = await saveFile({
        storageId,
        fileName: file.name,
        fileSize: file.size, // Store ORIGINAL size for display
        mimeType: file.type,
        expiryDurationMs: expiry,
        maxDownloads: maxDownloads,
        passwordHash,
      });

      // 7. Generate URL with Key in Hash
      setShareUrl(`${window.location.origin}/f/${fileId}#${keyStr}`);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="h-screen w-full bg-background text-foreground overflow-hidden relative">
      <Navigation />

      {/* Grid Layout: 12 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 h-full w-full">

        {/* LEFT: Typographic Wall (Span 7) */}
        <div className="col-span-1 md:col-span-7 relative flex flex-col justify-end p-6 md:p-12 border-r border-white/10">
          <div className="absolute inset-0 bg-surface/20 pointer-events-none" />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.img
              src="/owl-logo.png"
              alt="Owl Ghost Logo"
              className="w-24 md:w-32 mb-8 opacity-80 mix-blend-screen"
              animate={{ y: [0, -15, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <h1 className="text-[15vw] md:text-[11vw] leading-[0.8] font-display font-bold uppercase tracking-tighter text-white mix-blend-difference">
              Owl<br />Ghost
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-8 max-w-md font-mono text-xs uppercase tracking-widest text-white/60"
          >
            <p>Ephemeral File Transfer Protocol.</p>
            <p>Encrypted. Anonymous. Gone in 7 days.</p>
          </motion.div>
        </div>

        {/* RIGHT: Interactive Zone (Span 5) */}
        <div
          className={`
            col-span-1 md:col-span-5 relative flex flex-col justify-center p-6 md:p-12
            transition-colors duration-500
            ${file ? 'bg-surface/10' : 'bg-transparent hover:bg-white/5'}
          `}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <AnimatePresence mode="wait">
            {!shareUrl ? (
              <motion.div
                key="upload-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col justify-center"
              >
                {!file ? (
                  <div
                    onClick={() => { fileInputRef.current?.click(); }}
                    className="h-full flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-24 h-24 border border-white/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                      <span className="text-4xl font-light text-white group-hover:text-primary transition-colors">+</span>
                    </div>
                    <p className="mt-6 font-mono text-sm uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      Drop File Here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="border-b border-white/20 pb-4">
                      <h3 className="font-display text-3xl truncate">{file.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-mono text-xs text-white/50">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button onClick={() => { setFile(null); }} className="text-xs uppercase text-red-500 hover:text-red-400">Clear</button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block font-mono text-xs uppercase tracking-widest text-white/40">Expiry</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 3, 7].map((days) => (
                            <button
                              key={days}
                              onClick={() => { setExpiry(days * 24 * 60 * 60 * 1000); }}
                              className={`
                                py-3 border text-xs font-mono uppercase transition-all
                                ${expiry === days * 24 * 60 * 60 * 1000
                                  ? 'border-primary text-primary bg-primary/10'
                                  : 'border-white/10 text-white/40 hover:border-white/30'}
                              `}
                            >
                              {days} Day{days > 1 ? 's' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-mono text-xs uppercase tracking-widest text-white/40">Limit</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['unlimited', 1, 5, 10].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => { setMaxDownloads(opt === 'unlimited' ? undefined : Number(opt)); }}
                              className={`
                                py-3 border text-xs font-mono uppercase transition-all
                                ${maxDownloads === (opt === 'unlimited' ? undefined : Number(opt))
                                  ? 'border-primary text-primary bg-primary/10'
                                  : 'border-white/10 text-white/40 hover:border-white/30'}
                              `}
                            >
                              {opt === 'unlimited' ? '∞' : opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-mono text-xs uppercase tracking-widest text-white/40">Password (Optional)</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 py-2 font-mono text-sm focus:border-primary focus:outline-none transition-colors placeholder:text-white/10"
                          placeholder="••••••"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => { handleUpload(); }}
                      disabled={uploading}
                      className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-primary transition-colors disabled:opacity-50 mt-8"
                    >
                      {uploading ? "Uploading..." : "Initiate Upload"}
                    </button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col justify-center space-y-8"
              >
                <div className="text-primary text-6xl">✓</div>
                <div>
                  <h3 className="font-display text-4xl mb-2">Ready.</h3>
                  <p className="font-mono text-xs uppercase text-white/50">Link generated successfully.</p>
                </div>

                <div className="bg-surface p-6 border border-white/10 break-all font-mono text-sm text-primary">
                  {shareUrl}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-primary transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => { setShareUrl(null); setFile(null); }}
                    className="border border-white/20 text-white font-bold uppercase tracking-widest py-4 hover:bg-white/10 transition-colors"
                  >
                    New
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
