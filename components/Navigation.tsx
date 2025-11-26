"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function Navigation() {
    return (
        <nav className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-start pointer-events-none mix-blend-difference text-white">
            {/* Top Left: Logo / Brand */}
            <div className="pointer-events-auto">
                <Link href="/" className="font-bold text-xl tracking-tighter uppercase font-display">
                    OwlGhost
                </Link>
            </div>

            {/* Top Right: Menu / Auth */}
            <div className="pointer-events-auto flex gap-6 font-mono text-sm uppercase tracking-widest">
                <Link href="/about" className="hover:underline decoration-primary underline-offset-4">
                    Info
                </Link>

                <SignedIn>
                    <Link href="/dashboard" className="hover:underline decoration-primary underline-offset-4">
                        Dashboard
                    </Link>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8 rounded-none border border-white/20"
                            }
                        }}
                    />
                </SignedIn>

                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="hover:underline decoration-primary underline-offset-4">
                            Login
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </nav>
    );
}
