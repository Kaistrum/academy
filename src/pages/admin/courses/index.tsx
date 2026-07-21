import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Badge, Button, IconButton } from "@kaistrum/stratum-ui";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatKES } from "@/data/courses";
import { revenueByCourse } from "@/data/payments";
import { learnerCountForCourse } from "@/data/learners";
import { useAdmin } from "@/context/AdminContext";

export default function AdminCourses() {
  const router = useRouter();
  const { courses, tutors, deleteCourse, lessonCount } = useAdmin();
  const [q, setQ] = useState("");

  const revenueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of revenueByCourse()) m.set(r.course.slug, r.revenue);
    return m;
  }, []);

  const tutorName = (id: string) => tutors.find((t) => t.id === id)?.name ?? "—";

  const rows = courses.filter((c) =>
    q ? c.title.toLowerCase().includes(q.toLowerCase()) : true,
  );

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
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Tutor</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Learners</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Revenue</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.slug} className="border-b border-border-subtle last:border-0 hover:bg-bg-surface">
                <td className="px-4 py-3">
                  <Link href={`/admin/courses/view?slug=${c.slug}`} className="font-medium hover:text-accent">
                    {c.title}
                  </Link>
                  <div className="text-xs text-text-muted">
                    {c.categorySlug} · {c.format} · {lessonCount(c.slug)} lessons
                  </div>
                </td>
                <td className="px-4 py-3 text-text-dim">{tutorName(c.tutorId)}</td>
                <td className="px-4 py-3">
                  {c.premium && c.priceKES ? formatKES(c.priceKES) : <span className="text-success">Free</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <Link
                    href={`/admin/courses/view?slug=${c.slug}`}
                    className="inline-flex items-center gap-1.5 text-text-dim hover:text-accent"
                  >
                    <Users size={13} /> {learnerCountForCourse(c.slug)}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-dim">{c.createdAt}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.status === "published" ? "success" : "neutral"}>
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">
                  {formatKES(revenueMap.get(c.slug) ?? 0)}
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
                      onClick={() => {
                        if (confirm(`Delete "${c.title}"? This cannot be undone.`)) {
                          deleteCourse(c.slug);
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-dim">
                  No courses match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
