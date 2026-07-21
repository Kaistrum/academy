import { useMemo, useState } from "react";
import Head from "next/head";
import { Badge, Select } from "@kaistrum/stratum-ui";
import { CreditCard, Search, Smartphone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { courses, formatKES } from "@/data/courses";
import { payments, totalRevenue, type PaymentStatus } from "@/data/payments";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

function courseTitle(slug: string): string {
  return courses.find((c) => c.slug === slug)?.title ?? slug;
}

export default function AdminPayments() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return payments.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (q) {
        const hay = `${p.buyer} ${courseTitle(p.courseSlug)} ${p.id}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [status, q]);

  const shown = rows.slice(0, 40);
  const pendingTotal = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amountKES, 0);
  const refundedTotal = payments
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + p.amountKES, 0);

  return (
    <AdminLayout title="Payments">
      <Head>
        <title>Admin · Payments — Kaistrum Academy</title>
      </Head>

      {/* Totals */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Collected", value: formatKES(totalRevenue()), tone: "text-success" },
          { label: "Pending", value: formatKES(pendingTotal), tone: "text-warning" },
          { label: "Refunded", value: formatKES(refundedTotal), tone: "text-text-dim" },
          { label: "Transactions", value: String(payments.length), tone: "text-text" },
        ].map((s) => (
          <div key={s.label} className="border border-border bg-bg-card p-4">
            <p className={`text-2xl font-semibold ${s.tone}`}>{s.value}</p>
            <p className="text-xs text-text-dim">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search buyer, course, ref…"
            className="h-10 w-full border border-border-strong bg-bg pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="w-44">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
        </div>
      </div>

      <p className="mb-2 text-sm text-text-dim">
        {rows.length} transactions{rows.length > shown.length && ` · showing first ${shown.length}`}
      </p>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-surface">
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{p.id}</td>
                <td className="px-4 py-3 text-text-dim">{p.date}</td>
                <td className="px-4 py-3">{p.buyer}</td>
                <td className="px-4 py-3 text-text-dim">{courseTitle(p.courseSlug)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-text-dim">
                    {p.method === "M-Pesa" ? (
                      <Smartphone size={13} className="text-accent" />
                    ) : (
                      <CreditCard size={13} className="text-accent" />
                    )}
                    {p.method}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatKES(p.amountKES)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
