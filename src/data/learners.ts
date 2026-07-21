/**
 * Per-course enrolled learners. Deterministically generated (no Math.random)
 * so server and client render identically. Read-only — the admin views these;
 * it doesn't edit them.
 */
import { courses, type Course } from "@/data/courses";

export interface Learner {
  id: string;
  name: string;
  email: string;
  courseSlug: string;
  enrolledAt: string; // yyyy-mm-dd
  progress: number; // 0–100
  status: "active" | "completed";
  lastActive: string;
}

const NAMES = [
  "Amina Yusuf", "Brian Otieno", "Chloe Mwangi", "David Kimani", "Esther Njeri",
  "Farid Hassan", "Grace Wanjiru", "Henry Mutua", "Irene Achieng", "James Kariuki",
  "Kevin Omondi", "Lucy Wambui", "Mary Adhiambo", "Noah Kiptoo", "Olivia Chebet",
  "Peter Njoroge", "Quincy Barasa", "Ruth Cheruiyot", "Samuel Mwaura", "Tina Auma",
  "Umar Farooq", "Violet Nasimiyu", "Wesley Rotich", "Xena Moraa", "Yusuf Ali",
  "Zawadi Kamau", "Aisha Noor", "Boniface Kiplagat", "Caroline Wangui", "Dennis Maina",
  "Eunice Wairimu", "Frank Odera", "Gloria Atieno", "Hamisi Juma", "Ivy Mumbi",
  "Jared Kones", "Keziah Nyambura", "Leon Mwendwa", "Mercy Nduta", "Nathan Bett",
];

const LAST_ACTIVE = ["today", "yesterday", "2 days ago", "4 days ago", "last week", "2 weeks ago"];

function parseLearners(s: string): number {
  const n = parseFloat(s);
  return s.toLowerCase().includes("k") ? n * 1000 : n;
}

function rand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function emailFor(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@gmail.com`;
}

function generate(): Learner[] {
  const out: Learner[] = [];
  courses.forEach((course, ci) => {
    // Roster size scales with popularity but stays demo-sized (8–44).
    const pop = parseLearners(course.learners);
    const count = Math.min(44, Math.max(8, Math.round(pop / 700)));
    for (let i = 0; i < count; i++) {
      const r = rand(ci * 31 + i * 7);
      const progress =
        r < 0.25 ? 100 : Math.min(95, Math.round(rand(ci * 13 + i * 3) * 100));
      const month = 1 + ((ci + i) % 7);
      const day = 1 + ((i * 5 + ci) % 27);
      out.push({
        id: `LRN-${ci}-${i}`,
        name: NAMES[(ci * 5 + i) % NAMES.length],
        email: emailFor(NAMES[(ci * 5 + i) % NAMES.length]),
        courseSlug: course.slug,
        enrolledAt: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        progress,
        status: progress >= 100 ? "completed" : "active",
        lastActive: LAST_ACTIVE[(ci + i) % LAST_ACTIVE.length],
      });
    }
  });
  return out;
}

export const learners: Learner[] = generate();

export function learnersForCourse(slug: string): Learner[] {
  return learners
    .filter((l) => l.courseSlug === slug)
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

export function learnerCountForCourse(slug: string): number {
  return learners.reduce((n, l) => (l.courseSlug === slug ? n + 1 : n), 0);
}

export function courseCompletionRate(slug: string): number {
  const rows = learners.filter((l) => l.courseSlug === slug);
  if (!rows.length) return 0;
  return Math.round((rows.filter((l) => l.status === "completed").length / rows.length) * 100);
}

export function totalLearners(): number {
  return learners.length;
}

// ── People view (a learner across all their courses) ──

export interface LearnerPerson {
  name: string;
  email: string;
  registered: number;
  inProgress: number;
  completed: number;
}

function aggregate(rows: Learner[]): Omit<LearnerPerson, "name" | "email"> {
  return {
    registered: rows.length,
    inProgress: rows.filter((r) => r.status === "active").length,
    completed: rows.filter((r) => r.status === "completed").length,
  };
}

/** Distinct learners (grouped by name), with per-person enrolment tallies. */
export function learnerPeople(): LearnerPerson[] {
  const map = new Map<string, { email: string; rows: Learner[] }>();
  for (const l of learners) {
    const cur = map.get(l.name) ?? { email: l.email, rows: [] };
    cur.rows.push(l);
    map.set(l.name, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, email: v.email, ...aggregate(v.rows) }))
    .sort((a, b) => b.registered - a.registered);
}

export function getPerson(name: string): LearnerPerson | undefined {
  return learnerPeople().find((p) => p.name === name);
}

/** All of a person's course enrolments, most recent first. */
export function enrollmentsForPerson(name: string): Learner[] {
  return learners
    .filter((l) => l.name === name)
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

export function distinctLearnerCount(): number {
  return new Set(learners.map((l) => l.name)).size;
}

// Re-export for callers that want the Course type alongside.
export type { Course };
