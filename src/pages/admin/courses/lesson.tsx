import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Breadcrumb, Button, Card, Input, Switch } from "@kaistrum/stratum-ui";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link as TiptapLink, RichTextEditor } from "@mantine/tiptap";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin } from "@/lib/api";

export default function LessonEditor() {
  const router = useRouter();
  const { status } = useAuth();

  const courseSlug = typeof router.query.course === "string" ? router.query.course : null;
  const lessonId = typeof router.query.lesson === "string" ? router.query.lesson : null;
  const enabled = status === "authenticated" && Boolean(courseSlug && lessonId);

  const course = useAsync(() => admin.course(courseSlug as string), [courseSlug], {
    enabled: status === "authenticated" && Boolean(courseSlug),
  });
  const lesson = useAsync(
    () => admin.lesson(courseSlug as string, lessonId as string),
    [courseSlug, lessonId],
    { enabled },
  );

  const [title, setTitle] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink],
    content: "",
    immediatelyRender: false,
  });

  useEffect(() => {
    if (hydrated || !lesson.data || !editor) return;
    setTitle(lesson.data.title);
    setSectionTitle(lesson.data.sectionTitle);
    setMinutes(lesson.data.minutes);
    setVideoUrl(lesson.data.videoUrl ?? "");
    setIsPreview(lesson.data.isPreview);
    editor.commands.setContent(lesson.data.contentHTML || "<p>Write the lesson content here…</p>");
    setHydrated(true);
  }, [hydrated, lesson.data, editor]);

  const backHref = courseSlug ? `/admin/courses/view?slug=${courseSlug}` : "/admin/courses";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!courseSlug || !lessonId || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await admin.updateLesson(courseSlug, lessonId, {
        title: title.trim(),
        sectionTitle: sectionTitle.trim() || "Course content",
        minutes: Math.max(0, minutes),
        isPreview,
        videoUrl: videoUrl.trim(),
        contentHTML: editor?.getHTML() ?? "",
      });
      setSaved(true);
      router.push(backHref);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the lesson.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!courseSlug || !lessonId || !confirm(`Delete lesson "${title}"?`)) return;
    try {
      await admin.deleteLesson(courseSlug, lessonId);
      router.push(backHref);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the lesson.");
    }
  }

  if (lesson.loading || course.loading) {
    return (
      <AdminLayout title="Lesson">
        <p className="text-text-dim">Loading…</p>
      </AdminLayout>
    );
  }

  if (lesson.error || !lesson.data || !course.data) {
    return (
      <AdminLayout title="Lesson">
        <p className="text-text-dim">
          {lesson.error?.message ?? "Lesson not found."}{" "}
          <Link href={backHref} className="text-accent hover:underline">
            Back to course
          </Link>
        </p>
      </AdminLayout>
    );
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
            { label: course.data.title, href: backHref },
            { label: title || lesson.data.title },
          ]}
        />
      </div>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Content */}
        <Card
          surface="card"
          padding="standard"
          className="order-2 border border-border lg:order-1"
        >
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
                label="Section"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                hint="Lessons are grouped by section in the player."
              />
              <Input
                type="number"
                label="Duration (min)"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
              <Input
                type="url"
                label="Video URL"
                placeholder="https://…"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <Switch
                label="Free preview"
                description="Visible without enrolling"
                checked={isPreview}
                onChange={(e) => setIsPreview(e.target.checked)}
              />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={saving}
                icon={<Save size={16} />}
              >
                {saved ? "Saved" : "Save lesson"}
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
