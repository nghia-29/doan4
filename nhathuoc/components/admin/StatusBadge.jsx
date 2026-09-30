export default function StatusBadge({ label, color = "secondary", icon }) {
  return (
    <span className={`badge badge-soft text-bg-${color}`}>
      {icon && <i className={`bi ${icon} me-1`} />}
      {label}
    </span>
  );
}
