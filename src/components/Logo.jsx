export default function Logo({
  variant = "full", // full | compact | icon
  height = 40,
}) {
  const logos = {
    full: "/src/assets/logo/oshiro-logo.png",
    compact: "/src/assets/logo/oshiro-logo-compact.png",
    icon: "/src/assets/logo/oshiro-logo-icon.png",
  };

  return (
    <img
      src={logos[variant]}
      alt="Oshiro"
      style={{
        height,
        width: "auto",
        display: "block",
      }}
    />
  );
}
