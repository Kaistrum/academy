import Head from "next/head";
import Link from "next/link";
import { Badge, Card } from "@kaistrum/stratum-ui";
import { ArrowUpRight, BookOpen, TrendingUp, Users, Wallet } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { HBarList, RevenueAreaChart } from "@/components/admin/charts";
import { formatKES } from "@/data/courses";
import {
  paidSalesCount,
  revenueByCourse,
  revenueByMonth,
  revenueByTutor,
  revenueGrowthPct,
  totalRevenue,
} from "@/data/payments";
import { useAdmin } from "@/context/AdminContext";

function kesCompact(n: number): string {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${Math.round(n / 1000)}k`;
  return `KES ${n}`;
}

export default function AdminDashboard() {
  const { courses, tutors } = useAdmin();
  const months = revenueByMonth();
  const growth = revenueGrowthPct();
  const topCourses = revenueByCourse().slice(0, 5);
  const topTutors = revenueByTutor().slice(0, 5);

  const kpis = [
    {
      icon: Wallet,
      label: "Total revenue",
      value: formatKES(totalRevenue()),
      foot: `${paidSalesCount()} paid enrolments`,
    },
    {
      icon: TrendingUp,
      label: "Revenue growth (MoM)",
      value: `${growth >= 0 ? "+" : ""}${growth}%`,
      foot: `${months[months.length - 1].label} vs ${months[months.length - 2].label}`,
      accent: growth >= 0,
    },
    {
      icon: BookOpen,
      label: "Published courses",
      value: String(courses.filter((c) => c.status === "published").length),
      foot: `${courses.length} total`,
    },
    { icon: Users, label: "Tutors", value: String(tutors.length), foot: "Active instructors" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <Head>
        <title>Admin · Dashboard — Kaistrum Academy</title>
      </Head>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} surface="card" padding="standard" className="border border-border">
            <div className="flex items-center justify-between">
              <k.icon size={18} className="text-accent" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{k.value}</p>
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
        <RevenueAreaChart
          data={months.map((m) => ({ label: m.label, value: m.revenue }))}
          formatValue={kesCompact}
          formatAxis={(n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)}
        />
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
          <HBarList
            formatValue={formatKES}
            items={topCourses.map((c) => ({
              key: c.course.slug,
              label: c.course.title,
              sub: `${c.sales} sales · ${c.course.category}`,
              value: c.revenue,
            }))}
          />
        </Card>

        <Card surface="card" padding="standard" className="border border-border">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Top earning tutors</h2>
              <p className="text-sm text-text-dim">By paid revenue</p>
            </div>
            <Link
              href="/admin/tutors"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              All <ArrowUpRight size={14} />
            </Link>
          </div>
          <HBarList
            formatValue={formatKES}
            items={topTutors.map((t) => ({
              key: t.tutorId,
              label: t.name,
              sub: `${t.courses} courses · ${t.sales} sales`,
              value: t.revenue,
            }))}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
