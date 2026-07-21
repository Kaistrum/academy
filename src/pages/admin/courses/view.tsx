import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaistrum/stratum-ui";
import { ArrowLeft, Clock, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Stars } from "@/components/Stars";
import { formatKES } from "@/data/courses";
import { revenueByCourse } from "@/data/payments";
import { learnerCountForCourse, learnersForCourse } from "@/data/learners";
import { useAdmin } from "@/context/AdminContext";

export default function AdminCourseView() {
  const router = useRouter();
  const { getCourse, tutors, reviewsForCourse, removeReview, lessonCount, courseDuration } =
    useAdmin();

  // Resolve slug deterministically after mount (window.location is always
  // available then), rather than waiting on router.query to hydrate.
  const [slug, setSlug] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const fromRouter = typeof router.query.slug === "string" ? router.query.slug : null;
    setSlug(fromRouter ?? new URLSearchParams(window.location.search).get("slug"));
    setReady(true);
  }, [router.query.slug]);

  const course = slug ? getCourse(slug) : undefined;

  const revenue = useMemo(() => {
    if (!slug) return 0;
    return revenueByCourse().find((r) => r.course.slug === slug)?.revenue ?? 0;
  }, [slug]);

  if (!course) {
    return (
      <AdminLayout title="Course">
        <p className="text-text-dim">
          {ready ? "Course not found." : "Loading…"}{" "}
          <Link href="/admin/courses" className="text-accent hover:underline">
            Back to courses
          </Link>
        </p>
      </AdminLayout>
    );
  }

  const roster = learnersForCourse(course.slug);
  const reviews = reviewsForCourse(course.slug);
  const tutorName = tutors.find((t) => t.id === course.tutorId)?.name ?? "—";
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const durationMins = courseDuration(course.slug);
  const stats = [
    { label: "Learners", value: String(learnerCountForCourse(course.slug)) },
    { label: "Lessons", value: String(lessonCount(course.slug)) },
    { label: "Duration", value: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` },
    { label: "Reviews", value: String(reviews.length) },
    { label: "Avg rating", value: avgRating ? avgRating.toFixed(1) : "—" },
    { label: "Revenue", value: formatKES(revenue) },
  ];

  return (
    <AdminLayout
      title={course.title}
      actions={
        <>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <Link href={`/admin/courses/editor?slug=${course.slug}`}>
            <Button variant="outline" icon={<Pencil size={15} />}>
              Edit course
            </Button>
          </Link>
        </>
      }
    >
      <Head>
        <title>Admin · {course.title} — Kaistrum Academy</title>
      </Head>

      {/* Meta */}
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-dim">
        <Badge variant="accent">{course.categorySlug}</Badge>
        <span>·</span>
        <span>{tutorName}</span>
        <span>·</span>
        <span>{course.premium && course.priceKES ? formatKES(course.priceKES) : "Free"}</span>
        <span>·</span>
        <Badge variant={course.status === "published" ? "success" : "neutral"}>
          {course.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-border bg-bg-card p-4">
            <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="text-xs text-text-dim">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">Lessons ({lessonCount(course.slug)})</TabsTrigger>
          <TabsTrigger value="learners">Learners ({roster.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        {/* Lessons */}
        <TabsContent value="lessons">
          <LessonsPanel slug={course.slug} />
        </TabsContent>

        {/* Learners */}
        <TabsContent value="learners">
          {roster.length === 0 ? (
            <p className="py-8 text-center text-text-dim">No learners enrolled yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto border border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-surface text-left text-xs uppercase tracking-[0.1em] text-text-muted">
                    <th className="px-4 py-3 font-medium">Learner</th>
                    <th className="px-4 py-3 font-medium">Enrolled</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={l.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium">{l.name}</p>
                            <p className="truncate text-xs text-text-muted">{l.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-dim">{l.enrolledAt}</td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <Progress value={l.progress} showValue />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={l.status === "completed" ? "success" : "neutral"}>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{l.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-text-dim">No reviews for this course.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              {reviews.map((r) => (
                <Card
                  key={r.id}
                  surface="card"
                  padding="standard"
                  className="border border-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <Avatar name={r.author} size="md" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-medium">{r.author}</span>
                          <Stars rating={r.rating} size={13} />
                          <span className="text-xs text-text-muted">{r.date}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-text-dim">{r.body}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => {
                        if (confirm(`Remove this review by ${r.author}?`)) removeReview(r.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

    </AdminLayout>
  );
}

function LessonsPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const { lessonsForCourse, courseDuration, addLesson, deleteLesson } = useAdmin();
  const lessons = lessonsForCourse(slug);
  const total = courseDuration(slug);

  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(10);

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    // Create the lesson, then jump into its content editor.
    const id = addLesson(slug, { title: title.trim(), minutes: Math.max(0, minutes) });
    setTitle("");
    setMinutes(10);
    router.push(`/admin/courses/lesson?course=${slug}&lesson=${id}`);
  }

  const emptyBody = (html: string) =>
    !html || html.replace(/<[^>]*>/g, "").trim().length === 0;

  return (
    <div className="mt-2">
      {/* Add lesson */}
      <form
        onSubmit={submitAdd}
        className="mb-4 flex flex-col gap-3 border border-border bg-bg-card p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="New lesson"
            placeholder="e.g. Spatial joins in practice"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            type="number"
            label="Duration (min)"
            min={0}
            step={1}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </div>
        <Button type="submit" variant="primary" icon={<Plus size={16} />}>
          Add & write
        </Button>
      </form>

      {lessons.length === 0 ? (
        <p className="py-8 text-center text-text-dim">No lessons yet — add the first one above.</p>
      ) : (
        <>
          <div className="border border-border">
            <ul className="divide-y divide-border-subtle">
              {lessons.map((l, i) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-7 shrink-0 text-sm tabular-nums text-text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/admin/courses/lesson?course=${slug}&lesson=${l.id}`}
                    className="min-w-0 flex-1 truncate text-sm hover:text-accent"
                  >
                    {l.title}
                  </Link>
                  {emptyBody(l.contentHTML) ? (
                    <Badge variant="warning">No content</Badge>
                  ) : (
                    <Badge variant="neutral" icon={<FileText size={11} />}>
                      Content
                    </Badge>
                  )}
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-text-dim">
                    <Clock size={13} /> {l.minutes} min
                  </span>
                  <IconButton
                    aria-label={`Edit ${l.title}`}
                    size="sm"
                    variant="ghost"
                    icon={<Pencil size={14} />}
                    onClick={() =>
                      router.push(`/admin/courses/lesson?course=${slug}&lesson=${l.id}`)
                    }
                  />
                  <IconButton
                    aria-label={`Delete ${l.title}`}
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      if (confirm(`Delete lesson "${l.title}"?`)) deleteLesson(l.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            {lessons.length} lessons · {Math.floor(total / 60)}h {total % 60}m total
          </p>
        </>
      )}
    </div>
  );
}
