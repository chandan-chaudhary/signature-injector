import crypto from "crypto";
/**
 * Calculate SHA-256 hash of a buffer
 * @param buffer - Buffer to hash (PDF bytes)
 * @returns SHA-256 hash as hexadecimal string
 */
export function calculateSHA256(buffer) {
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    return hash.digest("hex");
}
/**
 * Verify if a buffer matches a given SHA-256 hash
 * @param buffer - Buffer to verify
 * @param expectedHash - Expected SHA-256 hash
 * @returns true if hash matches, false otherwise
 */
export function verifySHA256(buffer, expectedHash) {
    const actualHash = calculateSHA256(buffer);
    return actualHash === expectedHash;
}
