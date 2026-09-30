"use client";

// Biểu đồ SVG nhẹ, không phụ thuộc thư viện ngoài — tránh rủi ro version khi
// build. Dùng cho biểu đồ doanh thu / số lượng bán trên Dashboard.
export default function MiniChart({ labels = [], values = [], type = "bar", color = "#0d9488", height = 220 }) {
  const width = 640;
  const padding = { top: 16, right: 16, bottom: 32, left: 48 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...values);
  const n = Math.max(values.length, 1);
  const stepX = innerW / n;

  const yFor = (v) => padding.top + innerH - (v / max) * innerH;
  const xFor = (i) => padding.left + i * stepX + stepX / 2;

  const gridLines = 4;

  if (!values.length) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height }}>
        Chưa có dữ liệu để hiển thị biểu đồ.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      {/* grid */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padding.top + (innerH / gridLines) * i;
        const val = Math.round(max - (max / gridLines) * i);
        return (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#eef2f1" strokeWidth="1" />
            <text x={4} y={y + 4} fontSize="10" fill="#8a9c99">
              {val}
            </text>
          </g>
        );
      })}

      {type === "bar" &&
        values.map((v, i) => {
          const barW = stepX * 0.5;
          const x = xFor(i) - barW / 2;
          const y = yFor(v);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={padding.top + innerH - y}
              rx="4"
              fill={color}
              opacity="0.85"
            />
          );
        })}

      {type === "line" && (
        <>
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            points={values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ")}
          />
          {values.map((v, i) => (
            <circle key={i} cx={xFor(i)} cy={yFor(v)} r="3.5" fill={color} />
          ))}
        </>
      )}

      {labels.map((l, i) => (
        <text key={i} x={xFor(i)} y={height - 8} fontSize="10" fill="#8a9c99" textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  );
}
