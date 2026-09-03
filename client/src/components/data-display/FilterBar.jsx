export default function FilterBar({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-surface p-3 shadow-card [&_select]:min-w-[8rem]">
      {children}
    </div>
  )
}
