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
import { formatDuration, totalMinutes } from "@/data/courses";
import { currentUser, getEnrolledCourses } from "@/data/enrollment";
import { downloadCertificate } from "@/lib/certificate";

export default function MyLearning() {
  const enrolled = getEnrolledCourses();
  const inProgress = enrolled.filter((e) => e.enrollment.progress < 100);
  const completedCourses = enrolled.filter((e) => e.enrollment.progress >= 100);
  const resume = inProgress[0];

  const totalLessonsDone = enrolled.reduce(
    (sum, e) => sum + e.enrollment.completedLessons,
    0,
  );
  const hoursLearned = Math.round(
    enrolled.reduce(
      (sum, e) => sum + (totalMinutes(e.course) * e.enrollment.progress) / 100,
      0,
    ) / 60,
  );

  const stats = [
    { icon: BookOpen, value: enrolled.length, label: "Enrolled" },
    { icon: Play, value: inProgress.length, label: "In progress" },
    { icon: Check, value: completedCourses.length, label: "Completed" },
    { icon: GraduationCap, value: completedCourses.length, label: "Certificates" },
    { icon: Award, value: totalLessonsDone, label: "Lessons done" },
    { icon: Hourglass, value: `${hoursLearned}h`, label: "Time learned" },
  ];

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
            {currentUser.name.split(" ")[0]}
          </h1>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <div key={s.label} className="border border-border bg-bg-card p-4">
                <s.icon size={18} className="text-accent" />
                <dt className="mt-2 text-2xl font-semibold">{s.value}</dt>
                <dd className="text-xs text-text-dim">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {/* Resume banner */}
        {resume && (
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
                <h2 className="text-xl font-semibold leading-snug">
                  {resume.course.title}
                </h2>
                <p className="mt-1 text-sm text-text-dim">
                  Up next:{" "}
                  <span className="text-text">
                    {resume.enrollment.nextSection} · {resume.enrollment.nextLesson}
                  </span>
                </p>
                <div className="mt-4 max-w-md">
                  <Progress value={resume.enrollment.progress} showValue />
                </div>
              </div>
              <Link href={`/courses/${resume.course.slug}/learn`} className="shrink-0">
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

        {enrolled.length === 0 ? (
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
            {enrolled.map(({ course, enrollment }) => (
              <Card
                key={course.slug}
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
                      {course.category}
                    </span>
                    {enrollment.progress >= 100 && (
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
                    <Progress value={enrollment.progress} showValue />
                  </div>
                  <p className="text-xs text-text-dim">
                    {enrollment.completedLessons} of {course.lessons} lessons ·{" "}
                    {formatDuration(course)}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock size={13} /> {enrollment.lastAccessed}
                    </span>
                    {enrollment.progress >= 100 ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Download size={13} />}
                          onClick={() =>
                            downloadCertificate({
                              name: currentUser.name,
                              courseTitle: course.title,
                              slug: course.slug,
                              hours: course.hours,
                            })
                          }
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
                      <Link href={`/courses/${course.slug}/learn`}>
                        <Button variant="outline" size="sm" icon={<Play size={13} />}>
                          Continue
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
