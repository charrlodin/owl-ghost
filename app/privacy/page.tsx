"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";

export default function Privacy() {
    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black relative">
            <Navigation />

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen">
                <div className="col-span-1 md:col-span-4 p-6 md:p-12 border-r border-white/10 flex flex-col justify-end sticky top-0 h-screen">
                    <motion.h1
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="font-display text-[8vw] font-bold uppercase tracking-tighter leading-[0.8] text-white mix-blend-difference"
                    >
                        Privacy<br />Policy
                    </motion.h1>
                </div>

                <div className="col-span-1 md:col-span-8 p-6 md:p-12 pt-32">
                    <div className="prose prose-invert prose-lg max-w-2xl font-mono">
                        <p className="text-white/60">Last Updated: November 2025</p>

                        <h3>1. Data Collection</h3>
                        <p>
                            We collect minimal data necessary to operate the service. This includes:
                            <br />- Files you upload (stored encrypted).
                            <br />- Metadata (filename, size, expiry settings).
                            <br />- IP addresses (for rate limiting and security).
                        </p>

                        <h3>2. Encryption</h3>
                        <p>
                            Files are encrypted client-side using AES-GCM (256-bit) before being uploaded.
                            The decryption key is contained in the URL fragment (`#key`) and is never sent to our servers.
                            We cannot read your files.
                        </p>

                        <h3>3. Data Retention</h3>
                        <p>
                            Files are automatically deleted after the expiry period you select (1, 3, or 7 days) or when the download limit is reached.
                            Once deleted, data is unrecoverable.
                        </p>

                        <h3>4. Third Parties</h3>
                        <p>
                            We use Convex for database and storage services, and Clerk for authentication.
                            Please refer to their respective privacy policies for more information.
                        </p>

                        <h3>5. Contact</h3>
                        <p>
                            For privacy concerns, contact us at: <a href="mailto:support@owlghost.xyz" className="text-primary hover:underline">support@owlghost.xyz</a>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
