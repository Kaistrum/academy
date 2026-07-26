import Head from "next/head";
import Link from "next/link";
import { Button } from "@kaistrum/stratum-ui";
import { Heart } from "lucide-react";
import Layout from "@/components/Layout";
import { CourseCard } from "@/components/CourseCard";
import { useAuth } from "@/context/AuthContext";
import { useFavourites } from "@/context/FavouritesContext";
import { toViewCourse } from "@/lib/catalog";

export default function FavouritesPage() {
  const { status } = useAuth();
  const { saved, loading } = useFavourites();

  return (
    <Layout>
      <Head>
        <title>Saved courses — Kaistrum Academy</title>
        <meta name="description" content="Courses you've saved to your favourites." />
      </Head>

      <section className="border-b border-border bg-bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-6 md:pt-20">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-border-strong text-accent">
              <Heart size={20} fill="currentColor" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Saved courses
              </h1>
              <p className="mt-1 text-text-dim">
                {saved.length} {saved.length === 1 ? "course" : "courses"} in your favourites.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {status === "anonymous" ? (
          <div className="border border-dashed border-border bg-bg-card p-12 text-center">
            <Heart size={28} className="mx-auto text-text-muted" />
            <p className="mt-3 text-lg font-medium">Sign in to see your saved courses</p>
            <p className="mt-1 text-text-dim">
              Favourites are tied to your account, so they follow you between devices.
            </p>
            <Link href="/signin?next=/favourites">
              <Button variant="primary" className="mt-5">
                Sign in
              </Button>
            </Link>
          </div>
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse border border-border bg-bg-card" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="border border-dashed border-border bg-bg-card p-12 text-center">
            <Heart size={28} className="mx-auto text-text-muted" />
            <p className="mt-3 text-lg font-medium">No saved courses yet</p>
            <p className="mt-1 text-text-dim">
              Tap the heart on any course to save it here for later.
            </p>
            <Link href="/courses">
              <Button variant="primary" className="mt-5">
                Browse courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((course) => (
              <CourseCard key={course.slug} course={toViewCourse(course)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
