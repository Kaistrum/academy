import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { CourseCard } from "@/components/CourseCard";
import { categoryIcons } from "@/components/categoryIcons";
import { categories, courses } from "@/data/courses";

export default function TracksPage() {
  return (
    <Layout>
      <Head>
        <title>Explore tracks — Kaistrum Academy</title>
        <meta
          name="description"
          content="Browse Kaistrum Academy by topic track — from getting started to 3D visualization."
        />
      </Head>

      {/* Header */}
      <section className="border-b border-border bg-bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-6 md:pt-20">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Explore tracks</h1>
          <p className="mt-2 max-w-2xl text-text-dim">
            {categories.length} tracks covering the full spatial-data workflow. Pick a track and
            go deep.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href={`#${cat.slug}`}
                className="border border-border px-3 py-1.5 text-sm text-text-dim transition-colors hover:border-accent hover:text-accent"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col gap-16">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.icon];
            const trackCourses = courses.filter((c) => c.category === cat.name);
            const shown = trackCourses.slice(0, 3);
            return (
              <section key={cat.slug} id={cat.slug} className="scroll-mt-24">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center border border-border-strong text-accent">
                      {Icon ? <Icon size={22} strokeWidth={1.7} /> : null}
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                        {cat.name}
                      </h2>
                      <p className="mt-1 max-w-xl text-text-dim">{cat.blurb}</p>
                    </div>
                  </div>
                  <Link
                    href={`/courses?category=${cat.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:gap-2.5"
                  >
                    View all {trackCourses.length} courses <ArrowRight size={16} />
                  </Link>
                </div>

                {shown.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((course) => (
                      <CourseCard key={course.slug} course={course} />
                    ))}
                  </div>
                ) : (
                  <p className="text-text-dim">No courses in this track yet.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
