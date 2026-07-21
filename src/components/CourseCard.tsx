import Link from "next/link";
import { Badge, Card } from "@kaistrum/stratum-ui";
import { Check, Clock, Heart, Lock, PlayCircle } from "lucide-react";
import { type Course, formatDuration } from "@/data/courses";
import { getEnrollment } from "@/data/enrollment";
import { useFavourites } from "@/context/FavouritesContext";
import { Stars } from "@/components/Stars";

export function CourseCard({ course }: { course: Course }) {
  const enrollment = getEnrollment(course.slug);
  const { isFavourite, toggle } = useFavourites();
  const favourite = isFavourite(course.slug);

  return (
    <Card
      surface="card"
      padding="none"
      interactive
      className="group flex h-full flex-col overflow-hidden border border-border"
    >
      {/* Media / header strip */}
      <div className="relative">
        <Link
          href={`/courses/${course.slug}`}
          className="course-media relative flex h-32 items-end p-4"
          aria-label={course.title}
        >
          <span className="absolute right-3 top-3">
            {enrollment ? (
              <Badge variant="accent" icon={<Check size={12} />}>
                Enrolled
              </Badge>
            ) : course.premium ? (
              <Badge variant="warning" icon={<Lock size={12} />}>
                Premium
              </Badge>
            ) : (
              <Badge variant="success">Free</Badge>
            )}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-text-dim">
            {course.format}
          </span>
          {enrollment && (
            <span
              className="absolute inset-x-0 bottom-0 h-1 bg-accent"
              style={{ width: `${enrollment.progress}%` }}
              aria-hidden
            />
          )}
        </Link>
        <button
          type="button"
          onClick={() => toggle(course.slug)}
          aria-pressed={favourite}
          aria-label={favourite ? "Remove from favourites" : "Save to favourites"}
          className="absolute left-3 top-3 z-10 grid h-8 w-8 place-items-center border border-border-strong bg-bg/70 backdrop-blur transition-colors hover:border-accent"
        >
          <Heart
            size={15}
            className={favourite ? "text-accent" : "text-text-dim"}
            fill={favourite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{course.category}</span>
          <span aria-hidden>·</span>
          <span>{course.level}</span>
        </div>

        <h3 className="text-[17px] font-semibold leading-snug">
          <Link href={`/courses/${course.slug}`} className="clamp-2 hover:text-accent">
            {course.title}
          </Link>
        </h3>

        <p className="clamp-2 text-sm text-text-dim">{course.summary}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-text-dim">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} /> {formatDuration(course)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <PlayCircle size={13} /> {course.lessons} lessons
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-3">
          <div className="flex items-center gap-2">
            <Stars rating={course.rating} />
            <span className="text-xs text-text-dim">
              {course.rating.toFixed(1)}{" "}
              <span className="text-text-muted">({course.reviews})</span>
            </span>
          </div>
          {enrollment && (
            <span className="text-xs font-medium text-accent">
              {enrollment.progress}% complete
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
