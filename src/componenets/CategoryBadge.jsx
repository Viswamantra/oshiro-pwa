export default function CategoryBadge({ category }) {
  const match = CATEGORY_LIST.find(c => c.value === category);
  if (!match) return null;

  return (
    <span
      style={{
        background: match.color,
        color: "white",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        display: "inline-block"
      }}
    >
      {match.icon} {match.label}
    </span>
  );
}
