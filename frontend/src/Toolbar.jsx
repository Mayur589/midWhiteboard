import { Hand, Pencil, Trash2 } from "lucide-react"; // Import Hand

// Pass 'tool' and 'setTool' props
const Toolbar = ({ color, setColor, clearBoard, tool, setTool }) => {
  const colors = ["#ffffff", "#ef4444", "#22c55e", "#3b82f6", "#eab308"];

  return (
    <div
      className="hud-panel"
      style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "12px",
        padding: "12px 20px",
        zIndex: 50,
      }}
    >
      {/* Color Picker (Only show if in Pencil mode) */}
      {tool === "pencil" && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            paddingRight: "12px",
            borderRight: "1px solid #444",
            alignItems: "center",
          }}
        >
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: c,
                border:
                  color === c ? "2px solid white" : "2px solid transparent",
                cursor: "pointer",
                transform: color === c ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* Tools Switcher */}
      <button
        className={`tool-btn ${tool === "pencil" ? "active" : ""}`}
        onClick={() => setTool("pencil")}
        title="Pencil"
      >
        <Pencil size={20} />
      </button>

      <button
        className={`tool-btn ${tool === "hand" ? "active" : ""}`}
        onClick={() => setTool("hand")}
        title="Pan Tool (Move Canvas)"
      >
        <Hand size={20} />
      </button>

      <div style={{ width: "1px", background: "#444" }}></div>

      <button className="tool-btn" onClick={clearBoard} title="Clear Board">
        <Trash2 size={20} color="#ef4444" />
      </button>
    </div>
  );
};

export default Toolbar;
