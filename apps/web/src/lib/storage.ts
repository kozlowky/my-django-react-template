/**
 * Rewrite MinIO internal URLs (http://minio:9000/...) to go through
 * the Vite dev proxy at /minio/... so the browser can reach them.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/minio:\d+\//, "/minio/");
}
