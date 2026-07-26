/**
 * View models and formatting for the catalogue.
 *
 * The API speaks in enums and raw numbers (`web_course`, `durationMinutes`,
 * `learnersCount`); the UI wants labels and human strings. Everything crossing
 * that boundary goes through here so the components stay presentational.
 */
import type {
  CourseCard,
  CourseDetail,
  CourseFormat,
  CourseLevel,
  CourseStatus,
  Instructor,
  Track,
} from "@/lib/api";

// ---- enum labels -----------------------------------------------------------

export const FORMAT_LABELS: Record<CourseFormat, string> = {
  web_course: "Web Course",
  training_seminar: "Training Seminar",
  tutorial: "Tutorial",
  learning_path: "Learning Path",
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const FORMAT_KEYS = Object.keys(FORMAT_LABELS) as CourseFormat[];
export const LEVEL_KEYS = Object.keys(LEVEL_LABELS) as CourseLevel[];

export const formatLabel = (f: CourseFormat) => FORMAT_LABELS[f] ?? f;
export const levelLabel = (l: CourseLevel) => LEVEL_LABELS[l] ?? l;

/** Sorts the catalogue page offers, mapped to the API's whitelist. */
export const SORT_OPTIONS = [
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "az", label: "Title (A–Z)" },
  { value: "shortest", label: "Shortest First" },
  { value: "priceLow", label: "Price (low to high)" },
];

// ---- number & date formatting ---------------------------------------------

/** Format a number as Kenyan Shillings, e.g. 5900 → "KES 5,900". */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function kesCompact(n: number): string {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${Math.round(n / 1000)}k`;
  return `KES ${n ?? 0}`;
}

/** 8100 → "8.1k" — the compact learner counts the cards show. */
export function compactCount(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function splitDuration(totalMinutes: number) {
  const total = Math.max(0, Math.round(totalMinutes ?? 0));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

/** "2 Hours, 5 Minutes" — accepts either a total or a {hours, minutes} pair. */
export function formatDuration(
  input: number | { hours: number; minutes: number },
): string {
  const { hours, minutes } =
    typeof input === "number" ? splitDuration(input) : input;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} Hour${hours > 1 ? "s" : ""}`);
  if (minutes) parts.push(`${minutes} Minute${minutes > 1 ? "s" : ""}`);
  return parts.join(", ") || "0 Minutes";
}

/** Compact "1h 20m" used in dense admin tables. */
export function shortDuration(totalMinutes: number): string {
  const { hours, minutes } = splitDuration(totalMinutes);
  return `${hours}h ${minutes}m`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateISO(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}

/** "2 days ago" for the "last opened" lines. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "not started";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "not started";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let value = seconds / 60;
  for (const [step, unit] of units) {
    if (Math.abs(value) < step) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        -Math.round(value),
        unit,
      );
    }
    value /= step;
  }
  return "a while ago";
}

// ---- course view model -----------------------------------------------------

export interface ViewCourse {
  id: string;
  slug: string;
  title: string;
  summary: string;
  /** Track name, e.g. "Spatial Analysis & Data Science". */
  category: string;
  categorySlug: string | null;
  format: string;
  formatKey: CourseFormat;
  level: string;
  levelKey: CourseLevel;
  hours: number;
  minutes: number;
  totalMinutes: number;
  lessons: number;
  rating: number;
  reviews: number;
  learners: string;
  learnersCount: number;
  premium: boolean;
  priceKES: number | null;
  originalPriceKES: number | null;
  featured: boolean;
  status: CourseStatus;
  track?: Track;
  instructor?: Instructor;
  publishedAt: string | null;
  createdAt: string;
}

export function toViewCourse(course: CourseCard): ViewCourse {
  const { hours, minutes } = splitDuration(course.durationMinutes);
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary ?? "",
    category: course.track?.name ?? "Uncategorised",
    categorySlug: course.track?.slug ?? null,
    format: formatLabel(course.format),
    formatKey: course.format,
    level: levelLabel(course.level),
    levelKey: course.level,
    hours,
    minutes,
    totalMinutes: course.durationMinutes ?? 0,
    lessons: course.lessonCount ?? 0,
    rating: course.ratingAvg ?? 0,
    reviews: course.ratingCount ?? 0,
    learners: compactCount(course.learnersCount ?? 0),
    learnersCount: course.learnersCount ?? 0,
    premium: Boolean(course.premium),
    priceKES: course.priceKES ?? null,
    originalPriceKES: course.originalPriceKES ?? null,
    featured: Boolean(course.featured),
    status: course.status,
    track: course.track,
    instructor: course.instructor,
    publishedAt: course.publishedAt,
    createdAt: course.createdAt,
  };
}

export interface ViewCourseDetail extends ViewCourse {
  description: string[];
  whatYouLearn: string[];
  requirements: string[];
  faqs: { question: string; answer: string }[];
  contentHTML: string;
}

export function toViewCourseDetail(course: CourseDetail): ViewCourseDetail {
  return {
    ...toViewCourse(course),
    description: course.description ?? [],
    whatYouLearn: course.whatYouLearn ?? [],
    requirements: course.requirements ?? [],
    faqs: course.faqs ?? [],
    contentHTML: course.contentHTML ?? "",
  };
}

/** Lowercase URL-safe slug from a title, mirroring the server's rules. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
