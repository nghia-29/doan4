"use client";

export default function DynamicForm({ fields, values, onChange, errors = {} }) {
  const setField = (name, value) => onChange({ ...values, [name]: value });

  return (
    <div className="row g-3">
      {fields.map((f) => {
        const colClass = f.col || "col-12 col-md-6";
        const value = values?.[f.name] ?? "";
        return (
          <div className={colClass} key={f.name}>
            <label className="form-label small fw-semibold">
              {f.label} {f.required && <span className="text-danger">*</span>}
            </label>

            {f.type === "textarea" ? (
              <textarea
                className={`form-control ${errors[f.name] ? "is-invalid" : ""}`}
                rows={f.rows || 3}
                value={value}
                placeholder={f.placeholder}
                onChange={(e) => setField(f.name, e.target.value)}
              />
            ) : f.type === "select" ? (
              <select
                className={`form-select ${errors[f.name] ? "is-invalid" : ""}`}
                value={value}
                onChange={(e) => setField(f.name, e.target.value)}
              >
                <option value="">-- Chọn --</option>
                {(f.options || []).map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                step={f.step}
                className={`form-control ${errors[f.name] ? "is-invalid" : ""}`}
                value={value}
                placeholder={f.placeholder}
                onChange={(e) => setField(f.name, e.target.value)}
              />
            )}
            {errors[f.name] && <div className="invalid-feedback d-block">{errors[f.name]}</div>}
            {f.help && <div className="form-text">{f.help}</div>}
          </div>
        );
      })}
    </div>
  );
}
