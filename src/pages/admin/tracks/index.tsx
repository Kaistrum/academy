import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, IconButton } from "@kaistrum/stratum-ui";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { categoryIcons } from "@/components/categoryIcons";
import { useAdmin } from "@/context/AdminContext";

export default function AdminTracks() {
  const router = useRouter();
  const { tracks, courses, deleteTrack } = useAdmin();

  const courseCount = (slug: string) => courses.filter((c) => c.categorySlug === slug).length;

  return (
    <AdminLayout
      title="Tracks"
      actions={
        <Link href="/admin/tracks/editor">
          <Button variant="primary" icon={<Plus size={16} />}>
            New track
          </Button>
        </Link>
      }
    >
      <Head>
        <title>Admin · Tracks — Kaistrum Academy</title>
      </Head>

      <p className="mb-4 max-w-2xl text-sm text-text-dim">
        Tracks are the topic groupings learners browse by. Courses are assigned to a track
        in the course editor.
      </p>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Track</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 text-right font-medium">Courses</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => {
              const Icon = categoryIcons[t.icon];
              const count = courseCount(t.slug);
              return (
                <tr
                  key={t.slug}
                  className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center border border-border-strong text-accent">
                        {Icon ? <Icon size={17} /> : <Layers size={17} />}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/tracks/editor?slug=${t.slug}`}
                          className="font-medium hover:text-accent"
                        >
                          {t.name}
                        </Link>
                        <div className="truncate text-xs text-text-muted">{t.blurb}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-dim">{t.slug}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-dim">{count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        aria-label={`Edit ${t.name}`}
                        size="sm"
                        variant="ghost"
                        icon={<Pencil size={15} />}
                        onClick={() => router.push(`/admin/tracks/editor?slug=${t.slug}`)}
                      />
                      <IconButton
                        aria-label={`Delete ${t.name}`}
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 size={15} />}
                        onClick={() => {
                          if (count > 0) {
                            alert(
                              `“${t.name}” still has ${count} course(s). Reassign them before deleting.`,
                            );
                            return;
                          }
                          if (confirm(`Delete track "${t.name}"?`)) deleteTrack(t.slug);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
