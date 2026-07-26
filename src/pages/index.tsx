import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Badge, Button, Grid, Section } from "@kaistrum/stratum-ui";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import Contact from "@/components/Contact";
import { CourseCard } from "@/components/CourseCard";
import { categoryIcons } from "@/components/categoryIcons";
import { useAsync } from "@/hooks/useAsync";
import { useTracks } from "@/hooks/useTracks";
import { courses as coursesApi } from "@/lib/api";
import { toViewCourse } from "@/lib/catalog";

const popular = ["Spatial SQL", "Python", "Web maps", "Remote sensing", "3D scenes"];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { tracks } = useTracks();

  const featured = useAsync(() => coursesApi.featured(6), []);
  // One page of the catalogue backs the headline numbers below.
  const sample = useAsync(() => coursesApi.list({ pageSize: 100, sort: "popular" }), []);

  const totalCourses = sample.data?.meta.total ?? 0;
  const rated = (sample.data?.data ?? []).filter((c) => c.ratingCount > 0);
  const averageRating = rated.length
    ? (rated.reduce((sum, c) => sum + c.ratingAvg, 0) / rated.length).toFixed(1)
    : "—";
  const learners = (sample.data?.data ?? []).reduce((sum, c) => sum + c.learnersCount, 0);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/courses?q=${encodeURIComponent(query.trim())}` : "/courses");
  }

  return (
    <Layout>
      <Head>
        <title>Kaistrum Academy — Learn spatial data, hands-on</title>
        <meta
          name="description"
          content="Project-based courses in mapping, spatial analysis, remote sensing and geospatial development."
        />
      </Head>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border bg-bg-surface">
        <div className="noise-overlay opacity-40" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% -10%, var(--accent-faint), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center md:px-6 md:py-28">
          <Badge variant="accent" icon={<Sparkles size={12} />} className="mb-6">
            {totalCourses ? `${totalCourses} courses` : "Courses"} · {tracks.length} tracks
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Explore our{" "}
            <span
              className="italic text-accent"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              courses
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-text-dim md:text-lg">
            Practical, project-based training in mapping, spatial analysis, remote
            sensing and geospatial development — taught by working practitioners.
          </p>

          <form onSubmit={submitSearch} className="mx-auto mt-8 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, topics, skills…"
                aria-label="Search courses"
                className="h-12 w-full border border-border-strong bg-bg pl-11 pr-4 text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="lg">
              Search
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
            <span>Popular:</span>
            {popular.map((p) => (
              <Link
                key={p}
                href={`/courses?q=${encodeURIComponent(p)}`}
                className="border border-border px-2.5 py-0.5 text-text-dim transition-colors hover:border-accent hover:text-accent"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <Section spacing="compact" surface="bg">
        <dl className="grid grid-cols-2 gap-6 border-y border-border py-8 md:grid-cols-4">
          {[
            { value: totalCourses ? String(totalCourses) : "—", label: "Courses & tutorials" },
            {
              value: learners ? learners.toLocaleString("en-KE") : "—",
              label: "Enrolled learners",
            },
            { value: averageRating === "—" ? "—" : `${averageRating}★`, label: "Average rating" },
            { value: tracks.length ? String(tracks.length) : "—", label: "Topic tracks" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <dt className="text-3xl font-semibold tracking-tight text-text md:text-4xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-sm text-text-dim">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Browse by topic ── */}
      <Section id="topics" spacing="standard" surface="surface">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Browse by topic</h2>
          <p className="mt-2 text-text-dim">Find your track and go deep.</p>
        </div>
        <Grid columns={4} gap="md">
          {tracks.map((cat) => {
            const Icon = cat.icon ? categoryIcons[cat.icon] : undefined;
            return (
              <Link
                key={cat.slug}
                href={`/courses?category=${cat.slug}`}
                className="group flex flex-col gap-3 border border-border bg-bg-card p-5 transition-colors hover:border-accent"
              >
                <span className="grid h-11 w-11 place-items-center border border-border-strong text-accent transition-colors group-hover:border-accent group-hover:bg-accent-faint">
                  {Icon ? <Icon size={22} strokeWidth={1.7} /> : null}
                </span>
                <span className="font-medium leading-snug">{cat.name}</span>
                <span className="text-sm text-text-dim">{cat.blurb}</span>
              </Link>
            );
          })}
        </Grid>
      </Section>

      {/* ── Featured courses ── */}
      <Section spacing="standard" surface="bg">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Featured courses</h2>
            <p className="mt-2 text-text-dim">Hand-picked, recently updated.</p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:gap-2.5"
          >
            View all courses <ArrowRight size={16} />
          </Link>
        </div>

        {featured.loading ? (
          <Grid columns={3} gap="md">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse border border-border bg-bg-card" />
            ))}
          </Grid>
        ) : featured.error ? (
          <p className="border border-dashed border-border bg-bg-card p-8 text-center text-text-dim">
            {featured.error.message}
          </p>
        ) : (
          <Grid columns={3} gap="md">
            {(featured.data ?? []).map((course) => (
              <CourseCard key={course.slug} course={toViewCourse(course)} />
            ))}
          </Grid>
        )}
      </Section>

      {/* ── Contact ── */}
      <Contact />
    </Layout>
  );
}
