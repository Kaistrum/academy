import { useState } from "react";
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
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin } from "@/lib/api";
import { formatDate, formatKES, relativeTime, shortDuration } from "@/lib/catalog";

export default function AdminCourseView() {
  const router = useRouter();
  const { status } = useAuth();
  const slug = typeof router.query.slug === "string" ? router.query.slug : null;
  const enabled = status === "authenticated" && Boolean(slug);

  const course = useAsync(() => admin.course(slug as string), [slug], { enabled });
  const lessons = useAsync(() => admin.lessons(slug as string), [slug], { enabled });
  const roster = useAsync(() => admin.roster(slug as string), [slug], { enabled });
  const reviews = useAsync(
    () => admin.reviews({ courseId: course.data?.id }),
    [course.data?.id],
    { enabled: enabled && Boolean(course.data?.id) },
  );

  if (course.loading || !slug) {
    return (
      <AdminLayout title="Course">
        <p className="text-text-dim">Loading…</p>
      </AdminLayout>
    );
  }

  if (course.error || !course.data) {
    return (
      <AdminLayout title="Course">
        <p className="text-text-dim">
          {course.error?.message ?? "Course not found."}{" "}
          <Link href="/admin/courses" className="text-accent hover:underline">
            Back to courses
          </Link>
        </p>
      </AdminLayout>
    );
  }

  const c = course.data;
  const lessonRows = lessons.data ?? [];
  const rosterRows = roster.data?.data ?? [];
  const reviewRows = reviews.data?.data ?? [];
  const durationMins = lessonRows.reduce((sum, l) => sum + (l.minutes ?? 0), 0);

  const stats = [
    { label: "Learners", value: String(c.learnersCount) },
    { label: "Lessons", value: String(lessonRows.length) },
    { label: "Duration", value: shortDuration(durationMins) },
    { label: "Reviews", value: String(c.ratingCount) },
    { label: "Avg rating", value: c.ratingCount ? c.ratingAvg.toFixed(1) : "—" },
    { label: "Price", value: c.premium && c.priceKES ? formatKES(c.priceKES) : "Free" },
  ];

  async function removeReview(id: string, author: string) {
    if (!confirm(`Remove this review by ${author}?`)) return;
    await admin.deleteReview(id).catch(() => {});
    reviews.reload();
    course.reload();
  }

  return (
    <AdminLayout
      title={c.title}
      actions={
        <>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <Link href={`/admin/courses/editor?slug=${c.slug}`}>
            <Button variant="outline" icon={<Pencil size={15} />}>
              Edit course
            </Button>
          </Link>
        </>
      }
    >
      <Head>
        <title>Admin · {c.title} — Kaistrum Academy</title>
      </Head>

      {/* Meta */}
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-dim">
        <Badge variant="accent">{c.track?.name ?? "No track"}</Badge>
        <span>·</span>
        <span>{c.instructor?.name ?? "Unassigned"}</span>
        <span>·</span>
        <Badge variant={c.status === "published" ? "success" : "neutral"}>{c.status}</Badge>
        <span>·</span>
        <Link href={`/courses/${c.slug}`} className="text-accent hover:underline">
          View public page
        </Link>
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
          <TabsTrigger value="lessons">Lessons ({lessonRows.length})</TabsTrigger>
          <TabsTrigger value="learners">Learners ({roster.data?.meta.total ?? 0})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.data?.meta.total ?? 0})</TabsTrigger>
        </TabsList>

        {/* Lessons */}
        <TabsContent value="lessons">
          <LessonsPanel
            slug={c.slug}
            lessons={lessonRows}
            loading={lessons.loading}
            onChanged={() => {
              lessons.reload();
              course.reload();
            }}
          />
        </TabsContent>

        {/* Learners */}
        <TabsContent value="learners">
          {rosterRows.length === 0 ? (
            <p className="py-8 text-center text-text-dim">
              {roster.loading ? "Loading…" : "No learners enrolled yet."}
            </p>
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
                  {rosterRows.map((l) => (
                    <tr
                      key={l.enrollmentId}
                      className="border-b border-border-subtle last:border-0 hover:bg-bg-surface"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={l.name} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/learners/view?id=${l.userId}`}
                              className="font-medium hover:text-accent"
                            >
                              {l.name}
                            </Link>
                            <p className="truncate text-xs text-text-muted">{l.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-dim">{formatDate(l.enrolledAt)}</td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <Progress value={l.progressPct} showValue />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={l.status === "completed" ? "success" : "neutral"}>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {relativeTime(l.lastAccessedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          {reviewRows.length === 0 ? (
            <p className="py-8 text-center text-text-dim">
              {reviews.loading ? "Loading…" : "No reviews for this course."}
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              {reviewRows.map((r) => {
                const author = r.author?.name ?? "Learner";
                return (
                  <Card
                    key={r.id}
                    surface="card"
                    padding="standard"
                    className="border border-border"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <Avatar name={author} size="md" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-medium">{author}</span>
                            <Stars rating={r.rating} size={13} />
                            <span className="text-xs text-text-muted">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-text-dim">{r.body}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => removeReview(r.id, author)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function LessonsPanel({
  slug,
  lessons,
  loading,
  onChanged,
}: {
  slug: string;
  lessons: import("@/lib/api").LessonSummary[];
  loading: boolean;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [section, setSection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lessons.reduce((n, l) => n + (l.minutes ?? 0), 0);
  const sections = [...new Set(lessons.map((l) => l.sectionTitle))];

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      // Group new lessons under the chosen section, defaulting to the last one.
      const sectionTitle = section || sections[sections.length - 1] || "Course content";
      const sectionOrder = Math.max(0, sections.indexOf(sectionTitle));
      const lesson = await admin.createLesson(slug, {
        title: title.trim(),
        minutes: Math.max(0, minutes),
        sectionTitle,
        sectionOrder: sectionOrder === -1 ? sections.length : sectionOrder,
      });
      setTitle("");
      setMinutes(10);
      onChanged();
      router.push(`/admin/courses/lesson?course=${slug}&lesson=${lesson.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the lesson.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, lessonTitle: string) {
    if (!confirm(`Delete lesson "${lessonTitle}"?`)) return;
    await admin.deleteLesson(slug, id).catch(() => {});
    onChanged();
  }

  return (
    <div className="mt-2">
      {error && (
        <p className="mb-3 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

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
        <div className="w-full sm:w-48">
          <Input
            label="Section"
            placeholder={sections[sections.length - 1] ?? "Course content"}
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-36">
          <Input
            type="number"
            label="Duration (min)"
            min={0}
            step={1}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </div>
        <Button type="submit" variant="primary" loading={busy} icon={<Plus size={16} />}>
          Add &amp; write
        </Button>
      </form>

      {lessons.length === 0 ? (
        <p className="py-8 text-center text-text-dim">
          {loading ? "Loading…" : "No lessons yet — add the first one above."}
        </p>
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
                    <span className="ml-2 text-xs text-text-muted">{l.sectionTitle}</span>
                  </Link>
                  {l.isPreview && <Badge variant="outline">Preview</Badge>}
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
                    onClick={() => remove(l.id, l.title)}
                  />
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-text-muted">
            <FileText size={12} /> {lessons.length} lessons · {shortDuration(total)} total
          </p>
        </>
      )}
    </div>
  );
}
