import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Avatar, Badge, IconButton } from "@kaistrum/stratum-ui";
import { Eye, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { admin } from "@/lib/api";
import { formatDate, relativeTime } from "@/lib/catalog";

export default function AdminLearners() {
  const { status } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const { data, loading } = useAsync(
    () => admin.learners({ q: debouncedQ.trim() || undefined }),
    [debouncedQ],
    { enabled: status === "authenticated" },
  );

  const rows = data?.data ?? [];
  const totals = {
    people: data?.meta.total ?? 0,
    enrolments: rows.reduce((n, p) => n + p.enrolled, 0),
    completions: rows.reduce((n, p) => n + p.completed, 0),
  };

  return (
    <AdminLayout title="Learners">
      <Head>
        <title>Admin · Learners — Kaistrum Academy</title>
      </Head>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="border border-border bg-bg-card p-4">
          <p className="text-2xl font-semibold">{totals.people}</p>
          <p className="text-xs text-text-dim">Accounts</p>
        </div>
        <div className="border border-border bg-bg-card p-4">
          <p className="text-2xl font-semibold">{totals.enrolments}</p>
          <p className="text-xs text-text-dim">Enrolments (this page)</p>
        </div>
        <div className="border border-border bg-bg-card p-4">
          <p className="text-2xl font-semibold">{totals.completions}</p>
          <p className="text-xs text-text-dim">Completions (this page)</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search learners…"
          className="h-10 w-full border border-border-strong bg-bg pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Learner</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 text-right font-medium">Enrolled</th>
              <th className="px-4 py-3 text-right font-medium">In progress</th>
              <th className="px-4 py-3 text-right font-medium">Completed</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last active</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/learners/view?id=${p.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {p.name}
                      </Link>
                      <div className="truncate text-xs text-text-muted">{p.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.role === "admin" ? "accent" : "neutral"}>{p.role}</Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">{p.enrolled}</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">
                  {p.inProgress}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-success">{p.completed}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-dim">
                  {formatDate(p.createdAt)}
                </td>
                <td className="px-4 py-3 text-text-muted">{relativeTime(p.lastAccessedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Link href={`/admin/learners/view?id=${p.id}`}>
                      <IconButton
                        aria-label={`View ${p.name}`}
                        size="sm"
                        variant="ghost"
                        icon={<Eye size={15} />}
                      />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-dim">
                  {loading ? "Loading…" : `No learners match “${q}”.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
