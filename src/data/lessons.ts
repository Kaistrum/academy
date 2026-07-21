/**
 * Seed lessons (flattened from each course's curriculum). The admin manages
 * these through AdminContext (add / edit / delete + duration + rich content),
 * persisted to localStorage. Deterministic so SSR and client match.
 */
import { courses, lessonContentHTML } from "@/data/courses";

export interface AdminLesson {
  id: string;
  courseSlug: string;
  title: string;
  minutes: number; // estimated duration
  /** Rich lesson body authored in the Mantine Tiptap editor. */
  contentHTML: string;
  order: number;
}

export function seedLessons(): AdminLesson[] {
  const out: AdminLesson[] = [];
  courses.forEach((course, ci) => {
    let order = 0;
    course.curriculum.forEach((section) => {
      section.lessons.forEach((lesson) => {
        out.push({
          id: `LSN-${ci}-${order}`,
          courseSlug: course.slug,
          title: lesson.title,
          minutes: lesson.minutes,
          contentHTML: lessonContentHTML(course, section.title, lesson),
          order,
        });
        order += 1;
      });
    });
  });
  return out;
}
