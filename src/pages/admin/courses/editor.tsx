import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Card, Input, Select, Switch, Textarea } from "@kaistrum/stratum-ui";
import { ArrowLeft, BookOpen, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  categories,
  formats,
  levels,
  type CourseFormat,
  type CourseLevel,
} from "@/data/courses";
import { useAdmin, type AdminCourse } from "@/context/AdminContext";

interface FormState {
  title: string;
  summary: string;
  categorySlug: string;
  tutorId: string;
  format: CourseFormat;
  level: CourseLevel;
  premium: boolean;
  priceKES: number | null;
  status: "draft" | "published";
}

export default function CourseEditor() {
  const router = useRouter();
  const { getCourse, addCourse, updateCourse, deleteCourse, tutors, tracks, lessonCount } =
    useAdmin();

  const editingSlug = typeof router.query.slug === "string" ? router.query.slug : null;
  const existing = editingSlug ? getCourse(editingSlug) : undefined;
  const isEdit = !!existing;

  const [form, setForm] = useState<FormState>({
    title: "",
    summary: "",
    categorySlug: tracks[0]?.slug ?? categories[0].slug,
    tutorId: tutors[0]?.id ?? "",
    format: "Web Course",
    level: "Beginner",
    premium: true,
    priceKES: 5900,
    status: "draft",
  });
  const [hydrated, setHydrated] = useState(false);

  // Populate from the existing course once the router is ready.
  useEffect(() => {
    if (!router.isReady || hydrated) return;
    if (isEdit && existing) {
      setForm({
        title: existing.title,
        summary: existing.summary,
        categorySlug: existing.categorySlug,
        tutorId: existing.tutorId,
        format: existing.format,
        level: existing.level,
        premium: existing.premium,
        priceKES: existing.priceKES,
        status: existing.status,
      });
    }
    setHydrated(true);
  }, [router.isReady, isEdit, existing, hydrated]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload: Omit<AdminCourse, "slug" | "createdAt"> = {
      ...form,
      priceKES: form.premium ? form.priceKES ?? 0 : null,
      // Course-level content lives on individual lessons now.
      contentHTML: existing?.contentHTML ?? "",
      lessons: existing?.lessons ?? 0,
      learners: existing?.learners ?? "0",
      rating: existing?.rating ?? 0,
    };
    if (isEdit && editingSlug) {
      updateCourse(editingSlug, payload);
      router.push(`/admin/courses/view?slug=${editingSlug}`);
    } else {
      const slug = addCourse(payload);
      // New course → straight to its page to start adding lessons.
      router.push(`/admin/courses/view?slug=${slug}`);
    }
  }

  function handleDelete() {
    if (isEdit && editingSlug && confirm(`Delete "${existing?.title}"?`)) {
      deleteCourse(editingSlug);
      router.push("/admin/courses");
    }
  }

  const lessons = editingSlug ? lessonCount(editingSlug) : 0;

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
                required
              />
              <Textarea
                label="Summary"
                placeholder="One-line description shown on cards"
                rows={3}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
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
                value={form.categorySlug}
                onChange={(e) => set("categorySlug", e.target.value)}
                options={tracks.map((c) => ({ value: c.slug, label: c.name }))}
              />
              <Select
                label="Tutor"
                value={form.tutorId}
                onChange={(e) => set("tutorId", e.target.value)}
                options={tutors.map((t) => ({ value: t.id, label: t.name }))}
              />
              <Select
                label="Format"
                value={form.format}
                onChange={(e) => set("format", e.target.value as CourseFormat)}
                options={formats.map((f) => ({ value: f, label: f }))}
              />
              <Select
                label="Level"
                value={form.level}
                onChange={(e) => set("level", e.target.value as CourseLevel)}
                options={levels.map((l) => ({ value: l, label: l }))}
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
                  <p className="text-sm font-medium">Lessons & content</p>
                  <p className="text-sm text-text-dim">
                    {isEdit
                      ? `${lessons} lesson${lessons === 1 ? "" : "s"}. Add lessons and write each lesson's content on the course page.`
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
              onChange={(e) => set("status", e.target.value as FormState["status"])}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ]}
            />
            <div className="mt-5 flex flex-col gap-2">
              <Button type="submit" variant="primary" fullWidth icon={<Save size={16} />}>
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
              <div className="mt-4">
                <Input
                  type="number"
                  label="Price (KES)"
                  min={0}
                  step={100}
                  value={form.priceKES ?? 0}
                  onChange={(e) => set("priceKES", Number(e.target.value))}
                />
              </div>
            )}
          </Card>
        </div>
      </form>
    </AdminLayout>
  );
}
