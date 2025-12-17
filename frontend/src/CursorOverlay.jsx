import { MousePointer2 } from "lucide-react"; // Let's use a nicer icon if you installed lucide

const CursorOverlay = ({ cursors }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      {Object.entries(cursors).map(([userId, pos]) => (
        <div
          key={userId}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            // THE FIX:
            // 1. duration 0.05s (50ms) is snappy but slightly smoothed.
            // 2. "linear" ensures it moves at constant speed, not "easing" (which feels slow at the start).
            transition: "transform 0.05s linear",
            transform: "translate3d(0,0,0)", // Hardware acceleration hint
          }}
        >
          {/* Using Lucide icon for a sharper look */}
          <MousePointer2
            size={20}
            fill={pos.color || "#ef4444"}
            color="white"
          />

          <div
            style={{
              backgroundColor: pos.color || "#ef4444",
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              marginTop: "4px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            User {userId.slice(0, 4)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CursorOverlay;
