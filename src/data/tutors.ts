/**
 * Tutors (instructors) as a standalone, manageable dataset. Seeds the admin
 * tutor management screens; the public site still reads the embedded
 * `course.author`, but admin joins courses to tutors by name.
 */
import { courses, type Course } from "@/data/courses";

export interface Tutor {
  id: string;
  name: string;
  title: string;
  email: string;
  bio: string;
  rating: number;
  students: string;
  courses: number;
}

export const tutors: Tutor[] = [
  {
    id: "t-alex",
    name: "Dr. Alex Rivera",
    title: "Principal Geospatial Engineer",
    email: "alex.rivera@kaistrum.academy",
    bio: "Alex has spent over a decade building spatial data platforms and teaching practitioners how to move from raw coordinates to decisions.",
    rating: 4.8,
    students: "48k",
    courses: 14,
  },
  {
    id: "t-priya",
    name: "Priya Nair",
    title: "Developer Advocate",
    email: "priya.nair@kaistrum.academy",
    bio: "Priya writes tooling and tutorials for spatial developers, turning gnarly APIs into things you can pick up in an afternoon.",
    rating: 4.9,
    students: "31k",
    courses: 9,
  },
  {
    id: "t-marcus",
    name: "Marcus Bello",
    title: "Remote Sensing Scientist",
    email: "marcus.bello@kaistrum.academy",
    bio: "Marcus works with satellite and drone imagery for environmental monitoring, and has trained field teams on five continents.",
    rating: 4.7,
    students: "22k",
    courses: 6,
  },
];

export function getTutor(id: string): Tutor | undefined {
  return tutors.find((t) => t.id === id);
}

export function tutorIdForCourse(course: Pick<Course, "author">): string | undefined {
  return tutors.find((t) => t.name === course.author.name)?.id;
}

/** Count of catalogue courses currently attributed to a tutor. */
export function courseCountForTutor(tutorId: string): number {
  const tutor = getTutor(tutorId);
  if (!tutor) return 0;
  return courses.filter((c) => c.author.name === tutor.name).length;
}
