export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded border border-border bg-surface px-3 py-2 text-sm focus-ring"
    />
  )
}
