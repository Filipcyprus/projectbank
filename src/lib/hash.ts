/** SHA-256 of a string, hex-encoded, via the real Web Crypto API — not a fake
 * checksum. Used to bind a signature to a document's metadata record so any
 * later edit to that record is detectable, which is the one thing a client
 * can honestly prove without a trust service backing it. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
