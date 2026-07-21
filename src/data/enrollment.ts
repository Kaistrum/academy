/**
 * Mock enrolment state for the "current" (signed-in) learner. In a real app
 * this would come from the user's account; here it's a static module so any
 * page can reflect an in-progress course without wiring up auth.
 */
import { courses, type Course } from "@/data/courses";

export interface Enrollment {
  slug: string;
  /** 0–100 */
  progress: number;
  completedLessons: number;
  /** Title of the lesson to resume on. */
  nextLesson: string;
  nextSection: string;
  lastAccessed: string;
}

/** The mocked learner. */
export const currentUser = {
  name: "Sam Okoro",
  email: "sam@example.com",
};

export const enrollments: Enrollment[] = [
  {
    slug: "intro-to-spatial-data",
    progress: 60,
    completedLessons: 6,
    nextLesson: "Making a simple map",
    nextSection: "Hands-on",
    lastAccessed: "2 days ago",
  },
  {
    slug: "field-data-collection",
    progress: 15,
    completedLessons: 2,
    nextLesson: "Smart logic & validation",
    nextSection: "Design",
    lastAccessed: "last week",
  },
  {
    slug: "spatial-sql-crash-course",
    progress: 100,
    completedLessons: 13,
    nextLesson: "Course complete",
    nextSection: "Completed",
    lastAccessed: "yesterday",
  },
];

/** Whether the learner has finished the course (eligible to review it). */
export function isCompleted(slug: string): boolean {
  const e = getEnrollment(slug);
  return !!e && e.progress >= 100;
}

export function getEnrollment(slug: string): Enrollment | undefined {
  return enrollments.find((e) => e.slug === slug);
}

export function isEnrolled(slug: string): boolean {
  return enrollments.some((e) => e.slug === slug);
}

export interface EnrolledCourse {
  course: Course;
  enrollment: Enrollment;
}

/** Enrolled courses joined with their catalogue entry, most recent first. */
export function getEnrolledCourses(): EnrolledCourse[] {
  return enrollments
    .map((enrollment) => {
      const course = courses.find((c) => c.slug === enrollment.slug);
      return course ? { course, enrollment } : null;
    })
    .filter((x): x is EnrolledCourse => x !== null);
}
