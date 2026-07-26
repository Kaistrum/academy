import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, Button, IconButton } from "@kaistrum/stratum-ui";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin } from "@/lib/api";

export default function AdminTutors() {
  const router = useRouter();
  const { status } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(() => admin.tutors(), [], {
    enabled: status === "authenticated",
  });
  const tutors = data?.data ?? [];

  async function remove(id: string, name: string) {
    if (!confirm(`Delete tutor "${name}"?`)) return;
    setError(null);
    try {
      await admin.deleteTutor(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete that tutor.");
    }
  }

  return (
    <AdminLayout
      title="Tutors"
      actions={
        <Link href="/admin/tutors/editor">
          <Button variant="primary" icon={<Plus size={16} />}>
            New tutor
          </Button>
        </Link>
      }
    >
      <Head>
        <title>Admin · Tutors — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Tutor</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 text-right font-medium">Courses</th>
              <th className="px-4 py-3 text-right font-medium">Learners</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} src={t.avatarUrl ?? undefined} size="md" />
                    <div>
                      <Link
                        href={`/admin/tutors/editor?id=${t.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {t.name}
                      </Link>
                      <div className="text-xs text-text-muted">{t.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-dim">{t.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-text-dim">
                    <Star size={13} className="text-warning" fill="currentColor" />{" "}
                    {t.ratingAvg ? t.ratingAvg.toFixed(1) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">
                  {t.coursesCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">
                  {t.studentsCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton
                      aria-label={`Edit ${t.name}`}
                      size="sm"
                      variant="ghost"
                      icon={<Pencil size={15} />}
                      onClick={() => router.push(`/admin/tutors/editor?id=${t.id}`)}
                    />
                    <IconButton
                      aria-label={`Delete ${t.name}`}
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={15} />}
                      onClick={() => remove(t.id, t.name)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {tutors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-dim">
                  {loading ? "Loading…" : "No tutors yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
