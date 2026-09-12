import { cn } from "cn";

export default function WorkdayShot({
  src,
  alt,
  caption,
  label,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  label?: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-2xl border bg-background shadow-sm", className)}>
      {label ? (
        <p className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
      ) : null}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="w-full bg-muted/20 object-contain"
      />
      {caption ? (
        <figcaption className="border-t px-4 py-3 text-sm leading-6 text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
