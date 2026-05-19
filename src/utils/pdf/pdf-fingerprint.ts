import crypto from "crypto";

/**
 * Create a lightweight fingerprint of a PDF file.
 * We hash the first 10DB + file size instead of whole file because hashing a 50MB PDF synchronously
 * would block the event loop. 
 * First 10KB contains the PDF header and enough unique metadata that collisions between different
 * PDFs are practically impossible. 
 */

export function createPDFFingerprint(buffer: Buffer): string{
    const sampleSize = Math.min(10000, buffer.length);
    const sample = buffer.slice(0, sampleSize);

    return crypto
        .createHash("sha256")
        .update(sample)
        .update(String(buffer.length)) //include file size as extra entropy
        .digest("hex");
}