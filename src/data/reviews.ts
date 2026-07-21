/**
 * Seed reviews per course. The admin moderates these (view + remove) through
 * AdminContext, which is seeded from here and persisted to localStorage.
 * Deterministically generated so SSR and client match.
 */
import { courses } from "@/data/courses";

export interface Review {
  id: string;
  courseSlug: string;
  author: string;
  rating: number;
  body: string;
  date: string; // yyyy-mm-dd
}

const AUTHORS = [
  "Jordan M.", "Sofia K.", "Wei L.", "Amara O.", "Diego R.", "Neha P.",
  "Tomas B.", "Leila H.", "Kofi A.", "Sara V.", "Ben C.", "Yuki T.",
];

const POSITIVE = [
  "Exactly the practical depth I needed — the worked examples map straight onto my day job.",
  "Clear, well-paced, and no filler. I was applying the ideas the same week.",
  "One of the best courses on this topic. The instructor explains the 'why', not just the 'how'.",
  "Great balance of theory and hands-on practice. Highly recommend.",
  "The projects made everything click. I finally understand this properly.",
];

const MIXED = [
  "Great content overall — I'd have loved one more advanced module at the end.",
  "Solid material, though a couple of the videos felt a little rushed.",
  "Good course. Some sections assume more background than the intro suggests.",
];

const NEGATIVE = [
  "Decent, but the pacing was uneven and a few examples were out of date.",
  "Expected more depth for the price. Fine as a refresher, not as a first course.",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor((Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000)) * arr.length)];
}

function generate(): Review[] {
  const out: Review[] = [];
  courses.forEach((course, ci) => {
    const count = 3 + (ci % 3); // 3–5 reviews per course
    for (let i = 0; i < count; i++) {
      const seed = ci * 17 + i * 5;
      // Mostly high ratings, occasional mixed/low.
      const roll = Math.abs(Math.sin(seed));
      const rating = roll > 0.85 ? 3 : roll > 0.7 ? 4 : 5;
      const body = rating >= 5 ? pick(POSITIVE, seed) : rating === 4 ? pick(MIXED, seed) : pick(NEGATIVE, seed);
      const month = 1 + ((ci + i) % 7);
      const day = 2 + ((i * 6 + ci) % 25);
      out.push({
        id: `REV-${ci}-${i}`,
        courseSlug: course.slug,
        author: AUTHORS[(ci * 3 + i) % AUTHORS.length],
        rating,
        body,
        date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      });
    }
  });
  return out;
}

export const seedReviews: Review[] = generate();
