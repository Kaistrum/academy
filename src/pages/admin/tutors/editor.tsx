import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar, Button, Card, Input, Textarea } from "@kaistrum/stratum-ui";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdmin } from "@/context/AdminContext";

interface TutorForm {
  name: string;
  title: string;
  email: string;
  bio: string;
  rating: number;
  students: string;
  courses: number;
}

const EMPTY: TutorForm = {
  name: "",
  title: "",
  email: "",
  bio: "",
  rating: 5,
  students: "0",
  courses: 0,
};

export default function TutorEditor() {
  const router = useRouter();
  const { getTutor, addTutor, updateTutor, deleteTutor } = useAdmin();

  const editingId = typeof router.query.id === "string" ? router.query.id : null;
  const existing = editingId ? getTutor(editingId) : undefined;
  const isEdit = !!existing;

  const [form, setForm] = useState<TutorForm>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!router.isReady || hydrated) return;
    if (isEdit && existing) {
      const { name, title, email, bio, rating, students, courses } = existing;
      setForm({ name, title, email, bio, rating, students, courses });
    }
    setHydrated(true);
  }, [router.isReady, isEdit, existing, hydrated]);

  const set = <K extends keyof TutorForm>(key: K, value: TutorForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (isEdit && editingId) updateTutor(editingId, form);
    else addTutor(form);
    router.push("/admin/tutors");
  }

  function handleDelete() {
    if (isEdit && editingId && confirm(`Delete tutor "${existing?.name}"?`)) {
      deleteTutor(editingId);
      router.push("/admin/tutors");
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

      <form onSubmit={handleSave} className="max-w-2xl">
        <Card surface="card" padding="standard" className="border border-border">
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={form.name || "New Tutor"} size="lg" />
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
              required
            />
            <Input
              label="Title"
              placeholder="e.g. Developer Advocate"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            <Input
              type="email"
              label="Email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <Input
              type="number"
              label="Rating"
              min={0}
              max={5}
              step={0.1}
              value={form.rating}
              onChange={(e) => set("rating", Number(e.target.value))}
            />
            <Input
              label="Students"
              placeholder="e.g. 12k"
              value={form.students}
              onChange={(e) => set("students", e.target.value)}
            />
            <Input
              type="number"
              label="Courses"
              min={0}
              value={form.courses}
              onChange={(e) => set("courses", Number(e.target.value))}
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Bio"
              rows={4}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="submit" variant="primary" icon={<Save size={16} />}>
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
