export interface DeviceInfo {
  id: string;
  user_id: string;
  wrapped_umk: string;
  created_at: string;
}

export interface DeviceRegistrationResponse {
  device_id: string;
  created_at: string;
}
