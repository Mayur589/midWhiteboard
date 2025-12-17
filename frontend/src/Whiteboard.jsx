import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CursorOverlay from "./CursorOverlay";
import { throttle } from "./utils";

const Whiteboard = forwardRef(({ socket, color, tool }, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursors, setCursors] = useState({});
  const myId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  // --- STATE STORES ---
  // 1. History of all shapes (The "Truth")
  const elements = useRef([]);
  // 2. Camera Viewport (The "Window")
  const camera = useRef({ x: 0, y: 0 });
  // 3. Mouse Tracking
  const lastMousePos = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    clearBoard: () => {
      elements.current = []; // Wipe history
      socket.send(JSON.stringify({ type: "clear_board" }));
    },
  }));

  // --- RENDER ENGINE (The Game Loop) ---
  useLayoutEffect(() => {
    let animationFrameId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      // 1. Clear Screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Save Context & Apply Camera Transform
      ctx.save();
      ctx.translate(camera.current.x, camera.current.y);

      // 3. Redraw ALL Elements (The "Infinite" Illusion)
      ctx.lineCap = "round";
      ctx.lineWidth = 3;

      elements.current.forEach((el) => {
        ctx.beginPath();
        ctx.moveTo(el.x0, el.y0);
        ctx.lineTo(el.x1, el.y1);
        ctx.strokeStyle = el.color;
        ctx.stroke();
      });

      // 4. Restore Context (so next frame starts clean)
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- COORDINATE HELPERS ---
  // Convert Screen Coordinates (Mouse) -> World Coordinates (Canvas)
  // Logic: WorldX = MouseX - CameraX
  const toWorld = (x, y) => ({
    x: x - camera.current.x,
    y: y - camera.current.y,
  });

  const getCoordinates = (event) => {
    if (event.touches) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    }
    return { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
  };

  // --- INPUT HANDLERS ---
  const handleStart = (event) => {
    if (event.cancelable) event.preventDefault();
    const { x, y } = getCoordinates(event);

    lastMousePos.current = { x, y };
    setIsDrawing(true);

    // Send cursor (Screen Coordinates are fine for cursors usually,
    // but better to send World if we want cursors to stick to drawings.
    // For now, let's keep cursors in Screen Space for simplicity)
    sendCursorUpdate(x, y);
  };

  const handleMove = (event) => {
    if (event.cancelable) event.preventDefault();
    const { x, y } = getCoordinates(event);

    // 1. Calculate Delta (How much did we move?)
    const dx = x - lastMousePos.current.x;
    const dy = y - lastMousePos.current.y;

    if (isDrawing) {
      if (tool === "hand") {
        // --- PANNING MODE ---
        camera.current.x += dx;
        camera.current.y += dy;
      } else {
        // --- DRAWING MODE ---
        // We must convert Screen Coords -> World Coords before storing
        const startWorld = toWorld(
          lastMousePos.current.x,
          lastMousePos.current.y,
        );
        const endWorld = toWorld(x, y);

        // Add to local history
        const newElement = {
          x0: startWorld.x,
          y0: startWorld.y,
          x1: endWorld.x,
          y1: endWorld.y,
          color: color,
        };
        elements.current.push(newElement);

        // Broadcast to World
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "draw_line",
              data: newElement, // We send World Coordinates
            }),
          );
        }
      }
    }

    lastMousePos.current = { x, y };
    sendCursorUpdate(x, y);
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  // --- SOCKET HANDLER ---
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "draw_line":
          // Receive World Coordinates and push to history
          // The render loop will handle drawing it in the right place
          elements.current.push(msg.data);
          break;

        case "cursor_move":
          setCursors((prev) => ({
            ...prev,
            [msg.data.userId]: {
              x: msg.data.x,
              y: msg.data.y,
              lastUpdate: Date.now(),
            },
          }));
          break;

        case "clear_board":
          elements.current = [];
          break;
      }
    };
    socket.addEventListener("message", handleMessage);

    // Zombie Cursor Cleanup
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((k) => {
          if (now - next[k].lastUpdate > 3000) {
            delete next[k];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      socket.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, [socket]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Init
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sendCursorUpdate = useMemo(
    () =>
      throttle((x, y) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "cursor_move",
              data: { userId: myId, x, y },
            }),
          );
        }
      }, 30),
    [socket, myId],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: tool === "hand" ? "grab" : "crosshair",
      }}
    >
      {/* We pass 'camera' to cursor overlay if we want cursors to move with the map.
          For now, keeping cursors as "Screen Overlay" (like Discord) is standard. */}
      <CursorOverlay cursors={cursors} />

      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{ display: "block", touchAction: "none" }}
      />
    </div>
  );
});

export default Whiteboard;
