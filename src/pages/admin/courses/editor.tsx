import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Card, Input, Select, Switch, Textarea } from "@kaistrum/stratum-ui";
import { ArrowLeft, BookOpen, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  admin,
  type AdminCourseInput,
  type CourseFormat,
  type CourseLevel,
  type CourseStatus,
} from "@/lib/api";
import { FORMAT_KEYS, FORMAT_LABELS, LEVEL_KEYS, LEVEL_LABELS } from "@/lib/catalog";
import { invalidateTracks } from "@/hooks/useTracks";

interface FormState {
  title: string;
  summary: string;
  description: string;
  trackId: string;
  instructorId: string;
  format: CourseFormat;
  level: CourseLevel;
  premium: boolean;
  priceKES: number;
  originalPriceKES: number;
  status: CourseStatus;
  whatYouLearn: string;
  requirements: string;
}

const EMPTY: FormState = {
  title: "",
  summary: "",
  description: "",
  trackId: "",
  instructorId: "",
  format: "web_course",
  level: "beginner",
  premium: false,
  priceKES: 5900,
  originalPriceKES: 0,
  status: "draft",
  whatYouLearn: "",
  requirements: "",
};

const toLines = (value: string) =>
  value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export default function CourseEditor() {
  const router = useRouter();
  const { status: authStatus, isAdmin } = useAuth();

  const editingSlug = typeof router.query.slug === "string" ? router.query.slug : null;
  const isEdit = Boolean(editingSlug);

  const tracksQuery = useAsync(() => admin.tracks(), [], {
    enabled: authStatus === "authenticated",
  });
  const tutorsQuery = useAsync(() => admin.tutors(), [], {
    enabled: authStatus === "authenticated",
  });
  const existing = useAsync(() => admin.course(editingSlug as string), [editingSlug], {
    enabled: authStatus === "authenticated" && isEdit,
  });
  const lessons = useAsync(() => admin.lessons(editingSlug as string), [editingSlug], {
    enabled: authStatus === "authenticated" && isEdit,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const tracks = useMemo(() => tracksQuery.data ?? [], [tracksQuery.data]);
  const tutors = useMemo(() => tutorsQuery.data?.data ?? [], [tutorsQuery.data]);

  // A course cannot be saved without an instructor, so an empty tutor list is a
  // blocker rather than an empty dropdown. Distinguish "none exist yet" from
  // "the list failed to load" — the fixes are different.
  const tutorsUnavailable = !tutorsQuery.loading && tutors.length === 0;
  const noTutors = tutorsUnavailable && !tutorsQuery.error;

  // Populate from the loaded course, or seed sensible defaults for a new one.
  useEffect(() => {
    if (hydrated) return;
    if (isEdit) {
      const c = existing.data;
      if (!c) return;
      setForm({
        title: c.title,
        summary: c.summary ?? "",
        description: (c.description ?? []).join("\n\n"),
        trackId: c.track?.slug ?? "",
        instructorId: c.instructorId ?? "",
        format: c.format,
        level: c.level,
        premium: c.premium,
        priceKES: c.priceKES ?? 0,
        originalPriceKES: c.originalPriceKES ?? 0,
        status: c.status,
        whatYouLearn: (c.whatYouLearn ?? []).join("\n"),
        requirements: (c.requirements ?? []).join("\n"),
      });
      setHydrated(true);
    } else if (tracks.length && tutors.length) {
      setForm((f) => ({
        ...f,
        trackId: f.trackId || tracks[0].slug,
        instructorId: f.instructorId || tutors[0].id,
      }));
      setHydrated(true);
    }
  }, [hydrated, isEdit, existing.data, tracks, tutors]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    // Catch the missing instructor here rather than sending a request the API
    // will reject with a message pointing at a field name the UI doesn't use.
    if (isAdmin && !form.instructorId) {
      setFieldErrors({ instructorId: "Choose a tutor for this course" });
      setError(
        noTutors
          ? "This course needs a tutor, and none exist yet — create one first."
          : "Choose a tutor for this course.",
      );
      return;
    }

    const payload: AdminCourseInput = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      description: form.description
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
      trackId: form.trackId || undefined,
      format: form.format,
      level: form.level,
      premium: form.premium,
      priceKES: form.premium ? Number(form.priceKES) : null,
      originalPriceKES:
        form.premium && Number(form.originalPriceKES) > 0
          ? Number(form.originalPriceKES)
          : null,
      status: form.status,
      whatYouLearn: toLines(form.whatYouLearn),
      requirements: toLines(form.requirements),
    };
    // Only an admin may choose (or reassign) the instructor.
    if (isAdmin && form.instructorId) payload.instructorId = form.instructorId;

    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const saved = isEdit
        ? await admin.updateCourse(editingSlug as string, payload)
        : await admin.createCourse(payload);
      invalidateTracks();
      router.push(`/admin/courses/view?slug=${saved.slug}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields ?? {});
      } else {
        setError("Could not save the course.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingSlug || !confirm(`Delete "${form.title}"?`)) return;
    try {
      await admin.deleteCourse(editingSlug);
      invalidateTracks();
      router.push("/admin/courses");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the course.");
    }
  }

  const lessonCount = lessons.data?.length ?? 0;

  return (
    <AdminLayout
      title={isEdit ? "Edit course" : "New course"}
      actions={
        <Link
          href={isEdit ? `/admin/courses/view?slug=${editingSlug}` : "/admin/courses"}
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
        >
          <ArrowLeft size={15} /> Back
        </Link>
      }
    >
      <Head>
        <title>Admin · {isEdit ? "Edit" : "New"} course — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {noTutors && (
        <div className="mb-4 border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <p className="font-medium text-warning">No tutors exist yet</p>
          <p className="mt-1 text-text-dim">
            Every course must be assigned to a tutor, so create one before adding
            courses.{" "}
            <Link href="/admin/tutors/editor" className="text-accent hover:underline">
              Create a tutor →
            </Link>
          </p>
        </div>
      )}

      {tutorsQuery.error && (
        <div className="mb-4 border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
          <p className="font-medium text-danger">Could not load the tutor list</p>
          <p className="mt-1 text-text-dim">
            {tutorsQuery.error.message} — the course cannot be saved until this
            loads, since the tutor is required.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="flex flex-col gap-5">
          <Card surface="card" padding="standard" className="border border-border">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
              Details
            </h2>
            <div className="flex flex-col gap-4">
              <Input
                label="Course title"
                placeholder="e.g. Spatial SQL Crash Course"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                error={fieldErrors.title}
                required
              />
              <Textarea
                label="Summary"
                placeholder="One-line description shown on cards"
                rows={2}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                error={fieldErrors.summary}
              />
              <Textarea
                label="About this course"
                placeholder="One paragraph per block — separate them with a blank line."
                rows={6}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </Card>

          <Card surface="card" padding="standard" className="border border-border">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
              Organisation
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Track"
                value={form.trackId}
                onChange={(e) => set("trackId", e.target.value)}
                options={[
                  { value: "", label: "No track" },
                  ...tracks.map((t) => ({ value: t.slug, label: t.name })),
                ]}
              />
              <Select
                // The API calls this the course's `instructorId`; the console
                // calls the people tutors. Say both so the server's validation
                // message ("Choose an instructor") reads as the same field.
                label="Tutor (instructor)"
                value={form.instructorId}
                onChange={(e) => set("instructorId", e.target.value)}
                disabled={!isAdmin || noTutors}
                error={fieldErrors.instructorId}
                hint={isAdmin ? undefined : "Only an admin can reassign a course."}
                options={[
                  { value: "", label: noTutors ? "No tutors yet" : "Select a tutor…" },
                  ...tutors.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
              <Select
                label="Format"
                value={form.format}
                onChange={(e) => set("format", e.target.value as CourseFormat)}
                options={FORMAT_KEYS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))}
              />
              <Select
                label="Level"
                value={form.level}
                onChange={(e) => set("level", e.target.value as CourseLevel)}
                options={LEVEL_KEYS.map((l) => ({ value: l, label: LEVEL_LABELS[l] }))}
              />
            </div>
          </Card>

          <Card surface="card" padding="standard" className="border border-border">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
              Outcomes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Textarea
                label="What you'll learn"
                placeholder="One outcome per line"
                rows={6}
                value={form.whatYouLearn}
                onChange={(e) => set("whatYouLearn", e.target.value)}
              />
              <Textarea
                label="Requirements"
                placeholder="One requirement per line"
                rows={6}
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
              />
            </div>
          </Card>

          {/* Lessons live on the course page */}
          <Card surface="card" padding="standard" className="border border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center border border-border-strong text-accent">
                  <BookOpen size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium">Lessons &amp; content</p>
                  <p className="text-sm text-text-dim">
                    {isEdit
                      ? `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}. Add lessons and write each lesson's content on the course page.`
                      : "Save the course first, then add lessons and their content."}
                  </p>
                </div>
              </div>
              {isEdit && (
                <Link href={`/admin/courses/view?slug=${editingSlug}`} className="shrink-0">
                  <Button type="button" variant="outline" size="sm">
                    Manage lessons
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <Card surface="card" padding="standard" className="border border-border">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
              Publish
            </h2>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as CourseStatus)}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ]}
            />
            <div className="mt-5 flex flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={saving}
                disabled={isAdmin && tutorsUnavailable}
                icon={<Save size={16} />}
              >
                {isEdit ? "Save changes" : "Create course"}
              </Button>
              {isEdit && (
                <Button
                  type="button"
                  variant="danger"
                  fullWidth
                  icon={<Trash2 size={16} />}
                  onClick={handleDelete}
                >
                  Delete course
                </Button>
              )}
            </div>
          </Card>

          <Card surface="card" padding="standard" className="border border-border">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-text-muted">
              Pricing
            </h2>
            <Switch
              label="Premium course"
              description="Free courses are open to everyone"
              checked={form.premium}
              onChange={(e) => set("premium", e.target.checked)}
            />
            {form.premium && (
              <div className="mt-4 flex flex-col gap-4">
                <Input
                  type="number"
                  label="Price (KES)"
                  min={0}
                  step={100}
                  value={form.priceKES}
                  onChange={(e) => set("priceKES", Number(e.target.value))}
                  error={fieldErrors.priceKES}
                />
                <Input
                  type="number"
                  label="Was (KES, optional)"
                  min={0}
                  step={100}
                  value={form.originalPriceKES}
                  onChange={(e) => set("originalPriceKES", Number(e.target.value))}
                  error={fieldErrors.originalPriceKES}
                />
              </div>
            )}
          </Card>
        </div>
      </form>
    </AdminLayout>
  );
}
