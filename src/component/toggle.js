export default function Toggle({ label, desc, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "#f8fafc",
        borderRadius: 8,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: checked ? "#059669" : "#cbd5e1",
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#fff",
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </button>
    </div>
  );
}
