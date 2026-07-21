import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Avatar,
  Badge,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaistrum/stratum-ui";
import { ArrowLeft, CreditCard, Smartphone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatKES, getCourse } from "@/data/courses";
import { enrollmentsForPerson, getPerson } from "@/data/learners";
import { paymentsForBuyer, totalSpentByBuyer, type PaymentStatus } from "@/data/payments";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

export default function AdminLearnerView() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromRouter = typeof router.query.name === "string" ? router.query.name : null;
    setName(fromRouter ?? new URLSearchParams(window.location.search).get("name"));
    setReady(true);
  }, [router.query.name]);

  const person = name ? getPerson(name) : undefined;

  if (!person || !name) {
    return (
      <AdminLayout title="Learner">
        <p className="text-text-dim">
          {ready ? "Learner not found." : "Loading…"}{" "}
          <Link href="/admin/learners" className="text-accent hover:underline">
            Back to learners
          </Link>
        </p>
      </AdminLayout>
    );
  }

  const enrolments = enrollmentsForPerson(name);
  const paymentRows = paymentsForBuyer(name);
  const spent = totalSpentByBuyer(name);

  const stats = [
    { label: "Registered", value: String(person.registered) },
    { label: "In progress", value: String(person.inProgress) },
    { label: "Completed", value: String(person.completed) },
    { label: "Total spent", value: formatKES(spent) },
  ];

  return (
    <AdminLayout
      title={person.name}
      actions={
        <Link
          href="/admin/learners"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
        >
          <ArrowLeft size={15} /> Back
        </Link>
      }
    >
      <Head>
        <title>Admin · {person.name} — Kaistrum Academy</title>
      </Head>

      <div className="mb-6 flex items-center gap-3">
        <Avatar name={person.name} size="lg" />
        <div>
          <p className="font-medium">{person.name}</p>
          <p className="text-sm text-text-dim">{person.email}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-border bg-bg-card p-4">
            <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="text-xs text-text-dim">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses ({enrolments.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({paymentRows.length})</TabsTrigger>
        </TabsList>

        {/* Courses */}
        <TabsContent value="courses">
          <div className="mt-2 overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Enrolled</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrolments.map((e) => {
                  const course = getCourse(e.courseSlug);
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/courses/view?slug=${e.courseSlug}`}
                          className="font-medium hover:text-accent"
                        >
                          {course?.title ?? e.courseSlug}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-dim">{e.enrolledAt}</td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <Progress value={e.progress} showValue />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={e.status === "completed" ? "success" : "neutral"}>
                          {e.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          {paymentRows.length === 0 ? (
            <p className="py-8 text-center text-text-dim">No payments recorded.</p>
          ) : (
            <div className="mt-2 overflow-x-auto border border-border">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
                    <th className="px-4 py-3 font-medium">Ref</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">{p.id}</td>
                      <td className="px-4 py-3 text-text-dim">{p.date}</td>
                      <td className="px-4 py-3 text-text-dim">
                        {getCourse(p.courseSlug)?.title ?? p.courseSlug}
                      </td>
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
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
