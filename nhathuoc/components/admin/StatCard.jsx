export default function StatCard({ icon, label, value, color = "teal", suffix }) {
  const palette = {
    teal: { bg: "#e3f5f2", fg: "#0d9488" },
    green: { bg: "#e6f6ea", fg: "#16a34a" },
    amber: { bg: "#fef3e0", fg: "#d97706" },
    red: { bg: "#fdeaea", fg: "#dc3545" },
    blue: { bg: "#e6f0fd", fg: "#2563eb" },
    purple: { bg: "#f1e9fd", fg: "#7c3aed" },
  }[color] || { bg: "#e3f5f2", fg: "#0d9488" };

  return (
    <div className="stat-card">
      <div className="icon-box" style={{ background: palette.bg, color: palette.fg }}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="stat-value">
          {value}
          {suffix && <span className="fs-6 text-muted ms-1">{suffix}</span>}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
