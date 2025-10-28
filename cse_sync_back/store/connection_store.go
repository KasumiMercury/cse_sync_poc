package store

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Connection struct {
	Conn     *websocket.Conn
	DeviceID uuid.UUID
	UserID   uuid.UUID
	writeMu  sync.Mutex // Protects writes to Conn
}

// WriteJSON safely writes JSON data to the WebSocket connection.
// This method serializes writes to prevent concurrent write corruption.
func (c *Connection) WriteJSON(v interface{}) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	return c.Conn.WriteJSON(v)
}

type ConnectionStore struct {
	mu           sync.RWMutex
	connections  map[uuid.UUID]*Connection
	deviceToUser map[uuid.UUID]uuid.UUID
	userToDevice map[uuid.UUID][]uuid.UUID
}

func NewConnectionStore() *ConnectionStore {
	return &ConnectionStore{
		connections:  make(map[uuid.UUID]*Connection),
		deviceToUser: make(map[uuid.UUID]uuid.UUID),
		userToDevice: make(map[uuid.UUID][]uuid.UUID),
	}
}

func (cs *ConnectionStore) RegisterConnection(deviceID, userID uuid.UUID, conn *websocket.Conn) {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	connection := &Connection{
		Conn:     conn,
		DeviceID: deviceID,
		UserID:   userID,
	}

	cs.connections[deviceID] = connection
	cs.deviceToUser[deviceID] = userID

	cs.userToDevice[userID] = append(cs.userToDevice[userID], deviceID)
}

func (cs *ConnectionStore) RemoveConnection(deviceID uuid.UUID) {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	connection, exists := cs.connections[deviceID]
	if !exists {
		return
	}

	userID := connection.UserID

	delete(cs.connections, deviceID)
	delete(cs.deviceToUser, deviceID)

	devices := cs.userToDevice[userID]
	for i, id := range devices {
		if id == deviceID {
			cs.userToDevice[userID] = append(devices[:i], devices[i+1:]...)
			break
		}
	}

	if len(cs.userToDevice[userID]) == 0 {
		delete(cs.userToDevice, userID)
	}

	connection.Conn.Close()
}

func (cs *ConnectionStore) GetConnection(deviceID uuid.UUID) *Connection {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	return cs.connections[deviceID]
}

func (cs *ConnectionStore) GetUserConnections(userID uuid.UUID) []*Connection {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	deviceIDs, exists := cs.userToDevice[userID]
	if !exists {
		return nil
	}

	connections := make([]*Connection, 0, len(deviceIDs))
	for _, deviceID := range deviceIDs {
		if conn, exists := cs.connections[deviceID]; exists {
			connections = append(connections, conn)
		}
	}

	return connections
}

func (cs *ConnectionStore) GetUserIDByDevice(deviceID uuid.UUID) (uuid.UUID, bool) {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	userID, exists := cs.deviceToUser[deviceID]
	return userID, exists
}

func (cs *ConnectionStore) IsDeviceConnected(deviceID uuid.UUID) bool {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	_, exists := cs.connections[deviceID]
	return exists
}

func (cs *ConnectionStore) GetConnectionCount() int {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	return len(cs.connections)
}
