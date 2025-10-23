import { useId, useState } from "react";
import {
  generateLocalKEK,
  generateUMK,
  LOCAL_KEK_KEY_NAME,
  storeUMK,
  unwrapUMK,
  wrapUMK,
} from "../../../shared/crypto/keyManagement";
import { getKey, storeKey } from "../../../shared/db/indexedDB";
import {
  getDeviceId,
  hasDeviceId,
  saveDeviceId,
} from "../../../shared/storage/deviceStorage";
import { login, register } from "../api/authApi";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onShowDebug: () => void;
}

export function LoginForm({ onLoginSuccess, onShowDebug }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const usernameId = useId();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!hasDeviceId()) {
        throw new Error(
          "No device found. Please register on this device first.",
        );
      }

      const storedDeviceId = getDeviceId();
      console.log("Using stored Device ID:", storedDeviceId);

      const localKEK = await getKey(LOCAL_KEK_KEY_NAME);

      if (!localKEK) {
        throw new Error(
          "Local encryption key not found. Please register on this device first.",
        );
      }

      const response = await login(username);

      const umk = await unwrapUMK(response.wrapped_umk, localKEK);
      storeUMK(umk);

      console.log("UMK successfully unwrapped:", umk.length, "bytes");
      console.log("Device ID from server:", response.device_id);

      onLoginSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const umk = await generateUMK();
      console.log("UMK generated:", umk.length, "bytes");

      const localKEK = await generateLocalKEK();
      console.log("Local-KEK generated (non-extractable)");

      await storeKey(LOCAL_KEK_KEY_NAME, localKEK);
      console.log("Local-KEK stored successfully");

      const wrappedUMK = await wrapUMK(umk, localKEK);
      console.log("UMK wrapped successfully");

      const response = await register(username, wrappedUMK);
      console.log("Registration successful, Device ID:", response.device_id);

      // Save device ID to LocalStorage
      saveDeviceId(response.device_id);
      console.log("Device ID saved to LocalStorage");

      setSuccessMessage(
        "Registration successful! Your encryption keys have been generated. You can now log in.",
      );
      setUsername("");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={onShowDebug}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
        >
          View Debug Info
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          E2EE Sync PoC
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor={usernameId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id={usernameId}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {successMessage && (
            <div className="text-green-600 text-sm">{successMessage}</div>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-center text-gray-500">
          PoC - No password required
        </p>
      </div>
    </div>
  );
}
