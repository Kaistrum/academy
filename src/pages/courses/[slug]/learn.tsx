import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
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
import {
  courses,
  getCourse,
  lessonContentHTML,
  type Course,
} from "@/data/courses";
import { getEnrollment } from "@/data/enrollment";

interface Props {
  course: Course;
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: courses.map((c) => ({ params: { slug: c.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  const course = getCourse(params?.slug as string);
  if (!course) return { notFound: true };
  return { props: { course } };
};

export default function LearnPage({ course }: Props) {
  const enrollment = getEnrollment(course.slug);
  const completedCount = enrollment?.completedLessons ?? 0;

  // Flatten the curriculum into a single ordered list of lessons.
  const flat = useMemo(
    () =>
      course.curriculum.flatMap((section, si) =>
        section.lessons.map((lesson) => ({ section: section.title, si, lesson })),
      ),
    [course],
  );
  const total = flat.length;

  // Start on the first not-yet-completed lesson.
  const [index, setIndex] = useState(() =>
    Math.min(completedCount, total - 1),
  );
  const current = flat[index];

  const htmlFor = (i: number) =>
    lessonContentHTML(course, flat[i].section, flat[i].lesson);

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink],
    content: htmlFor(index),
    immediatelyRender: false,
  });

  // Swap the editor's content whenever the active lesson changes.
  useEffect(() => {
    editor?.commands.setContent(htmlFor(index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, editor]);

  const progressPct = Math.round(((index + 1) / total) * 100);

  return (
    <div className="min-h-screen bg-bg text-text">
      <Head>
        <title>
          {current.lesson.title} — {course.title}
        </title>
      </Head>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-nav-bg backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-2 text-sm text-text-dim hover:text-text"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to course</span>
          </Link>
          <div className="mx-2 h-5 w-px bg-border" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {course.title}
          </span>
          <span className="hidden text-xs text-text-muted sm:inline">
            Lesson {index + 1} of {total}
          </span>
          <div className="hidden h-1.5 w-28 overflow-hidden bg-bg-card md:block">
            <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
          </div>
          <Link
            href="/my-learning"
            className="text-sm font-medium text-accent hover:underline"
          >
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
            {course.curriculum.map((section, si) => {
              const offset = flat.findIndex((f) => f.si === si);
              return (
                <div key={si} className="mb-2">
                  <p className="px-6 py-2 text-xs font-semibold text-text-dim">
                    {String(si + 1).padStart(2, "0")}. {section.title}
                  </p>
                  <ul>
                    {section.lessons.map((lesson, j) => {
                      const gi = offset + j;
                      const done = gi < completedCount;
                      const active = gi === index;
                      return (
                        <li key={j}>
                          <button
                            type="button"
                            onClick={() => setIndex(gi)}
                            className={[
                              "flex w-full items-center gap-2.5 px-6 py-2 text-left text-sm transition-colors",
                              active
                                ? "border-l-2 border-accent bg-accent-faint text-text"
                                : "border-l-2 border-transparent text-text-dim hover:bg-bg-surface",
                            ].join(" ")}
                          >
                            <span className="shrink-0">
                              {done ? (
                                <Check size={15} className="text-success" />
                              ) : active ? (
                                <PlayCircle size={15} className="text-accent" />
                              ) : lesson.preview ? (
                                <PlayCircle size={15} className="text-text-muted" />
                              ) : (
                                <Lock size={13} className="text-text-muted" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                            <span className="shrink-0 text-xs text-text-muted">
                              {lesson.minutes}m
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Lesson content ── */}
        <main className="min-w-0">
          <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
              {current.section} · Lesson {index + 1}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {current.lesson.title}
            </h1>

            {/* Video placeholder */}
            <div className="course-media relative mt-6 flex aspect-video items-center justify-center overflow-hidden border border-border">
              <div className="noise-overlay opacity-30" aria-hidden />
              <button
                aria-label="Play lesson video"
                className="relative grid h-16 w-16 place-items-center rounded-full bg-accent text-text-on-accent shadow-md transition-transform hover:scale-105"
              >
                <PlayCircle size={30} />
              </button>
            </div>

            {/* Rich text lesson content (Mantine + Tiptap) */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
                  Lesson notes
                </h2>
                <span className="text-xs text-text-muted">Editable · powered by Tiptap</span>
              </div>
              {editor ? (
                <RichTextEditor editor={editor}>
                  <RichTextEditor.Toolbar sticky stickyOffset={56}>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Bold />
                      <RichTextEditor.Italic />
                      <RichTextEditor.Strikethrough />
                      <RichTextEditor.Code />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.H2 />
                      <RichTextEditor.H3 />
                      <RichTextEditor.H4 />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.BulletList />
                      <RichTextEditor.OrderedList />
                      <RichTextEditor.Blockquote />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Link />
                      <RichTextEditor.Unlink />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Undo />
                      <RichTextEditor.Redo />
                    </RichTextEditor.ControlsGroup>
                  </RichTextEditor.Toolbar>
                  <RichTextEditor.Content />
                </RichTextEditor>
              ) : (
                <div className="h-64 animate-pulse bg-bg-card" />
              )}
            </div>

            {/* Lesson navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 text-sm text-text-dim enabled:hover:text-text disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {index < total - 1 ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                  className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-text-on-accent transition-colors hover:bg-accent-strong"
                >
                  Mark complete &amp; continue <ChevronRight size={16} />
                </button>
              ) : (
                <Link
                  href={`/courses/${course.slug}?tab=reviews`}
                  className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-text-on-accent transition-colors hover:bg-accent-strong"
                >
                  Finish &amp; review <Check size={16} />
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
