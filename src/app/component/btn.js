export default function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  style: sx,
}) {
  const base = {
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "inherit",
    borderRadius: 8,
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  const v = {
    primary: {
      ...base,
      background: "#0f172a",
      color: "#fff",
      padding: size === "sm" ? "6px 14px" : "10px 20px",
      fontSize: size === "sm" ? 11 : 13,
    },
    secondary: {
      ...base,
      background: "#f1f5f9",
      color: "#334155",
      padding: size === "sm" ? "6px 14px" : "10px 20px",
      fontSize: size === "sm" ? 11 : 13,
    },
    danger: {
      ...base,
      background: "#fef2f2",
      color: "#dc2626",
      padding: size === "sm" ? "6px 14px" : "10px 20px",
      fontSize: size === "sm" ? 11 : 13,
    },
    ghost: {
      ...base,
      background: "transparent",
      color: "#64748b",
      padding: size === "sm" ? "4px 8px" : "6px 12px",
      fontSize: size === "sm" ? 11 : 12,
    },
  };
  return (
    <button onClick={onClick} style={{ ...v[variant], ...sx }}>
      {children}
    </button>
  );
}
