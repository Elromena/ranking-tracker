export default function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1.5px solid #e2e8f0",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}
