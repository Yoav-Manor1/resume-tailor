export function KeywordChips({
  matched,
  missing,
}: {
  matched: string[]
  missing: string[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {matched.map((k) => (
        <span
          key={`m-${k}`}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {k}
        </span>
      ))}
      {missing.map((k) => (
        <span
          key={`x-${k}`}
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-500 ring-1 ring-inset ring-neutral-200"
          title="Not yet present in your bullets"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
          {k}
        </span>
      ))}
    </div>
  )
}
