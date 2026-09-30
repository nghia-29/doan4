export default function Loading({ label = "Đang tải dữ liệu...", fullscreen = false, small = false }) {
  if (fullscreen) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-brand mb-3" role="status" style={{ width: "2.5rem", height: "2.5rem" }} />
        <div className="text-muted">{label}</div>
      </div>
    );
  }
  return (
    <div className={`d-flex align-items-center justify-content-center ${small ? "py-3" : "py-5"}`}>
      <div className="spinner-border text-brand me-2" role="status" style={{ width: "1.6rem", height: "1.6rem" }} />
      <span className="text-muted">{label}</span>
    </div>
  );
}
