import Head from "next/head";
import Link from "next/link";
import { Badge, Card } from "@kaistrum/stratum-ui";
import { ArrowUpRight, BookOpen, TrendingUp, Users, Wallet } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { HBarList, RevenueAreaChart } from "@/components/admin/charts";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { admin } from "@/lib/api";
import { formatKES, kesCompact } from "@/lib/catalog";

export default function AdminDashboard() {
  const { status } = useAuth();
  const { data, loading, error } = useAsync(() => admin.overview(), [], {
    enabled: status === "authenticated",
  });

  const months = data?.revenueByMonth ?? [];
  const growth = data?.growthMoM ?? 0;
  const last = months[months.length - 1];
  const prev = months[months.length - 2];

  const kpis = [
    {
      icon: Wallet,
      label: "Total revenue",
      value: formatKES(data?.totalRevenueKES ?? 0),
      foot: `${data?.paidOrders ?? 0} paid enrolments`,
    },
    {
      icon: TrendingUp,
      label: "Revenue growth (MoM)",
      value: `${growth >= 0 ? "+" : ""}${growth}%`,
      foot: last && prev ? `${last.label} vs ${prev.label}` : "This month",
    },
    {
      icon: BookOpen,
      label: "Published courses",
      value: String(data?.publishedCourses ?? 0),
      foot: `${(data?.publishedCourses ?? 0) + (data?.draftCourses ?? 0)} total`,
    },
    {
      icon: Users,
      label: "Learners enrolled",
      value: String(data?.enrollments ?? 0),
      foot: `${data?.completions ?? 0} completions`,
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <Head>
        <title>Admin · Dashboard — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-6 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error.message}
        </p>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} surface="card" padding="standard" className="border border-border">
            <div className="flex items-center justify-between">
              <k.icon size={18} className="text-accent" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {loading ? "…" : k.value}
            </p>
            <p className="text-sm text-text-dim">{k.label}</p>
            <p className="mt-1 text-xs text-text-muted">{k.foot}</p>
          </Card>
        ))}
      </div>

      {/* Revenue growth */}
      <Card surface="card" padding="standard" className="mt-6 border border-border">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Revenue growth</h2>
            <p className="text-sm text-text-dim">Monthly paid revenue, KES</p>
          </div>
          <Badge variant={growth >= 0 ? "success" : "danger"} icon={<TrendingUp size={12} />}>
            {growth >= 0 ? "+" : ""}
            {growth}% MoM
          </Badge>
        </div>
        {months.length > 0 ? (
          <RevenueAreaChart
            data={months.map((m) => ({ label: m.label, value: m.revenueKES }))}
            formatValue={kesCompact}
            formatAxis={(n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)}
          />
        ) : (
          <p className="py-10 text-center text-text-dim">
            {loading ? "Loading…" : "No revenue recorded yet."}
          </p>
        )}
      </Card>

      {/* Top courses + tutors */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card surface="card" padding="standard" className="border border-border">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Most profitable courses</h2>
              <p className="text-sm text-text-dim">By paid revenue</p>
            </div>
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              All <ArrowUpRight size={14} />
            </Link>
          </div>
          {(data?.topCourses.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-text-dim">No paid sales yet.</p>
          ) : (
            <HBarList
              formatValue={formatKES}
              items={(data?.topCourses ?? []).map((c) => ({
                key: c.id,
                label: c.title,
                sub: `${c.orders} sales · ${c.learnersCount} learners`,
                value: c.revenueKES,
              }))}
            />
          )}
        </Card>

        <Card surface="card" padding="standard" className="border border-border">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Top tutors</h2>
              <p className="text-sm text-text-dim">By enrolled learners</p>
            </div>
            <Link
              href="/admin/tutors"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              All <ArrowUpRight size={14} />
            </Link>
          </div>
          {(data?.topTutors.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-text-dim">No tutors yet.</p>
          ) : (
            <HBarList
              formatValue={(n) => String(n)}
              items={(data?.topTutors ?? []).map((t) => ({
                key: t.id,
                label: t.name,
                sub: `${t.courses} courses · ${t.ratingAvg.toFixed(1)}★`,
                value: t.learners,
              }))}
            />
          )}
        </Card>
      </div>

      {/* Recent orders */}
      <Card surface="card" padding="standard" className="mt-6 border border-border">
        <h2 className="mb-4 font-semibold">Recent orders</h2>
        {(data?.recentOrders.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-text-dim">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {(data?.recentOrders ?? []).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{o.course ?? "Removed course"}</span>
                <span className="font-mono text-xs text-text-muted">{o.reference}</span>
                <span className="tabular-nums">{formatKES(o.amountKES)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminLayout>
  );
}
