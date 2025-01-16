export default function Overlay() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        zIndex: 10,
        cursor: "not-allowed",
      }}
    />
  );
}
