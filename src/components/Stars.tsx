import { Star } from "lucide-react";

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i - 0.25;
        return (
          <Star
            key={i}
            size={size}
            className={filled ? "text-warning" : "text-text-muted"}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={1.6}
          />
        );
      })}
    </span>
  );
}
