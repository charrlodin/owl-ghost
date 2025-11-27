# OwlGhost 🦉👻

**Ephemeral, End-to-End Encrypted File Sharing.**

OwlGhost is a privacy-first file sharing application designed for the modern web. It features a "Neo-Brutalist" aesthetic, client-side encryption, and strict data expiration policies.

![OwlGhost](/public/owl-logo.png)

## Features

-   **End-to-End Encryption (E2EE)**: Files are encrypted in the browser using `AES-GCM` (256-bit) before upload. The decryption key is part of the URL fragment (`#key`) and is **never** sent to the server.
-   **Ephemeral Storage**: Files automatically expire after 1, 3, or 7 days.
-   **Download Limits**: Set files to self-destruct after 1, 5, or 10 downloads.
-   **Password Protection**: Optional password gating (hashed client-side).
-   **Neo-Brutalist Design**: High-contrast, typographic-led UI with "The Split" layout topology.
-   **Procedural Audio**: (Currently disabled, but architecture exists) Web Audio API integration for UI sounds.

## Tech Stack

-   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Framer Motion.
-   **Backend**: Convex (Database, Functions, Cron Jobs).
-   **Storage**: Convex Native Storage.
-   **Auth**: Clerk.
-   **Security**: Web Crypto API (SHA-256, AES-GCM).

## Getting Started

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/yourusername/owl-ghost.git
    cd owl-ghost
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment**:
    -   Run `npx convex dev` to initialize your Convex backend.
    -   Setup Clerk authentication and add `CLERK_JWT_ISSUER_DOMAIN` to your Convex dashboard.
    -   Add `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local`.

4.  **Run the app**:
    ```bash
    npm run dev
    ```

## Security Model

-   **Zero Knowledge**: The server stores encrypted blobs. It cannot read your files.
-   **Key Management**: Keys are generated client-side and transferred via the URL hash. If you lose the link, the file is lost forever.
-   **Sanitization**: Filenames are sanitized to prevent injection attacks.
-   **Rate Limiting**: Uploads are rate-limited to prevent abuse.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
