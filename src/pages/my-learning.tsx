import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Badge, Button, Card, Progress } from "@kaistrum/stratum-ui";
import {
  Award,
  BookOpen,
  Check,
  Clock,
  Download,
  GraduationCap,
  Hourglass,
  Play,
  Sparkles,
  Star,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { ApiError, users as usersApi } from "@/lib/api";
import { formatDuration, relativeTime } from "@/lib/catalog";
import { downloadCourseCertificate } from "@/lib/certificate";

export default function MyLearning() {
  const { user, status } = useAuth();
  const { list, loading } = useEnrollments();
  const stats = useAsync(() => usersApi.stats(), [user?.id], {
    enabled: status === "authenticated",
  });
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrolled = list.filter((e) => e.course);
  const inProgress = enrolled.filter((e) => e.status !== "completed");
  const completedCourses = enrolled.filter((e) => e.status === "completed");
  const resume = inProgress[0];

  const s = stats.data;
  const tiles = [
    { icon: BookOpen, value: s?.enrolled ?? enrolled.length, label: "Enrolled" },
    { icon: Play, value: s?.inProgress ?? inProgress.length, label: "In progress" },
    { icon: Check, value: s?.completed ?? completedCourses.length, label: "Completed" },
    { icon: GraduationCap, value: s?.certificates ?? 0, label: "Certificates" },
    { icon: Award, value: s?.lessonsDone ?? 0, label: "Lessons done" },
    { icon: Hourglass, value: `${s?.hoursLearned ?? 0}h`, label: "Time learned" },
  ];

  async function getCertificate(slug: string) {
    setBusySlug(slug);
    setError(null);
    try {
      await downloadCourseCertificate(slug);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not download the certificate.");
    } finally {
      setBusySlug(null);
    }
  }

  if (status === "anonymous") {
    return (
      <Layout>
        <Head>
          <title>My learning — Kaistrum Academy</title>
        </Head>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <GraduationCap size={32} className="mx-auto text-accent" />
          <h1 className="mt-4 text-2xl font-semibold">Sign in to see your learning</h1>
          <p className="mt-2 text-text-dim">
            Your enrolments, progress and certificates live in your account.
          </p>
          <Link href="/signin?next=/my-learning">
            <Button variant="primary" className="mt-6">
              Sign in
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>My learning — Kaistrum Academy</title>
        <meta name="description" content="Your enrolled courses and progress." />
      </Head>

      {/* Header */}
      <section className="border-b border-border bg-bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-6 md:pt-20">
          <p className="text-sm text-text-dim">Welcome back,</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            {user?.name.split(" ")[0] ?? "Learner"}
          </h1>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((t) => (
              <div key={t.label} className="border border-border bg-bg-card p-4">
                <t.icon size={18} className="text-accent" />
                <dt className="mt-2 text-2xl font-semibold">{t.value}</dt>
                <dd className="text-xs text-text-dim">{t.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {error && (
          <p className="mb-6 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {/* Resume banner */}
        {resume?.course && (
          <Card
            surface="card"
            padding="none"
            className="mb-10 overflow-hidden border border-accent-dim"
          >
            <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <Badge variant="accent" icon={<Sparkles size={12} />} className="mb-3">
                  Jump back in
                </Badge>
                <h2 className="text-xl font-semibold leading-snug">{resume.course.title}</h2>
                <p className="mt-1 text-sm text-text-dim">
                  Up next:{" "}
                  <span className="text-text">
                    {resume.nextLesson
                      ? `${resume.nextLesson.sectionTitle} · ${resume.nextLesson.title}`
                      : "Course complete"}
                  </span>
                </p>
                <div className="mt-4 max-w-md">
                  <Progress value={resume.progressPct} showValue />
                </div>
              </div>
              <Link
                href={`/courses/${resume.course.slug}/learn${
                  resume.nextLesson ? `?lesson=${resume.nextLesson.id}` : ""
                }`}
                className="shrink-0"
              >
                <Button
                  variant="primary"
                  size="lg"
                  iconChip={<Play size={14} fill="currentColor" />}
                >
                  Continue
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <h2 className="mb-6 text-xl font-semibold tracking-tight">Your courses</h2>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse border border-border bg-bg-card" />
            ))}
          </div>
        ) : enrolled.length === 0 ? (
          <div className="border border-dashed border-border bg-bg-card p-12 text-center">
            <p className="text-lg font-medium">You haven&apos;t enrolled in anything yet</p>
            <p className="mt-1 text-text-dim">Browse the catalogue to get started.</p>
            <Link href="/courses">
              <Button variant="primary" className="mt-4">
                Browse courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {enrolled.map((enrollment) => {
              const course = enrollment.course!;
              const done = enrollment.status === "completed";
              return (
                <Card
                  key={enrollment.id}
                  surface="card"
                  padding="none"
                  className="flex flex-col overflow-hidden border border-border sm:flex-row"
                >
                  <Link
                    href={`/courses/${course.slug}`}
                    className="course-media h-28 shrink-0 sm:h-auto sm:w-36"
                    aria-label={course.title}
                  />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.12em] text-text-muted">
                        {course.track?.name ?? "Course"}
                      </span>
                      {done && (
                        <Badge variant="success" icon={<Check size={11} />}>
                          Completed
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold leading-snug">
                      <Link href={`/courses/${course.slug}`} className="hover:text-accent">
                        {course.title}
                      </Link>
                    </h3>
                    <div className="mt-1">
                      <Progress value={enrollment.progressPct} showValue />
                    </div>
                    <p className="text-xs text-text-dim">
                      {enrollment.completedLessons} of {course.lessonCount} lessons ·{" "}
                      {formatDuration(course.durationMinutes)}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                        <Clock size={13} /> {relativeTime(enrollment.lastAccessedAt)}
                      </span>
                      {done ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            loading={busySlug === course.slug}
                            icon={<Download size={13} />}
                            onClick={() => getCertificate(course.slug)}
                          >
                            Certificate
                          </Button>
                          <Link href={`/courses/${course.slug}?tab=reviews`}>
                            <Button variant="outline" size="sm" icon={<Star size={13} />}>
                              Review
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/courses/${course.slug}/learn${
                            enrollment.nextLesson ? `?lesson=${enrollment.nextLesson.id}` : ""
                          }`}
                        >
                          <Button variant="outline" size="sm" icon={<Play size={13} />}>
                            Continue
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
