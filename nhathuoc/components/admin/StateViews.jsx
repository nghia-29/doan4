export function EmptyState({ title = "Không có dữ liệu", desc = "Chưa có bản ghi nào phù hợp.", icon = "bi-inbox" }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} />
      <div className="fw-semibold text-secondary">{title}</div>
      <div className="small">{desc}</div>
    </div>
  );
}

export function ErrorState({ message = "Đã có lỗi xảy ra khi tải dữ liệu.", onRetry }) {
  return (
    <div className="error-state">
      <i className="bi bi-wifi-off" />
      <div className="fw-semibold text-danger mb-1">Không thể tải dữ liệu</div>
      <div className="small mb-3">{message}</div>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1" /> Thử lại
        </button>
      )}
    </div>
  );
}
