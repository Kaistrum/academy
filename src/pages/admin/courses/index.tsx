import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Badge, Button, IconButton } from "@kaistrum/stratum-ui";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin } from "@/lib/api";
import { formatDateISO, formatKES, shortDuration } from "@/lib/catalog";

export default function AdminCourses() {
  const router = useRouter();
  const { status } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const { data, loading, reload } = useAsync(
    () => admin.courses({ q: debouncedQ.trim() || undefined }),
    [debouncedQ],
    { enabled: status === "authenticated" },
  );

  const rows = data?.data ?? [];

  async function remove(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await admin.deleteCourse(slug);
      reload();
    } catch (err) {
      // Courses with learners are refused with a 409 — unpublish instead.
      setError(err instanceof ApiError ? err.message : "Could not delete that course.");
    }
  }

  return (
    <AdminLayout
      title="Courses"
      actions={
        <Link href="/admin/courses/editor">
          <Button variant="primary" icon={<Plus size={16} />}>
            New course
          </Button>
        </Link>
      }
    >
      <Head>
        <title>Admin · Courses — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses…"
          className="h-10 w-full border border-border-strong bg-bg pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Tutor</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Learners</th>
              <th className="px-4 py-3 text-right font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.slug}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/courses/view?slug=${c.slug}`}
                    className="font-medium hover:text-accent"
                  >
                    {c.title}
                  </Link>
                  <div className="text-xs text-text-muted">
                    {c.track?.name ?? "No track"} · {c.lessonCount} lessons
                  </div>
                </td>
                <td className="px-4 py-3 text-text-dim">{c.instructor?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  {c.premium && c.priceKES ? (
                    formatKES(c.priceKES)
                  ) : (
                    <span className="text-success">Free</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <Link
                    href={`/admin/courses/view?slug=${c.slug}`}
                    className="inline-flex items-center gap-1.5 text-text-dim hover:text-accent"
                  >
                    <Users size={13} /> {c.learnersCount}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">
                  {shortDuration(c.durationMinutes)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-dim">
                  {formatDateISO(c.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.status === "published" ? "success" : "neutral"}>
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton
                      aria-label={`View ${c.title}`}
                      size="sm"
                      variant="ghost"
                      icon={<Eye size={15} />}
                      onClick={() => router.push(`/admin/courses/view?slug=${c.slug}`)}
                    />
                    <IconButton
                      aria-label={`Edit ${c.title}`}
                      size="sm"
                      variant="ghost"
                      icon={<Pencil size={15} />}
                      onClick={() => router.push(`/admin/courses/editor?slug=${c.slug}`)}
                    />
                    <IconButton
                      aria-label={`Delete ${c.title}`}
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={15} />}
                      onClick={() => remove(c.slug, c.title)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-dim">
                  {loading ? "Loading…" : `No courses match “${q}”.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
