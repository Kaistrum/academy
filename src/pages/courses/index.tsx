import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Badge,
  Checkbox,
  IconButton,
  Pagination,
  Select,
  Stack,
} from "@kaistrum/stratum-ui";
import {
  Clock,
  LayoutGrid,
  List,
  Lock,
  PlayCircle,
  Search,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import { CourseCard } from "@/components/CourseCard";
import { Stars } from "@/components/Stars";
import {
  categories,
  courses,
  formats,
  formatDuration,
  levels,
  totalMinutes,
  type Course,
} from "@/data/courses";

const PAGE_SIZE = 6;

type SortKey = "recent" | "rating" | "popular" | "az" | "shortest";

const sortOptions = [
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "az", label: "Title (A–Z)" },
  { value: "shortest", label: "Shortest First" },
];

function parseLearners(s: string): number {
  const n = parseFloat(s);
  return s.toLowerCase().includes("k") ? n * 1000 : n;
}

export default function CoursesPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [format, setFormat] = useState("all");
  const [level, setLevel] = useState("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Hydrate filters from the URL once the router is ready (supports deep links
  // like /courses?category=mapping or /courses?q=python from the home page).
  useEffect(() => {
    if (!router.isReady) return;
    const { q: qq, category: c, format: f, access } = router.query;
    if (typeof qq === "string") setQ(qq);
    if (typeof c === "string") setCategory(c);
    if (typeof f === "string") setFormat(f);
    if (access === "free") setFreeOnly(true);
    if (access === "premium") setPremiumOnly(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const categoryName = useMemo(
    () => categories.find((c) => c.slug === category)?.name ?? null,
    [category],
  );

  const filtered = useMemo(() => {
    let list = courses.slice();
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(term) ||
          c.summary.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term),
      );
    }
    if (categoryName) list = list.filter((c) => c.category === categoryName);
    if (format !== "all") list = list.filter((c) => c.format === format);
    if (level !== "all") list = list.filter((c) => c.level === level);
    if (freeOnly) list = list.filter((c) => !c.premium);
    if (premiumOnly) list = list.filter((c) => c.premium);

    switch (sort) {
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
        list.sort((a, b) => parseLearners(b.learners) - parseLearners(a.learners));
        break;
      case "az":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "shortest":
        list.sort((a, b) => totalMinutes(a) - totalMinutes(b));
        break;
      default:
        list.sort((a, b) => b.addedOrder - a.addedOrder);
    }
    return list;
  }, [q, categoryName, format, level, freeOnly, premiumOnly, sort]);

  // Reset to page 1 whenever the result set changes.
  useEffect(() => setPage(1), [q, category, format, level, freeOnly, premiumOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters =
    q !== "" ||
    category !== "all" ||
    format !== "all" ||
    level !== "all" ||
    freeOnly ||
    premiumOnly;

  function clearAll() {
    setQ("");
    setCategory("all");
    setFormat("all");
    setLevel("all");
    setFreeOnly(false);
    setPremiumOnly(false);
    router.replace("/courses", undefined, { shallow: true });
  }

  return (
    <Layout>
      <Head>
        <title>Courses — Kaistrum Academy</title>
        <meta name="description" content="Browse the full Kaistrum Academy course catalogue." />
      </Head>

      {/* Page header */}
      <section className="border-b border-border bg-bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-6 md:pt-20">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Explore our courses
          </h1>
          <p className="mt-2 max-w-2xl text-text-dim">
            {courses.length} courses across {categories.length} tracks. Filter to find
            exactly what you need.
          </p>

          <div className="relative mt-6 max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses…"
              aria-label="Search courses"
              className="h-11 w-full border border-border-strong bg-bg pl-11 pr-4 text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* ── Filters sidebar ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Stack direction="column" gap="lg">
              <Select
                label="Track"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: "all", label: "All tracks" },
                  ...categories.map((c) => ({ value: c.slug, label: c.name })),
                ]}
              />
              <Select
                label="Format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                options={[
                  { value: "all", label: "All formats" },
                  ...formats.map((f) => ({ value: f, label: f })),
                ]}
              />
              <Select
                label="Level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                options={[
                  { value: "all", label: "All levels" },
                  ...levels.map((l) => ({ value: l, label: l })),
                ]}
              />

              <fieldset className="border-t border-border pt-4">
                <legend className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
                  Access
                </legend>
                <Stack direction="column" gap="sm">
                  <Checkbox
                    label="Free courses"
                    checked={freeOnly}
                    onChange={(e) => {
                      setFreeOnly(e.target.checked);
                      if (e.target.checked) setPremiumOnly(false);
                    }}
                  />
                  <Checkbox
                    label="Premium"
                    checked={premiumOnly}
                    onChange={(e) => {
                      setPremiumOnly(e.target.checked);
                      if (e.target.checked) setFreeOnly(false);
                    }}
                  />
                </Stack>
              </fieldset>

              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="inline-flex w-fit items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <X size={14} /> Clear all filters
                </button>
              )}
            </Stack>
          </aside>

          {/* ── Results ── */}
          <div>
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <p className="text-sm text-text-dim">
                Viewing results:{" "}
                <span className="font-semibold text-text">{filtered.length}</span>
                {categoryName && (
                  <>
                    {" "}
                    in <span className="text-text">{categoryName}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-52">
                  <Select
                    aria-label="Sort courses"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    options={sortOptions}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    aria-label="Grid view"
                    size="sm"
                    variant={view === "grid" ? "accent" : "ghost"}
                    icon={<LayoutGrid size={16} />}
                    onClick={() => setView("grid")}
                  />
                  <IconButton
                    aria-label="List view"
                    size="sm"
                    variant={view === "list" ? "accent" : "ghost"}
                    icon={<List size={16} />}
                    onClick={() => setView("list")}
                  />
                </div>
              </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 ? (
              <div className="border border-dashed border-border bg-bg-card p-12 text-center">
                <p className="text-lg font-medium">No courses match your filters</p>
                <p className="mt-1 text-text-dim">Try widening your search.</p>
                <button
                  onClick={clearAll}
                  className="mt-4 text-sm font-medium text-accent hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((c) => (
                  <CourseCard key={c.slug} course={c} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border border border-border bg-bg-card">
                {pageItems.map((c) => (
                  <CourseRow key={c.slug} course={c} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function CourseRow({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col gap-3 p-5 transition-colors hover:bg-bg-surface sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="course-media hidden h-20 w-32 shrink-0 sm:block" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="uppercase tracking-[0.12em]">{course.format}</span>
          <span aria-hidden>·</span>
          <span>{course.category}</span>
        </div>
        <h3 className="mt-1 text-lg font-semibold leading-snug group-hover:text-accent">
          {course.title}
        </h3>
        <p className="clamp-2 mt-1 text-sm text-text-dim">{course.summary}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-xs text-text-dim">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={13} /> {formatDuration(course)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <PlayCircle size={13} /> {course.lessons}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Stars rating={course.rating} size={12} /> {course.rating.toFixed(1)}
        </span>
        {course.premium ? (
          <Badge variant="warning" icon={<Lock size={11} />}>
            Premium
          </Badge>
        ) : (
          <Badge variant="success">Free</Badge>
        )}
      </div>
    </Link>
  );
}
