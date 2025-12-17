package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// 1. Define the Data Structures
type DrawData struct {
	X0    float64 `json:"x0"`
	Y0    float64 `json:"y0"`
	X1    float64 `json:"x1"`
	Y1    float64 `json:"y1"`
	Color string  `json:"color"`
}

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"` // Generic payload
}

// 2. The Room Struct (State + Clients)
type Room struct {
	Clients map[*websocket.Conn]bool
	History []DrawData // <--- THE MEMORY
	Mutex   sync.Mutex // Lock for this specific room
}

// Global Manager for Rooms
var rooms = make(map[string]*Room)
var roomsMutex sync.Mutex // Lock for creating new rooms

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		roomID = "general"
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading:", err)
		return
	}
	defer conn.Close()

	// 3. Get or Create the Room
	roomsMutex.Lock()
	room, exists := rooms[roomID]
	if !exists {
		room = &Room{
			Clients: make(map[*websocket.Conn]bool),
			History: make([]DrawData, 0),
		}
		rooms[roomID] = room
	}
	roomsMutex.Unlock()

	// 4. Join the Room & SEND HISTORY
	room.Mutex.Lock()
	room.Clients[conn] = true
	
	// >>>> SEND HISTORY TO NEW USER <<<<
	if len(room.History) > 0 {
		// Send as a single bulk message for performance
		historyMsg := Message{Type: "history", Data: room.History}
		conn.WriteJSON(historyMsg)
	}
	room.Mutex.Unlock()

	log.Printf("User joined room %s. History size: %d", roomID, len(room.History))

	// Cleanup on exit
	defer func() {
		room.Mutex.Lock()
		delete(room.Clients, conn)
		isEmpty := len(room.Clients) == 0
		room.Mutex.Unlock()

		if isEmpty {
			roomsMutex.Lock()
			delete(rooms, roomID) // Delete room if empty to save RAM
			roomsMutex.Unlock()
			log.Printf("Room %s deleted (empty)", roomID)
		}
	}()

	// 5. The Message Loop
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			break
		}

		room.Mutex.Lock()

		// SAVE TO HISTORY if it's a draw action
		if msg.Type == "draw_line" {
			if dataMap, ok := msg.Data.(map[string]interface{}); ok {
				// Convert map to struct manually (safe way)
				line := DrawData{
					X0:    dataMap["x0"].(float64),
					Y0:    dataMap["y0"].(float64),
					X1:    dataMap["x1"].(float64),
					Y1:    dataMap["y1"].(float64),
					Color: dataMap["color"].(string),
				}
				room.History = append(room.History, line)
			}
		} else if msg.Type == "clear_board" {
			// CLEAR HISTORY
			room.History = make([]DrawData, 0)
		}

		// BROADCAST loop
		for client := range room.Clients {
			if client != conn {
				client.WriteJSON(msg)
			}
		}
		room.Mutex.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	log.Println("GoSketch Server 2.0 (With History) started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}