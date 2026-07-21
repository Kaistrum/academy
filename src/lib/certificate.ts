/**
 * Generates a completion certificate as an SVG and triggers a download.
 * Client-only (uses document / Blob). Deliberately dependency-free so it
 * works without a server round-trip — the "download" is a real file.
 */
export function downloadCertificate(opts: {
  name: string;
  courseTitle: string;
  slug: string;
  hours?: number;
  date?: string;
}) {
  const date =
    opts.date ??
    new Date().toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
  <rect width="1200" height="850" fill="#07090F"/>
  <rect x="28" y="28" width="1144" height="794" fill="none" stroke="#2DD4BF" stroke-width="2"/>
  <rect x="40" y="40" width="1120" height="770" fill="none" stroke="rgba(45,212,191,0.25)" stroke-width="1"/>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle" fill="#E2E8F0">
    <text x="600" y="150" font-size="26" letter-spacing="6" fill="#2DD4BF" font-family="Arial, sans-serif">KAISTRUM ACADEMY</text>
    <text x="600" y="250" font-size="52" font-style="italic">Certificate of Completion</text>
    <line x1="500" y1="285" x2="700" y2="285" stroke="#2DD4BF" stroke-width="2"/>
    <text x="600" y="360" font-size="22" fill="rgba(226,232,240,0.65)" font-family="Arial, sans-serif">This certifies that</text>
    <text x="600" y="440" font-size="60" fill="#FFFFFF">${esc(opts.name)}</text>
    <text x="600" y="510" font-size="22" fill="rgba(226,232,240,0.65)" font-family="Arial, sans-serif">has successfully completed</text>
    <text x="600" y="575" font-size="40">${esc(opts.courseTitle)}</text>
    ${
      opts.hours
        ? `<text x="600" y="625" font-size="18" fill="rgba(226,232,240,0.5)" font-family="Arial, sans-serif">${opts.hours}+ hours of coursework</text>`
        : ""
    }
  </g>
  <g font-family="Arial, sans-serif" fill="rgba(226,232,240,0.65)" font-size="18">
    <line x1="230" y1="720" x2="470" y2="720" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <text x="350" y="750" text-anchor="middle">${esc(date)}</text>
    <text x="350" y="775" text-anchor="middle" font-size="14" fill="rgba(226,232,240,0.4)">Date</text>
    <line x1="730" y1="720" x2="970" y2="720" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <text x="850" y="750" text-anchor="middle" font-style="italic" font-family="Georgia, serif" fill="#2DD4BF">Kaistrum Academy</text>
    <text x="850" y="775" text-anchor="middle" font-size="14" fill="rgba(226,232,240,0.4)">Issued by</text>
  </g>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kaistrum-${opts.slug}-certificate.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
