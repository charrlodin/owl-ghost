"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";

export default function Terms() {
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
                        Terms of<br />Service
                    </motion.h1>
                </div>

                <div className="col-span-1 md:col-span-8 p-6 md:p-12 pt-32">
                    <div className="prose prose-invert prose-lg max-w-2xl font-mono">
                        <p className="text-white/60">Last Updated: November 2025</p>

                        <h3>1. Acceptance</h3>
                        <p>
                            By using OwlGhost, you agree to these Terms. If you do not agree, please do not use the service.
                        </p>

                        <h3>2. Usage Restrictions</h3>
                        <p>
                            You agree not to use OwlGhost to:
                            <br />- Share illegal content (malware, CSAM, pirated material).
                            <br />- Harass or abuse others.
                            <br />- Attempt to bypass security measures.
                        </p>

                        <h3>3. Liability</h3>
                        <p>
                            OwlGhost is provided &quot;as is&quot; without warranty of any kind. We are not liable for any data loss,
                            service interruptions, or damages resulting from the use of the service.
                        </p>

                        <h3>4. Termination</h3>
                        <p>
                            We reserve the right to terminate access or delete files that violate these terms at our sole discretion.
                        </p>

                        <h3>5. Contact</h3>
                        <p>
                            Questions about these terms? Email us at: <a href="mailto:support@owlghost.xyz" className="text-primary hover:underline">support@owlghost.xyz</a>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
