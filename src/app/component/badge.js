export default function Badge({ children, color, bg }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
