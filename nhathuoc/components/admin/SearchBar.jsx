export function SearchBar({ value, onChange, placeholder = "Tìm kiếm..." }) {
  return (
    <div className="input-group" style={{ maxWidth: 320 }}>
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search text-muted" />
      </span>
      <input
        type="text"
        className="form-control border-start-0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="btn btn-outline-secondary" type="button" onClick={() => onChange("")}>
          <i className="bi bi-x" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, style }) {
  return (
    <select className="form-select" style={{ maxWidth: 220, ...style }} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={String(opt.value)} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
