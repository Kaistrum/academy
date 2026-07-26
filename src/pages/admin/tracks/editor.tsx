import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Card, Input, Select, Textarea } from "@kaistrum/stratum-ui";
import { ArrowLeft, Layers, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { categoryIcons } from "@/components/categoryIcons";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ApiError, admin } from "@/lib/api";
import { invalidateTracks } from "@/hooks/useTracks";

const iconOptions = Object.keys(categoryIcons);

interface TrackForm {
  name: string;
  icon: string;
  blurb: string;
}

export default function TrackEditor() {
  const router = useRouter();
  const { status } = useAuth();
  const editingSlug = typeof router.query.slug === "string" ? router.query.slug : null;
  const isEdit = Boolean(editingSlug);

  const tracks = useAsync(() => admin.tracks(), [], {
    enabled: status === "authenticated",
  });
  const existing = (tracks.data ?? []).find((t) => t.slug === editingSlug);

  const [form, setForm] = useState<TrackForm>({ name: "", icon: iconOptions[0], blurb: "" });
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated || !isEdit || !existing) return;
    setForm({
      name: existing.name,
      icon: existing.icon ?? iconOptions[0],
      blurb: existing.blurb ?? "",
    });
    setHydrated(true);
  }, [hydrated, isEdit, existing]);

  const set = <K extends keyof TrackForm>(key: K, value: TrackForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const PreviewIcon = categoryIcons[form.icon] ?? Layers;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editingSlug) await admin.updateTrack(editingSlug, form);
      else await admin.createTrack(form);
      invalidateTracks();
      router.push("/admin/tracks");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the track.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingSlug || !confirm(`Delete track "${form.name}"?`)) return;
    try {
      await admin.deleteTrack(editingSlug);
      invalidateTracks();
      router.push("/admin/tracks");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the track.");
    }
  }

  return (
    <AdminLayout
      title={isEdit ? "Edit track" : "New track"}
      actions={
        <Link
          href="/admin/tracks"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
        >
          <ArrowLeft size={15} /> Back
        </Link>
      }
    >
      <Head>
        <title>Admin · {isEdit ? "Edit" : "New"} track — Kaistrum Academy</title>
      </Head>

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={handleSave} className="max-w-xl">
        <Card surface="card" padding="standard" className="border border-border">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center border border-border-strong text-accent">
              <PreviewIcon size={22} />
            </span>
            <div>
              <p className="font-medium">{form.name || "New track"}</p>
              <p className="text-sm text-text-dim">{form.blurb || "Track description"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Input
              label="Track name"
              placeholder="e.g. Spatial Analysis & Data Science"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
            <Select
              label="Icon"
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
              options={iconOptions.map((name) => ({ value: name, label: name }))}
            />
            <Textarea
              label="Description"
              placeholder="Short blurb shown on the topic tiles"
              rows={3}
              value={form.blurb}
              onChange={(e) => set("blurb", e.target.value)}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={saving} icon={<Save size={16} />}>
              {isEdit ? "Save changes" : "Create track"}
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
