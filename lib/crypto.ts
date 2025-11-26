// SHA-256 Hashing for Passwords (Server-Side Verification)
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

// AES-GCM Encryption for File Content (Client-Side E2EE)

export async function generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importKey(keyStr: string): Promise<CryptoKey> {
    const keyBytes = Uint8Array.from(atob(keyStr), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const fileBuffer = await file.arrayBuffer();

    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        fileBuffer
    );

    // Prepend IV to the encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return new Blob([combined], { type: "application/octet-stream" });
}

export async function decryptFile(encryptedBlob: Blob, key: CryptoKey, mimeType: string): Promise<Blob> {
    const buffer = await encryptedBlob.arrayBuffer();
    const combined = new Uint8Array(buffer);

    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );

    return new Blob([decryptedBuffer], { type: mimeType });
}
