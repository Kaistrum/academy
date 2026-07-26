import { useEffect, useState } from "react";
import Head from "next/head";
import { Badge, Button, Select } from "@kaistrum/stratum-ui";
import { CreditCard, RotateCcw, Search, Smartphone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin, type PaymentStatus } from "@/lib/api";
import { formatDate, formatKES } from "@/lib/catalog";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
  abandoned: "neutral",
};

export default function AdminPayments() {
  const { status: authStatus, isAdmin } = useAuth();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(
    () => admin.payments({ status: status === "all" ? undefined : status }),
    [status],
    { enabled: authStatus === "authenticated" },
  );

  // The ledger endpoint filters by status and course, not free text, so the
  // search box narrows the loaded page client-side.
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setTerm(q.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const rows = (data?.data ?? []).filter((p) => {
    if (!term) return true;
    return `${p.learner?.name ?? ""} ${p.course?.title ?? ""} ${p.reference}`
      .toLowerCase()
      .includes(term);
  });

  const summary = data?.summary ?? { paidCount: 0, revenueKES: 0 };
  const pendingTotal = (data?.data ?? [])
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amountKES, 0);
  const refundedTotal = (data?.data ?? [])
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + p.amountKES, 0);

  async function refund(id: string, reference: string) {
    if (!confirm(`Refund ${reference}? This revokes the learner's access.`)) return;
    setBusyId(id);
    setError(null);
    try {
      await admin.refund(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not process the refund.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout title="Payments">
      <Head>
        <title>Admin · Payments — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Totals */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Collected", value: formatKES(summary.revenueKES), tone: "text-success" },
          { label: "Pending (page)", value: formatKES(pendingTotal), tone: "text-warning" },
          { label: "Refunded (page)", value: formatKES(refundedTotal), tone: "text-text-dim" },
          { label: "Paid orders", value: String(summary.paidCount), tone: "text-text" },
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
            placeholder="Search buyer, course, reference…"
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
              { value: "abandoned", label: "Abandoned" },
            ]}
          />
        </div>
      </div>

      <p className="mb-2 text-sm text-text-dim">
        {data?.meta.total ?? 0} transactions
        {rows.length !== (data?.data.length ?? 0) && ` · ${rows.length} matching`}
      </p>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {isAdmin && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
              >
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{p.reference}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-dim">
                  {formatDate(p.paidAt ?? p.createdAt)}
                </td>
                <td className="px-4 py-3">{p.learner?.name ?? "—"}</td>
                <td className="px-4 py-3 text-text-dim">{p.course?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-text-dim">
                    {p.channel === "mobile_money" ? (
                      <Smartphone size={13} className="text-accent" />
                    ) : (
                      <CreditCard size={13} className="text-accent" />
                    )}
                    {p.channel ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatKES(p.amountKES)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    {p.status === "paid" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyId === p.id}
                        icon={<RotateCcw size={13} />}
                        onClick={() => refund(p.id, p.reference)}
                      >
                        Refund
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-text-dim">
                  {loading ? "Loading…" : "No transactions found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
