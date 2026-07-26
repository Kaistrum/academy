import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Avatar,
  Badge,
  Progress,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaistrum/stratum-ui";
import { ArrowLeft, Award } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin, type PaymentStatus, type Role } from "@/lib/api";
import { formatDate, formatKES } from "@/lib/catalog";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
  abandoned: "neutral",
};

export default function AdminLearnerView() {
  const router = useRouter();
  const { status: authStatus, isAdmin } = useAuth();
  const userId = typeof router.query.id === "string" ? router.query.id : null;

  const learner = useAsync(() => admin.learner(userId as string), [userId], {
    enabled: authStatus === "authenticated" && Boolean(userId),
  });
  const [error, setError] = useState<string | null>(null);

  if (learner.loading || !userId) {
    return (
      <AdminLayout title="Learner">
        <p className="text-text-dim">Loading…</p>
      </AdminLayout>
    );
  }

  if (learner.error || !learner.data) {
    return (
      <AdminLayout title="Learner">
        <p className="text-text-dim">
          {learner.error?.message ?? "Learner not found."}{" "}
          <Link href="/admin/learners" className="text-accent hover:underline">
            Back to learners
          </Link>
        </p>
      </AdminLayout>
    );
  }

  const { user, totals, courses, certificates, payments } = learner.data;

  const stats = [
    { label: "Enrolled", value: String(totals.enrolled) },
    { label: "Completed", value: String(totals.completed) },
    { label: "Certificates", value: String(totals.certificates) },
    { label: "Total spent", value: formatKES(totals.spentKES) },
  ];

  async function changeRole(role: Role) {
    setError(null);
    try {
      await admin.setLearnerRole(userId as string, role);
      learner.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change the role.");
    }
  }

  return (
    <AdminLayout
      title={user.name}
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
        <title>Admin · {user.name} — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-text-dim">{user.email}</p>
            <p className="text-xs text-text-muted">
              Joined {formatDate(user.createdAt)} ·{" "}
              {user.emailVerified ? "verified" : "unverified"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="w-44">
            <Select
              label="Role"
              value={user.role}
              onChange={(e) => changeRole(e.target.value as Role)}
              options={[
                { value: "learner", label: "Learner" },
                { value: "instructor", label: "Instructor" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </div>
        )}
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
          <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
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
                {courses.map((e) => (
                  <tr
                    key={e.enrollmentId}
                    className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
                  >
                    <td className="px-4 py-3">
                      {e.slug ? (
                        <Link
                          href={`/admin/courses/view?slug=${e.slug}`}
                          className="font-medium hover:text-accent"
                        >
                          {e.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{e.title}</span>
                      )}
                      <div className="text-xs text-text-muted">
                        {e.completedLessons} of {e.lessonCount} lessons
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-dim">{formatDate(e.enrolledAt)}</td>
                    <td className="px-4 py-3">
                      <div className="w-32">
                        <Progress value={e.progressPct} showValue />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={e.status === "completed" ? "success" : "neutral"}>
                        {e.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-text-dim">
                      No enrolments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          {payments.length === 0 ? (
            <p className="py-8 text-center text-text-dim">No payments recorded.</p>
          ) : (
            <div className="mt-2 overflow-x-auto border border-border">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">
                        {p.reference}
                      </td>
                      <td className="px-4 py-3 text-text-dim">
                        {formatDate(p.paidAt ?? p.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-text-dim">{p.courseTitle ?? "—"}</td>
                      <td className="px-4 py-3 text-text-dim">{p.channel ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatKES(p.amountKES)}
                      </td>
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

        {/* Certificates */}
        <TabsContent value="certificates">
          {certificates.length === 0 ? (
            <p className="py-8 text-center text-text-dim">No certificates issued.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border-subtle border border-border">
              {certificates.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <Award size={15} className="text-accent" />
                  <span className="min-w-0 flex-1 truncate">{c.courseTitle ?? "—"}</span>
                  <span className="font-mono text-xs text-text-muted">{c.serial}</span>
                  <span className="text-xs text-text-dim">{formatDate(c.issuedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
