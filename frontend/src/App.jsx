import { Copy, Users } from "lucide-react"; // Import icons
import { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import Whiteboard from "./Whiteboard";

const generateRoomId = () =>
  Math.random().toString(36).substr(2, 6).toUpperCase();

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [currentColor, setCurrentColor] = useState("#ffffff"); // Default White
  const whiteboardRef = useRef(null); // Ref to call child functions
  const [tool, setTool] = useState('pencil');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let room = params.get("room");
    if (!room) {
      room = generateRoomId();
      window.history.replaceState(null, "", `?room=${room}`);
    }
    setRoomId(room);

    // FIX: Use window.location.hostname instead of "localhost"
    // This automatically picks up your IP (e.g., 192.168.1.5) when on mobile
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:8080/ws?room=${room}`;

    console.log("Connecting to:", wsUrl); // Debugging help
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setSocket(ws);
    return () => ws.close();
  }, []);

  // Copy Room Link to Clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied to clipboard! 🎮");
  };

  // Trigger Clear Board
  const handleClear = () => {
    if (whiteboardRef.current) whiteboardRef.current.clearBoard();
  };

  return (
    <div
      style={{ width: "100vw", height: "100vh", background: "var(--bg-color)" }}
    >
      {/* HEADER HUD */}
      <div
        className="hud-panel"
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 50,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} className="text-secondary" />
          <span style={{ fontSize: "14px", color: "#888" }}>Room:</span>
          <span className="room-badge">{roomId}</span>
        </div>
        <button
          className="tool-btn"
          onClick={copyLink}
          style={{ padding: "4px" }}
        >
          <Copy size={16} />
        </button>
      </div>

      {/* GAME CANVAS */}
      {socket ? (
        <>
          <Whiteboard
            ref={whiteboardRef}
            socket={socket}
            color={currentColor}
            tool={tool}
          />
          <Toolbar
            color={currentColor}
            setColor={setCurrentColor}
            clearBoard={handleClear}
            tool={tool}
            setTool={setTool}
          />
        </>
      ) : (
        <div
          style={{
            color: "white",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          Connecting to Server...
        </div>
      )}
    </div>
  );
}

export default App;
