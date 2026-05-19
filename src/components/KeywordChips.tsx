export function KeywordChips({
  matched,
  missing,
}: {
  matched: string[]
  missing: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {matched.map((k) => (
        <span
          key={`m-${k}`}
          className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-900"
        >
          {k}
        </span>
      ))}
      {missing.map((k) => (
        <span
          key={`x-${k}`}
          className="rounded-full border border-red-300 px-2 py-0.5 text-xs text-red-700"
        >
          {k}
        </span>
      ))}
    </div>
  )
}
