import { cn } from "@/lib/utils";

export type TestimonialProps = {
  quote: string;
  name: string;
  role: string;
  avatarSrc?: string;
  className?: string;
};

export function Testimonial({ quote, name, role, avatarSrc, className }: TestimonialProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <figure className={cn("project-testimonial", className)}>
      <blockquote>“{quote}”</blockquote>
      <figcaption>
        {avatarSrc ? (
          <img src={avatarSrc} alt="" width={40} height={40} loading="lazy" />
        ) : (
          <span className="testimonial-avatar" aria-hidden="true">
            {initials}
          </span>
        )}
        <span>
          {name}
          <span className="testimonial-role">{role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default Testimonial;
