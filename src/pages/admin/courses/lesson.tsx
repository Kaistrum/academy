import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Breadcrumb, Button, Card, Input } from "@kaistrum/stratum-ui";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link as TiptapLink, RichTextEditor } from "@mantine/tiptap";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdmin } from "@/context/AdminContext";

export default function LessonEditor() {
  const router = useRouter();
  const { getLesson, getCourse, updateLesson, deleteLesson } = useAdmin();

  // Resolve ?course= & ?lesson= deterministically after mount.
  const [ids, setIds] = useState<{ course: string | null; lesson: string | null }>({
    course: null,
    lesson: null,
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const course = (router.query.course as string) ?? params.get("course");
    const lesson = (router.query.lesson as string) ?? params.get("lesson");
    setIds({ course, lesson });
    setReady(true);
  }, [router.query.course, router.query.lesson]);

  const lesson = ids.lesson ? getLesson(ids.lesson) : undefined;
  const course = ids.course ? getCourse(ids.course) : undefined;

  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink],
    content: "",
    immediatelyRender: false,
  });

  useEffect(() => {
    if (hydrated || !lesson || !editor) return;
    setTitle(lesson.title);
    setMinutes(lesson.minutes);
    editor.commands.setContent(
      lesson.contentHTML || "<p>Write the lesson content here…</p>",
    );
    setHydrated(true);
  }, [hydrated, lesson, editor]);

  const backHref = ids.course ? `/admin/courses/view?slug=${ids.course}` : "/admin/courses";

  if (!lesson || !course) {
    return (
      <AdminLayout title="Lesson">
        <p className="text-text-dim">
          {ready ? "Lesson not found." : "Loading…"}{" "}
          <Link href={backHref} className="text-accent hover:underline">
            Back to course
          </Link>
        </p>
      </AdminLayout>
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!ids.lesson || !title.trim()) return;
    updateLesson(ids.lesson, {
      title: title.trim(),
      minutes: Math.max(0, minutes),
      contentHTML: editor?.getHTML() ?? "",
    });
    router.push(backHref);
  }

  function handleDelete() {
    if (ids.lesson && confirm(`Delete lesson "${lesson?.title}"?`)) {
      deleteLesson(ids.lesson);
      router.push(backHref);
    }
  }

  return (
    <AdminLayout
      title="Edit lesson"
      actions={
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
        >
          <ArrowLeft size={15} /> Back to course
        </Link>
      }
    >
      <Head>
        <title>Admin · Edit lesson — Kaistrum Academy</title>
      </Head>

      <div className="mb-5">
        <Breadcrumb
          items={[
            { label: "Courses", href: "/admin/courses" },
            { label: course.title, href: backHref },
            { label: title || lesson.title },
          ]}
        />
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Content */}
        <Card surface="card" padding="standard" className="order-2 border border-border lg:order-1">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
              Lesson content
            </h2>
            <span className="text-xs text-text-muted">Rich text · powered by Tiptap</span>
          </div>
          {editor ? (
            <RichTextEditor editor={editor}>
              <RichTextEditor.Toolbar sticky stickyOffset={72}>
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
        </Card>

        {/* Meta */}
        <div className="order-1 flex flex-col gap-5 lg:order-2">
          <Card surface="card" padding="standard" className="border border-border">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
              Lesson
            </h2>
            <div className="flex flex-col gap-4">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                type="number"
                label="Duration (min)"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button type="submit" variant="primary" fullWidth icon={<Save size={16} />}>
                Save lesson
              </Button>
              <Button
                type="button"
                variant="danger"
                fullWidth
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
              >
                Delete lesson
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </AdminLayout>
  );
}
