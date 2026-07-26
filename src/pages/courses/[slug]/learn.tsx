import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link as TiptapLink, RichTextEditor } from "@mantine/tiptap";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  PlayCircle,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { useEnrollments } from "@/context/EnrollmentsContext";
import {
  ApiError,
  courses as coursesApi,
  enrollments as enrollmentsApi,
  type LessonSummary,
} from "@/lib/api";

export default function LearnPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : null;
  const lessonParam = typeof router.query.lesson === "string" ? router.query.lesson : null;

  const { user, status } = useAuth();
  const { reload: reloadEnrollments } = useEnrollments();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curriculum = useAsync(
    () => coursesApi.curriculum(slug as string),
    [slug, user?.id],
    { enabled: Boolean(slug) },
  );

  const flat: LessonSummary[] = useMemo(
    () => (curriculum.data?.sections ?? []).flatMap((s) => s.lessons),
    [curriculum.data],
  );

  // Open the deep-linked lesson, else resume on the first unfinished one.
  useEffect(() => {
    if (activeId || flat.length === 0) return;
    if (lessonParam && flat.some((l) => l.id === lessonParam)) {
      setActiveId(lessonParam);
      return;
    }
    const next = flat.find((l) => !l.completed && !l.locked) ?? flat[0];
    setActiveId(next.id);
  }, [flat, lessonParam, activeId]);

  const lesson = useAsync(
    () => coursesApi.lesson(slug as string, activeId as string),
    [slug, activeId],
    { enabled: Boolean(slug && activeId) },
  );

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink],
    content: "",
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(lesson.data?.contentHTML || "<p></p>");
  }, [editor, lesson.data?.contentHTML]);

  const index = flat.findIndex((l) => l.id === activeId);
  const total = flat.length;
  const completedCount = flat.filter((l) => l.completed).length;
  const progressPct = total ? Math.round((completedCount / total) * 100) : 0;

  function openLesson(id: string) {
    setActiveId(id);
    setError(null);
    router.replace(
      { pathname: router.pathname, query: { slug, lesson: id } },
      undefined,
      { shallow: true },
    );
  }

  /** Ticks the lesson off server-side, then moves on. */
  async function completeAndContinue() {
    const enrollmentId = lesson.data?.enrollmentId;
    if (!enrollmentId || !activeId) {
      setError("Enrol in this course to track your progress.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await enrollmentsApi.completeLesson(enrollmentId, activeId);
      curriculum.reload();
      reloadEnrollments();
      const next = flat[index + 1];
      if (next) openLesson(next.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your progress.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || curriculum.loading || !slug) {
    return (
      <div className="min-h-screen bg-bg p-8 text-text">
        <div className="h-6 w-64 animate-pulse bg-bg-card" />
      </div>
    );
  }

  if (curriculum.error || !curriculum.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-4 text-center text-text">
        <div>
          <h1 className="text-xl font-semibold">Course unavailable</h1>
          <p className="mt-2 text-text-dim">
            {curriculum.error?.message ?? "We couldn't load this course."}
          </p>
          <Link href="/courses" className="mt-4 inline-block text-accent hover:underline">
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  const course = curriculum.data;
  const current = flat[index];

  return (
    <div className="min-h-screen bg-bg text-text">
      <Head>
        <title>{`${current ? `${current.title} — ` : ""}${course.title}`}</title>
      </Head>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-nav-bg backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-text-dim hover:text-text"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to course</span>
          </Link>
          <div className="mx-2 h-5 w-px bg-border" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{course.title}</span>
          <span className="hidden text-xs text-text-muted sm:inline">
            Lesson {Math.max(index + 1, 1)} of {total}
          </span>
          <div className="hidden h-1.5 w-28 overflow-hidden bg-bg-card md:block">
            <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
          </div>
          <Link href="/my-learning" className="text-sm font-medium text-accent hover:underline">
            Exit
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-[300px_1fr]">
        {/* ── Curriculum sidebar ── */}
        <aside className="border-b border-border lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="p-4">
            <p className="px-2 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
              Course content
            </p>
          </div>
          <nav className="flex flex-col pb-6">
            {course.sections.map((section, si) => (
              <div key={`${section.title}-${si}`} className="mb-2">
                <p className="px-6 py-2 text-xs font-semibold text-text-dim">
                  {String(si + 1).padStart(2, "0")}. {section.title}
                </p>
                <ul>
                  {section.lessons.map((l) => {
                    const active = l.id === activeId;
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => openLesson(l.id)}
                          className={[
                            "flex w-full items-center gap-2.5 px-6 py-2 text-left text-sm transition-colors",
                            active
                              ? "border-l-2 border-accent bg-accent-faint text-text"
                              : "border-l-2 border-transparent text-text-dim hover:bg-bg-surface",
                          ].join(" ")}
                        >
                          <span className="shrink-0">
                            {l.completed ? (
                              <Check size={15} className="text-success" />
                            ) : active ? (
                              <PlayCircle size={15} className="text-accent" />
                            ) : l.locked ? (
                              <Lock size={13} className="text-text-muted" />
                            ) : (
                              <PlayCircle size={15} className="text-text-muted" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          <span className="shrink-0 text-xs text-text-muted">{l.minutes}m</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Lesson content ── */}
        <main className="min-w-0">
          <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
            {!current ? (
              <p className="text-text-dim">This course has no lessons yet.</p>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                  {current.sectionTitle} · Lesson {index + 1}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  {current.title}
                </h1>

                {lesson.error ? (
                  <div className="mt-8 border border-dashed border-border bg-bg-card p-10 text-center">
                    <Lock size={26} className="mx-auto text-text-muted" />
                    <p className="mt-3 text-lg font-medium">
                      {lesson.error.code === "LESSON_LOCKED"
                        ? "This lesson is locked"
                        : "Lesson unavailable"}
                    </p>
                    <p className="mt-1 text-text-dim">{lesson.error.message}</p>
                    <Link
                      href={`/courses/${slug}`}
                      className="mt-4 inline-block bg-accent px-4 py-2 text-sm font-medium text-text-on-accent"
                    >
                      {user ? "Go to the course page" : "Sign in to enrol"}
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Video */}
                    <div className="course-media relative mt-6 flex aspect-video items-center justify-center overflow-hidden border border-border">
                      {lesson.data?.videoUrl ? (
                        <video
                          key={lesson.data.videoUrl}
                          className="h-full w-full"
                          controls
                          src={lesson.data.videoUrl}
                        />
                      ) : (
                        <>
                          <div className="noise-overlay opacity-30" aria-hidden />
                          <span className="relative text-sm text-text-muted">
                            No video for this lesson
                          </span>
                        </>
                      )}
                    </div>

                    {/* Lesson body */}
                    <div className="mt-8">
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
                          Lesson notes
                        </h2>
                        <span className="text-xs text-text-muted">
                          {lesson.data?.minutes ?? current.minutes} min read
                        </span>
                      </div>
                      {editor && !lesson.loading ? (
                        <RichTextEditor editor={editor}>
                          <RichTextEditor.Content />
                        </RichTextEditor>
                      ) : (
                        <div className="h-64 animate-pulse bg-bg-card" />
                      )}
                    </div>

                    {error && (
                      <p className="mt-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
                        {error}
                      </p>
                    )}

                    {/* Lesson navigation */}
                    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                      <button
                        type="button"
                        disabled={index <= 0}
                        onClick={() => openLesson(flat[index - 1].id)}
                        className="inline-flex items-center gap-1.5 text-sm text-text-dim enabled:hover:text-text disabled:opacity-40"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      {index < total - 1 ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={completeAndContinue}
                          className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60"
                        >
                          {saving ? "Saving…" : "Mark complete & continue"}{" "}
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={async () => {
                            await completeAndContinue();
                            router.push(`/courses/${slug}?tab=reviews`);
                          }}
                          className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60"
                        >
                          Finish &amp; review <Check size={16} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
