/**
 * Mock payment ledger + admin analytics. Deterministically generated (no
 * Math.random) so server and client render identically. Only premium courses
 * produce revenue; amounts are the course's KES price.
 */
import { courses, coursePriceKES, type Course } from "@/data/courses";
import { tutorIdForCourse, tutors } from "@/data/tutors";

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export interface Payment {
  id: string;
  courseSlug: string;
  buyer: string;
  amountKES: number;
  method: "M-Pesa" | "Card";
  status: PaymentStatus;
  date: string; // ISO yyyy-mm-dd
}

export const MONTHS = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
];

const BUYERS = [
  "Amina Yusuf", "Brian Otieno", "Chloe Mwangi", "David Kimani", "Esther Njeri",
  "Farid Hassan", "Grace Wanjiru", "Henry Mutua", "Irene Achieng", "James Kariuki",
  "Kevin Omondi", "Lucy Wambui", "Mary Adhiambo", "Noah Kiptoo", "Olivia Chebet",
  "Peter Njoroge", "Quincy Barasa", "Ruth Cheruiyot", "Samuel Mwaura", "Tina Auma",
];

function parseLearners(s: string): number {
  const n = parseFloat(s);
  return s.toLowerCase().includes("k") ? n * 1000 : n;
}

// Small deterministic pseudo-random in [0,1) from an integer seed.
function rand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generatePayments(): Payment[] {
  const premium = courses.filter((c) => c.premium);
  const out: Payment[] = [];
  let n = 0;

  premium.forEach((course, ci) => {
    const price = coursePriceKES(course)?.price ?? 0;
    const popularity = parseLearners(course.learners); // ~3k–16k
    const base = Math.max(2, Math.round(popularity / 2200)); // baseline sales/month

    MONTHS.forEach((month, mi) => {
      const growth = 1 + mi * 0.16; // steady month-over-month growth
      const jitter = 0.7 + rand(ci * 13 + mi * 7) * 0.7;
      const count = Math.max(1, Math.round(base * growth * jitter));

      for (let k = 0; k < count; k++) {
        n += 1;
        const day = String(2 + ((k * 5 + ci) % 26)).padStart(2, "0");
        const roll = rand(n * 3.3);
        const status: PaymentStatus =
          roll > 0.94 ? "refunded" : roll > 0.9 ? "failed" : roll > 0.87 ? "pending" : "paid";
        out.push({
          id: `PMT-${String(n).padStart(4, "0")}`,
          courseSlug: course.slug,
          buyer: BUYERS[(n * 7 + ci) % BUYERS.length],
          amountKES: price,
          method: n % 4 === 0 ? "Card" : "M-Pesa",
          status,
          date: `${month}-${day}`,
        });
      }
    });
  });

  // Newest first.
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export const payments: Payment[] = generatePayments();

const paid = payments.filter((p) => p.status === "paid");

function monthLabel(ym: string): string {
  const [, m] = ym.split("-");
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    parseInt(m, 10) - 1
  ];
}

// ── Aggregations ──

export interface MonthlyRevenue {
  month: string;
  label: string;
  revenue: number;
  sales: number;
}

export function revenueByMonth(): MonthlyRevenue[] {
  return MONTHS.map((month) => {
    const rows = paid.filter((p) => p.date.startsWith(month));
    return {
      month,
      label: monthLabel(month),
      revenue: rows.reduce((s, p) => s + p.amountKES, 0),
      sales: rows.length,
    };
  });
}

export interface CourseRevenue {
  course: Course;
  revenue: number;
  sales: number;
}

export function revenueByCourse(): CourseRevenue[] {
  const map = new Map<string, { revenue: number; sales: number }>();
  for (const p of paid) {
    const cur = map.get(p.courseSlug) ?? { revenue: 0, sales: 0 };
    cur.revenue += p.amountKES;
    cur.sales += 1;
    map.set(p.courseSlug, cur);
  }
  return [...map.entries()]
    .map(([slug, v]) => ({
      course: courses.find((c) => c.slug === slug)!,
      ...v,
    }))
    .filter((r) => r.course)
    .sort((a, b) => b.revenue - a.revenue);
}

export interface TutorRevenue {
  tutorId: string;
  name: string;
  revenue: number;
  sales: number;
  courses: number;
}

export function revenueByTutor(): TutorRevenue[] {
  const byCourse = revenueByCourse();
  const map = new Map<string, TutorRevenue>();
  for (const cr of byCourse) {
    const tid = tutorIdForCourse(cr.course);
    if (!tid) continue;
    const tutor = tutors.find((t) => t.id === tid)!;
    const cur =
      map.get(tid) ?? { tutorId: tid, name: tutor.name, revenue: 0, sales: 0, courses: 0 };
    cur.revenue += cr.revenue;
    cur.sales += cr.sales;
    cur.courses += 1;
    map.set(tid, cur);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function totalRevenue(): number {
  return paid.reduce((s, p) => s + p.amountKES, 0);
}

/** Month-over-month growth of the latest complete month, as a percentage. */
export function revenueGrowthPct(): number {
  const series = revenueByMonth();
  const last = series[series.length - 1]?.revenue ?? 0;
  const prev = series[series.length - 2]?.revenue ?? 0;
  if (!prev) return 0;
  return Math.round(((last - prev) / prev) * 100);
}

export function paidSalesCount(): number {
  return paid.length;
}

/** All payments made by a given buyer, newest first. */
export function paymentsForBuyer(name: string): Payment[] {
  return payments
    .filter((p) => p.buyer === name)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Total successfully-paid amount for a buyer. */
export function totalSpentByBuyer(name: string): number {
  return payments
    .filter((p) => p.buyer === name && p.status === "paid")
    .reduce((s, p) => s + p.amountKES, 0);
}
