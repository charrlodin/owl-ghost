You are an expert full-stack engineer and architect.

Build a production-ready, open-source web application using:
- Next.js (App Router, TypeScript)
- Tailwind CSS for styling
- Convex for backend data + business logic
- Clerk for authentication (for logged-in features)
- An S3-compatible object storage (e.g. AWS S3 / R2 / Supabase storage) for file blobs

The app is called **GhostShare** (working name; keep it easy to rename).

## High-Level Product Description

GhostShare is a simple, privacy-friendly file sharing web app.

Core idea:
- A user uploads a file.
- The app generates a unique download link.
- That link automatically expires after a selected time and/or a maximum number of downloads.
- Optionally, the user can password-protect the link.
- Files are automatically deleted from storage after expiry.

Key positioning:
- No tracking, no ads, no dark patterns.
- Open-source and self-hostable.
- Free to use on the hosted instance with sensible limits.

The UX should be as simple as WeTransfer / SwissTransfer: upload → configure expiry → get link.

---

## Functional Requirements

### 1. Landing Page (`/`)

A single, focused page with:

- Brand name / logo (simple text or minimal logo).
- Short tagline:
  > “Share a file. Your link auto-expires.”
- Drag-and-drop file upload area plus “Choose file” button.
- Controls for:
  - **Expiry time**: radio/select with options:
    - 1 day
    - 3 days
    - 7 days (default)
  - **Max downloads**:
    - Unlimited (default)
    - 1
    - 3
    - 10
  - Optional **password** input:
    - Plain text field; if filled, link will be password-protected.
- Primary CTA button:
  - “Generate Link”

Behavior:

- User selects a file (or multiple files — for v1 this can be a single file; if simple, support multiple and bundle into ZIP).
- On click of “Generate Link”, you:
  1. Call a Convex mutation to create an upload session and get a pre-signed upload URL (and any necessary metadata/id).
  2. Upload the file directly from the browser to S3-compatible storage using that URL.
  3. Notify Convex that upload is complete.
  4. Show the resulting **share link** (e.g. `https://domain.com/f/{fileId}`) with a “Copy link” button.

State handling:
- Show a progress bar while uploading.
- Disable controls during upload/processing.
- Show error messages if:
  - File too large
  - Upload fails
  - Backend errors

### 2. Download Page (`/f/[id]`)

When someone visits `/f/{id}`, they should see:

- If the link is **valid**:
  - Card with:
    - File name
    - File size
    - “Expires in X days/hours” or “Link expires at {timestamp}”
    - If a max download cap is set:
      - “Downloads remaining: N” or “Downloaded X / max Y”
    - If password-protected:
      - Password input field + “Unlock file” button
    - A prominent **Download** button.
- If the link is **expired** (time or downloads):
  - Simple “This link has expired” message.
  - Subtext: “Ask the sender to generate a new link.”
  - Optional button: “Create your own link” → back to `/`.

Behavior:

- On load, call Convex query `getFileInfo(id)` to get:
  - Existence
  - Status (ready / expired)
  - Expiry info
  - Download counts
  - Whether password is required.
- When user clicks “Download”:
  - If file requires password: verify password via Convex mutation.
  - If valid and within expiry & download limits:
    - Convex increments `downloadCount`.
    - Convex returns a **time-limited pre-signed download URL** for the file.
    - Frontend initiates download (e.g. by redirecting or using `window.location` to the signed URL).
  - If not valid / expired, show expired state.

---

## Authentication (Clerk)

Support both **anonymous** and **logged-in** users.

### Anonymous

- Can:
  - Upload files and generate links (with stricter limits).
- Limits (configurable via env or constants):
  - Max file size: e.g. 1 GB.
  - Max active links per IP: e.g. 3.
  - Max uploads per day per IP: e.g. 10.
- No dashboard, no record of past uploads (beyond what’s needed for backend).

### Logged-In (via Clerk)

- Quick sign-up/login via:
  - Email link or OAuth (Google etc.)
- Extra features:
  - Higher limits:
    - Max file size: e.g. 5 GB.
    - Max active links: e.g. 20.
  - **Dashboard** at `/dashboard`:
    - Lists user’s active file shares:
      - File name
      - Size
      - Created at
      - Expires at
      - Download count / max
    - Actions:
      - Copy link
      - Delete now (which immediately deletes from storage and marks expired)
  - Can see expired shares (optional) in a separate section (for history).

Integration details:

- Use Clerk middleware / providers in Next.js App Router.
- Attach `userId` from Clerk to the Convex mutations where appropriate.
- If no logged-in user, treat as anonymous and use IP (from headers) for rate limits.

---

## Backend: Convex

Use Convex as the authoritative backend for metadata and logic.

### Convex Schema (example; adjust to Convex DSL)

Define a `files` table with fields:

- `_id`: string (Convex id).
- `userId`: string | null   // Clerk userId, or null for anonymous.
- `storageKey`: string      // Key/path in S3 storage.
- `fileName`: string
- `fileSize`: number        // in bytes
- `mimeType`: string
- `expiresAt`: Date
- `maxDownloads`: number | null   // null = unlimited
- `downloadCount`: number
- `passwordHash`: string | null   // if password-protected
- `createdAt`: Date
- `createdIpHash`: string | null  // hashed IP for rate limiting
- `status`: "pending" | "ready" | "expired"

### Convex Functions

Implement at least the following:

1. `createUploadSession(args)` (mutation)
   - Input:
     - `fileName`, `fileSize`, `mimeType`
     - `expiryOption` (1 / 3 / 7 days)
     - `maxDownloadsOption` (null / 1 / 3 / 10)
     - `password` (optional plaintext)
   - Logic:
     - Check user or IP rate limits.
     - Validate `fileSize` against allowed limit (different for anon vs logged-in).
     - Compute `expiresAt` = now + selected duration.
     - Hash password if present (e.g. bcrypt).
     - Generate a random id for the file (Convex `_id`).
     - Generate S3 pre-signed upload URL + a `storageKey` (e.g. `uploads/{id}/{originalName}`).
     - Insert record into `files` with:
       - `status: "pending"`, `downloadCount: 0`, etc.
     - Return:
       - `fileId`
       - `uploadUrl`
       - `publicUrl` (`/f/{id}`)

2. `markFileReady({ fileId })` (mutation)
   - Sets `status` to `"ready"` if upload succeeded.
   - Only callable after client finishes upload.
   - Optionally verify file exists in storage via HEAD request (nice-to-have).

3. `getFileInfo({ id })` (query)
   - Fetch file by id.
   - If not found → return `notFound: true`.
   - If `status === "expired"` or `expiresAt < now` or `maxDownloads != null && downloadCount >= maxDownloads` → return `expired: true`.
   - Else return:
     - `fileName`, `fileSize`, `expiresAt`, `downloadCount`, `maxDownloads`, `passwordRequired: boolean`.

4. `recordDownload({ id, password })` (mutation)
   - Fetch file.
   - Validate not expired (time and downloads).
   - If `passwordHash` is set:
     - Compare hash with provided password.
     - If mismatch → throw error.
   - Increment `downloadCount`.
   - If after increment `downloadCount >= maxDownloads` (when not null) → mark file as expired.
   - Generate a **pre-signed download URL** from storage (with short TTL, e.g. 5 minutes).
   - Return that URL.

5. `getUserFiles()` (query, authed)
   - Only for logged-in users.
   - Return list of active (and optionally recent expired) files for `userId`, sorted by `createdAt desc`.

6. `deleteFile({ id })` (mutation)
   - Auth-check: either owner or admin.
   - Delete from storage.
   - Mark file as `status: "expired"` or remove metadata entirely.

7. `cleanupExpiredFiles()` (scheduled / cron-like job)
   - Periodically run (e.g. every 15 minutes).
   - Find all files where:
     - `expiresAt < now` OR
     - `maxDownloads != null && downloadCount >= maxDownloads`
     - And `status !== "expired"`.
   - Delete their blobs from storage.
   - Mark them as `status: "expired"`.

8. `canUpload()` / rate limit helper (optional)
   - Centralized logic to enforce:
     - Per-IP daily upload limits (for anon).
     - Max active links per user/IP.
   - Store simple counters or derived from `files` table.

---

## Storage Layer

Implement storage via an S3-compatible provider.

- Use environment variables for:
  - `S3_ENDPOINT`
  - `S3_REGION`
  - `S3_BUCKET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
- Implement helpers (in a shared library) to:
  - Generate pre-signed upload URLs.
  - Generate pre-signed download URLs.
  - Delete a file by key.

In Next.js, you can either:
- Call these helpers within Convex functions (Node environment), OR
- Have Convex call a separate backend function, depending on how you prefer structure. For simplicity, let Convex handle S3 operations.

---

## Frontend Implementation (Next.js App Router)

Use the App Router (`app/` dir).

### Pages

1. `app/page.tsx` (Landing)
   - Layout with upload form.
   - Use a React hook for:
     - Selected file
     - Expiry choice
     - Max downloads choice
     - Optional password
     - Upload progress
     - Link result state
   - Interact with Convex via provided React bindings.

2. `app/f/[id]/page.tsx` (Download page)
   - Fetch file info via Convex `getFileInfo`.
   - Show:
     - Loading state
     - Expired state
     - Active state with optional password field.
   - On download:
     - Call `recordDownload` with password.
     - Receive download URL.
     - Trigger browser download (e.g. `window.location.href = url`).

3. `app/dashboard/page.tsx` (Protected)
   - Use Clerk’s `SignedIn` / `SignedOut` wrappers.
   - For signed-in users, query Convex `getUserFiles`.
   - Display a table with:
     - File name (click to go to `/f/[id]`)
     - Size (human readable)
     - CreatedAt
     - ExpiresAt
     - Downloads (X / max or “∞”)
     - Actions:
       - Copy link
       - Delete

4. `app/(marketing)/about/page.tsx` (Optional)
   - Explain:
     - How it works
     - Limits
     - Privacy
     - Link to GitHub repo and license.
   - Make it minimal but clear.

### Components

- `FileUploadCard`
- `ExpirySelector`
- `MaxDownloadsSelector`
- `PasswordField`
- `GeneratedLinkDisplay`
- `ProgressBar`
- `FileTable` (for dashboard)

Use Tailwind for styling with a clean, minimal aesthetic (think: neutral grays, accent color, big rounded cards, modern UI).

---

## Non-Functional Requirements

- Use **TypeScript** throughout (frontend + backend).
- Handle errors gracefully:
  - Show user-friendly messages for upload failures, expired links, wrong password, file too large, etc.
- Make it **mobile-friendly**:
  - Drag-and-drop on desktop, file-picker on mobile.
- Include a **config file or constants** for:
  - FREE_MAX_FILE_SIZE_ANON
  - FREE_MAX_FILE_SIZE_USER
  - MAX_ACTIVE_LINKS_ANON
  - MAX_ACTIVE_LINKS_USER
  - DEFAULT_EXPIRY_DAYS
  - ALLOWED_EXPIRY_OPTIONS
- Add basic **security** practices:
  - Hash passwords (never store plaintext).
  - Do not log raw passwords.
  - Avoid logging file contents or names in places where they’re not needed.
- No Google Analytics or invasive tracking; if metrics are needed, prefer a privacy-friendly, self-hostable tool or leave it out.

---

## Open Source & Repo Structure

Structure the repo clearly:

- `/app` – Next.js App Router pages
- `/components` – React components
- `/convex` – Convex schema & functions
- `/lib` – shared utilities (storage, formatting, etc.)
- `/styles` – Tailwind configuration
- `README.md` – with:
  - Overview
  - Feature list
  - Tech stack
  - Setup instructions:
    - how to configure Convex
    - how to configure Clerk
    - how to configure S3 storage
    - environment variables
  - Deployment instructions for Vercel

Add a permissive OSS license (MIT or Apache-2.0).

---

## Deliverables

Produce:

1. A Next.js project configured with Convex, Clerk, Tailwind.
2. Convex schema and all required queries/mutations.
3. S3 helper functions for pre-signed URLs.
4. Full UI (landing, download page, dashboard, about page).
5. Environment variable examples and configuration docs.
6. Clear comments where implementers can adjust limits and policies.

Make sure the code is clean, idiomatic, and ready to run with minimal configuration changes.