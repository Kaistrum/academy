import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Avatar, IconButton } from "@kaistrum/stratum-ui";
import { Eye, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatKES } from "@/data/courses";
import { distinctLearnerCount, learnerPeople, totalLearners } from "@/data/learners";
import { totalSpentByBuyer } from "@/data/payments";

export default function AdminLearners() {
  const [q, setQ] = useState("");
  const people = useMemo(() => learnerPeople(), []);

  const rows = people.filter((p) =>
    q ? `${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase()) : true,
  );

  return (
    <AdminLayout title="Learners">
      <Head>
        <title>Admin · Learners — Kaistrum Academy</title>
      </Head>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="border border-border bg-bg-card p-4">
          <p className="text-2xl font-semibold">{distinctLearnerCount()}</p>
          <p className="text-xs text-text-dim">Unique learners</p>
        </div>
        <div className="border border-border bg-bg-card p-4">
          <p className="text-2xl font-semibold">{totalLearners()}</p>
          <p className="text-xs text-text-dim">Total enrolments</p>
        </div>
        <div className="border border-border bg-bg-card p-4">
          <p className="text-2xl font-semibold">
            {people.reduce((n, p) => n + p.completed, 0)}
          </p>
          <p className="text-xs text-text-dim">Completions</p>
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
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Learner</th>
              <th className="px-4 py-3 text-right font-medium">Registered</th>
              <th className="px-4 py-3 text-right font-medium">In progress</th>
              <th className="px-4 py-3 text-right font-medium">Completed</th>
              <th className="px-4 py-3 text-right font-medium">Total spent</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.name}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/learners/view?name=${encodeURIComponent(p.name)}`}
                        className="font-medium hover:text-accent"
                      >
                        {p.name}
                      </Link>
                      <div className="truncate text-xs text-text-muted">{p.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">{p.registered}</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-dim">{p.inProgress}</td>
                <td className="px-4 py-3 text-right tabular-nums text-success">{p.completed}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatKES(totalSpentByBuyer(p.name))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Link href={`/admin/learners/view?name=${encodeURIComponent(p.name)}`}>
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
                <td colSpan={6} className="px-4 py-10 text-center text-text-dim">
                  No learners match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
