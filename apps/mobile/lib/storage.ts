/**
 * On mobile there's no Vite proxy, so MinIO URLs are served directly.
 * We just return the URL as-is (or rewrite minio:9000 → your API host in dev).
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const minioUrl = process.env.EXPO_PUBLIC_MINIO_URL ?? "http://localhost:9000";
  return url.replace(/^https?:\/\/minio:\d+\//, `${minioUrl}/`);
}
