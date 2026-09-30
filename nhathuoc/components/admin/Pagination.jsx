export default function Pagination({ page, totalPages, onChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
      <span className="text-muted small">
        Hiển thị {from}–{to} trong tổng số {totalItems} bản ghi
      </span>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onChange(page - 1)}>
              <i className="bi bi-chevron-left" />
            </button>
          </li>
          {start > 1 && (
            <li className="page-item disabled d-none d-sm-block">
              <span className="page-link">…</span>
            </li>
          )}
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
              <button
                className="page-link"
                style={p === page ? { backgroundColor: "var(--pm-primary)", borderColor: "var(--pm-primary)" } : {}}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ))}
          {end < totalPages && (
            <li className="page-item disabled d-none d-sm-block">
              <span className="page-link">…</span>
            </li>
          )}
          <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onChange(page + 1)}>
              <i className="bi bi-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
