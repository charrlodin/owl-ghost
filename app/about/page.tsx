"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";

export default function About() {
    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black relative">
            <Navigation />

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen">
                {/* LEFT: Title (Span 6) */}
                <div className="col-span-1 md:col-span-6 p-6 md:p-12 border-r border-white/10 flex flex-col justify-end sticky top-0 h-screen">
                    <motion.h1
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="font-display text-[12vw] md:text-[8vw] font-bold uppercase tracking-tighter leading-[0.8] text-white mix-blend-difference"
                    >
                        About<br />Owl<br />Ghost
                    </motion.h1>
                </div>

                {/* RIGHT: Content (Span 6) */}
                <div className="col-span-1 md:col-span-6 p-6 md:p-12 pt-32 flex flex-col justify-center">
                    <div className="space-y-16 max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <h3 className="font-display text-3xl text-white">Philosophy</h3>
                            <p className="font-mono text-sm leading-relaxed text-white/60">
                                We believe data should not live forever. OwlGhost is designed to be a temporary transit point, not a storage locker.
                                Files are encrypted, stored for a limited time, and then securely wiped from existence.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4"
                        >
                            <h3 className="font-display text-3xl text-white">Privacy</h3>
                            <p className="font-mono text-sm leading-relaxed text-white/60">
                                No tracking. No ads. No logs of what you share.
                                We use Convex for secure storage and Clerk for authentication, ensuring industry-standard security without the bloat.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-4"
                        >
                            <h3 className="font-display text-3xl text-white">Open Source</h3>
                            <p className="font-mono text-sm leading-relaxed text-white/60">
                                OwlGhost is fully open source. You can inspect the code, host it yourself, or contribute to its development.
                                Transparency is the only true security.
                            </p>
                        </motion.div>

                        <div className="pt-12 border-t border-white/10">
                            <p className="font-mono text-xs uppercase tracking-widest text-white/30">
                                Built with Next.js, Convex, Clerk, & Tailwind.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
