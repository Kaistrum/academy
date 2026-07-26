/**
 * Certificates are rendered by the API (`GET /certificates/:id/download`), so
 * the client only issues one — the call is idempotent — and saves the file.
 */
import { certificates } from "@/lib/api";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Issues (or re-fetches) the learner's certificate for a course and downloads
 * it. Throws the API error — `COURSE_NOT_COMPLETED` / `NOT_ENROLLED` — so the
 * caller can show it.
 */
export async function downloadCourseCertificate(
  slug: string,
  format: "pdf" | "svg" = "pdf",
): Promise<void> {
  const certificate = await certificates.issue(slug);
  await downloadCertificateById(certificate.id, certificate.serial, format);
}

export async function downloadCertificateById(
  id: string,
  serial: string,
  format: "pdf" | "svg" = "pdf",
): Promise<void> {
  const blob = await certificates.download(id, format);
  saveBlob(blob, `kaistrum-certificate-${serial}.${format}`);
}
