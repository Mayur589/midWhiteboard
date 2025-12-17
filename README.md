# midWhiteBoard - Real-Time Collaborative Whiteboard

![Project Status](https://img.shields.io/badge/status-active-success)
![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go)
![React Version](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![License](https://img.shields.io/badge/license-MIT-blue)

**midWhiteBoard** is a high-performance, distributed real-time collaboration platform designed to demonstrate advanced concurrency, websocket architecture, and modern state synchronization techniques. It allows multiple users to draw, brainstorm, and collaborate on an infinite canvas with sub-30ms latency.

---

## 🚀 Key Features

* **Real-Time Synchronization:** Sub-30ms latency updates using optimized WebSockets.
* **Infinite Canvas:** Vector-based engine allowing users to pan endlessly across the workspace.
* **Room Isolation:** Dynamic room creation allowing distinct groups to collaborate privately.
* **Multiplayer Presence:** Live cursor tracking showing user movements and identity.
* **Concurrency Safe:** Backend powered by Go using Mutexes to handle concurrent map writes safely.
* **Device Agnostic:** Fully responsive touch support for tablets and mobile devices with scroll-locking.

---

## 🛠️ Tech Stack

### Backend (The Engine)
* **Language:** Go (Golang)
* **Transport:** Gorilla WebSockets
* **Architecture:** Hub-based Pub/Sub pattern
* **Concurrency:** Goroutines & Channels, `sync.Mutex` for state safety.

### Frontend (The Client)
* **Framework:** React (Vite)
* **Graphics:** HTML5 Canvas API (2D Context)
* **Styling:** CSS3 (Glassmorphism UI)
* **Icons:** Lucide React
* **Logic:** Custom vector rendering loop (`requestAnimationFrame`) with optimistic UI updates.

---

## 🏗️ Architecture

The system uses a **Thin Server, Smart Client** architecture.

1.  **Connection:** Clients connect via `ws://` protocol with a `?room=id` query parameter.
2.  **Hub:** The Go server assigns the connection to a specific Room Hub.
3.  **Broadcast:**
    * **Drawing:** Vector data `{x0, y0, x1, y1, color}` is broadcast to all *other* clients in the room.
    * **Cursors:** Mouse positions are throttled (30ms) on the client side, then broadcast to create smooth "ghost" cursors.
4.  **Rendering:** The client uses a React `useLayoutEffect` game loop to clear and redraw the canvas 60 times per second, applying camera transformations for the infinite canvas effect.

---

## ⚡ Getting Started

### Prerequisites
* [Go](https://go.dev/dl/) (1.19 or higher)
* [Node.js](https://nodejs.org/) (18 or higher)

### 1. Start the Backend
```bash
cd server
go mod tidy
go run main.go
# Server starts on localhost:8080

```

### 2. Start the Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
# Client starts on localhost:5173

```

### 3. Usage

1. Open `http://localhost:5173` in your browser.
2. You will be redirected to a unique room (e.g., `?room=ABCD`).
3. Copy the URL and open it in a second tab (or on your phone!).
4. Start drawing.

---

## 📱 Mobile Testing (Local Network)

To test on your phone:

1. Find your PC's IP address (e.g., `192.168.1.5`).
2. Run the frontend with host exposed: `npm run dev -- --host`
3. Open `http://192.168.1.5:5173` on your phone.

---

## 🔮 Future Roadmap

* [ ] **Persistence:** Save room state to PostgreSQL/Redis to prevent data loss on refresh.
* [ ] **Undo/Redo:** Implement a Stack-based history system.
* [ ] **Text Tools:** Add the ability to type text on the canvas.
* [ ] **Deployment:** Dockerize the application for easy deployment to Fly.io or Render.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
