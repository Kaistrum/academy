import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Card, Input, Select, Textarea } from "@kaistrum/stratum-ui";
import { ArrowLeft, Layers, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { categoryIcons } from "@/components/categoryIcons";
import { useAdmin } from "@/context/AdminContext";

const iconOptions = Object.keys(categoryIcons);

interface TrackForm {
  name: string;
  icon: string;
  blurb: string;
}

export default function TrackEditor() {
  const router = useRouter();
  const { getTrack, addTrack, updateTrack, deleteTrack, courses } = useAdmin();

  const editingSlug = typeof router.query.slug === "string" ? router.query.slug : null;
  const existing = editingSlug ? getTrack(editingSlug) : undefined;
  const isEdit = !!existing;

  const [form, setForm] = useState<TrackForm>({ name: "", icon: iconOptions[0], blurb: "" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!router.isReady || hydrated) return;
    if (isEdit && existing) {
      setForm({ name: existing.name, icon: existing.icon, blurb: existing.blurb });
    }
    setHydrated(true);
  }, [router.isReady, isEdit, existing, hydrated]);

  const set = <K extends keyof TrackForm>(key: K, value: TrackForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const PreviewIcon = categoryIcons[form.icon] ?? Layers;
  const courseCount = editingSlug
    ? courses.filter((c) => c.categorySlug === editingSlug).length
    : 0;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (isEdit && editingSlug) updateTrack(editingSlug, form);
    else addTrack(form);
    router.push("/admin/tracks");
  }

  function handleDelete() {
    if (!isEdit || !editingSlug) return;
    if (courseCount > 0) {
      alert(`“${existing?.name}” still has ${courseCount} course(s). Reassign them first.`);
      return;
    }
    if (confirm(`Delete track "${existing?.name}"?`)) {
      deleteTrack(editingSlug);
      router.push("/admin/tracks");
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
            <Button type="submit" variant="primary" icon={<Save size={16} />}>
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
