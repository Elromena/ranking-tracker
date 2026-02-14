export default function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 16px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        background: active ? "#0f172a" : "#f1f5f9",
        color: active ? "#fff" : "#64748b",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
