import { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, Button, IconButton } from "@kaistrum/stratum-ui";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatKES } from "@/data/courses";
import { revenueByTutor } from "@/data/payments";
import { useAdmin } from "@/context/AdminContext";

export default function AdminTutors() {
  const router = useRouter();
  const { tutors, courses, deleteTutor } = useAdmin();

  const revenueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of revenueByTutor()) m.set(r.tutorId, r.revenue);
    return m;
  }, []);

  const courseCount = (id: string) => courses.filter((c) => c.tutorId === id).length;

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

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Tutor</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Courses</th>
              <th className="px-4 py-3 text-right font-medium">Revenue</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((t) => (
              <tr key={t.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-surface">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} size="md" />
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
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-text-dim">
                    <Star size={13} className="text-warning" fill="currentColor" /> {t.rating}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-dim">{courseCount(t.id)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">
                  {formatKES(revenueMap.get(t.id) ?? 0)}
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
                      onClick={() => {
                        if (confirm(`Delete tutor "${t.name}"?`)) deleteTutor(t.id);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
