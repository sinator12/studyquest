interface BrandMarkProps {
  href?: string;
  compact?: boolean;
  light?: boolean;
}

export function BrandMark({ href = "/", compact = false, light = false }: BrandMarkProps) {
  return (
    <a className={`sq-brand${compact ? " is-compact" : ""}${light ? " is-light" : ""}`} href={href}>
      <span className="sq-brand-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path d="M7 12.5c6.5-2.2 12-.6 17 3.2v22c-5.3-3.7-10.8-4.8-17-2.3z" />
          <path d="M41 12.5c-6.5-2.2-12-.6-17 3.2v22c5.3-3.7 10.8-4.8 17-2.3z" />
          <path d="m24 14 3.4-4.5 3.4 4.5" className="sq-book-star" />
          <path d="M12 18.5c3-.3 5.8.3 8 1.7M12 24c3-.3 5.8.3 8 1.7M36 18.5c-3-.3-5.8.3-8 1.7M36 24c-3-.3-5.8.3-8 1.7" className="sq-book-lines" />
        </svg>
      </span>
      {!compact && (
        <span className="sq-brand-copy">
          <strong>EduQuest</strong>
          <small>Study. Play. Level up.</small>
        </span>
      )}
    </a>
  );
}
