import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, Button, Card, Input, Textarea } from "@kaistrum/stratum-ui";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin } from "@/lib/api";

interface TutorForm {
  name: string;
  title: string;
  email: string;
  bio: string;
  avatarUrl: string;
}

const EMPTY: TutorForm = { name: "", title: "", email: "", bio: "", avatarUrl: "" };

export default function TutorEditor() {
  const router = useRouter();
  const { status } = useAuth();
  const editingId = typeof router.query.id === "string" ? router.query.id : null;
  const isEdit = Boolean(editingId);

  const tutors = useAsync(() => admin.tutors(), [], {
    enabled: status === "authenticated",
  });
  const existing = (tutors.data?.data ?? []).find((t) => t.id === editingId);

  const [form, setForm] = useState<TutorForm>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hydrated || !isEdit || !existing) return;
    setForm({
      name: existing.name,
      title: existing.title ?? "",
      email: existing.email ?? "",
      bio: existing.bio ?? "",
      avatarUrl: existing.avatarUrl ?? "",
    });
    setHydrated(true);
  }, [hydrated, isEdit, existing]);

  const set = <K extends keyof TutorForm>(key: K, value: TutorForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});

    // The API rejects an empty string where it expects an email or a URL.
    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      bio: form.bio.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.avatarUrl.trim() ? { avatarUrl: form.avatarUrl.trim() } : {}),
    };

    try {
      if (isEdit && editingId) await admin.updateTutor(editingId, payload);
      else await admin.createTutor(payload);
      router.push("/admin/tutors");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields ?? {});
      } else {
        setError("Could not save the tutor.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId || !confirm(`Delete tutor "${form.name}"?`)) return;
    try {
      await admin.deleteTutor(editingId);
      router.push("/admin/tutors");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the tutor.");
    }
  }

  return (
    <AdminLayout
      title={isEdit ? "Edit tutor" : "New tutor"}
      actions={
        <Link
          href="/admin/tutors"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
        >
          <ArrowLeft size={15} /> Back
        </Link>
      }
    >
      <Head>
        <title>Admin · {isEdit ? "Edit" : "New"} tutor — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="max-w-2xl">
        <Card surface="card" padding="standard" className="border border-border">
          <div className="mb-5 flex items-center gap-3">
            <Avatar
              name={form.name || "New Tutor"}
              src={form.avatarUrl || undefined}
              size="lg"
            />
            <div>
              <p className="font-medium">{form.name || "New tutor"}</p>
              <p className="text-sm text-text-dim">{form.title || "Title"}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={fieldErrors.name}
              required
            />
            <Input
              label="Title"
              placeholder="e.g. Developer Advocate"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              error={fieldErrors.title}
            />
            <Input
              type="email"
              label="Email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={fieldErrors.email}
            />
            <Input
              type="url"
              label="Avatar URL"
              placeholder="https://…"
              value={form.avatarUrl}
              onChange={(e) => set("avatarUrl", e.target.value)}
              error={fieldErrors.avatarUrl}
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Bio"
              rows={4}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              error={fieldErrors.bio}
            />
          </div>

          <p className="mt-4 text-xs text-text-muted">
            Rating, course and learner totals are calculated from published courses.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={saving} icon={<Save size={16} />}>
              {isEdit ? "Save changes" : "Create tutor"}
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </Card>
      </form>
    </AdminLayout>
  );
}
