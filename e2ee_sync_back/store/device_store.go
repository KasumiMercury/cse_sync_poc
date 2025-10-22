package store

import (
	"sync"

	"github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back/models"
	"github.com/google/uuid"
)

type DeviceStore struct {
	devices map[uuid.UUID]*models.Device
	mu      sync.RWMutex
}

func NewDeviceStore() *DeviceStore {
	return &DeviceStore{
		devices: make(map[uuid.UUID]*models.Device),
	}
}

func (s *DeviceStore) Create(userID uuid.UUID, wrappedUMK string) *models.Device {
	s.mu.Lock()
	defer s.mu.Unlock()

	device := models.NewDevice(userID, wrappedUMK)
	s.devices[device.ID] = device

	return device
}

func (s *DeviceStore) FindByID(deviceID uuid.UUID) (*models.Device, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	device, exists := s.devices[deviceID]
	return device, exists
}

func (s *DeviceStore) FindByUserID(userID uuid.UUID) []*models.Device {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var userDevices []*models.Device
	for _, device := range s.devices {
		if device.UserID == userID {
			userDevices = append(userDevices, device)
		}
	}

	return userDevices
}

func (s *DeviceStore) GetAll() []*models.Device {
	s.mu.RLock()
	defer s.mu.RUnlock()

	devices := make([]*models.Device, 0, len(s.devices))
	for _, device := range s.devices {
		devices = append(devices, device)
	}

	return devices
}

func (s *DeviceStore) Delete(deviceID uuid.UUID) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.devices[deviceID]; exists {
		delete(s.devices, deviceID)
		return true
	}

	return false
}
