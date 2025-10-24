import { useId, useState } from "react";
import {
  buildLocalKEKKeyName,
  buildUMKWrapAAD,
  createPassphraseRecoveryPayload,
  generateLocalKEK,
  generateUMK,
  storeUMK,
  unwrapUMK,
  wrapUMK,
} from "../../../shared/crypto/keyManagement";
import { getKey, storeKey } from "../../../shared/db/indexedDB";
import {
  getDeviceId,
  saveDeviceId,
} from "../../../shared/storage/deviceStorage";
import { login, registerFinalize, registerInit } from "../api/authApi";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onShowDebug: () => void;
}

export function LoginForm({ onLoginSuccess, onShowDebug }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseConfirm, setPassphraseConfirm] = useState("");
  const [passphraseError, setPassphraseError] = useState("");
  const usernameId = useId();
  const passphraseId = useId();
  const passphraseConfirmId = useId();

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
      const response = await login(username);

      const keyName = buildLocalKEKKeyName(response.user_id);
      const localKEK = await getKey(keyName);

      if (!localKEK) {
        throw new Error(
          "Local encryption key not found. Please register on this device first.",
        );
      }

      const wrapAAD = buildUMKWrapAAD(response.user_id);
      const umk = await unwrapUMK(response.wrapped_umk, localKEK, wrapAAD);
      storeUMK(umk);

      console.log("UMK successfully unwrapped:", umk.length, "bytes");
      console.log("Device ID from server:", response.device_id);

      const storedDeviceId = getDeviceId();
      if (!storedDeviceId || storedDeviceId !== response.device_id) {
        saveDeviceId(response.device_id);
        console.log("Device ID saved to LocalStorage");
      }

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

  const resetPassphraseState = () => {
    setPassphrase("");
    setPassphraseConfirm("");
    setPassphraseError("");
  };

  const handleRegister = () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setError("");
    setSuccessMessage("");
    resetPassphraseState();
    setIsPassphraseModalOpen(true);
  };

  const completeRegistration = async (passphraseInput: string) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const initResponse = await registerInit(username);
      const userId = initResponse.user_id;
      console.log("Registration initialized, User ID:", userId);

      const localKEK = await generateLocalKEK();
      console.log("Local-KEK generated (non-extractable)");

      const keyName = buildLocalKEKKeyName(userId);
      await storeKey(keyName, localKEK);
      console.log("Local-KEK stored successfully");

      const umk = await generateUMK();
      console.log("UMK generated:", umk.length, "bytes");

      const wrapAAD = buildUMKWrapAAD(userId);
      const wrappedUMK = await wrapUMK(umk, localKEK, wrapAAD);
      console.log("UMK wrapped successfully");

      const recoveryPayload = await createPassphraseRecoveryPayload(
        passphraseInput,
        umk,
      );
      console.log("Recovery payload generated for passphrase-based restore");

      storeUMK(umk);
      console.log("UMK stored locally for active session");

      const completeResponse = await registerFinalize(
        wrappedUMK,
        recoveryPayload,
      );
      console.log(
        "Registration finalized, Device ID:",
        completeResponse.device_id,
      );

      // Save device ID to LocalStorage
      if (!completeResponse.device_id) {
        throw new Error("Registration did not return a device identifier");
      }

      saveDeviceId(completeResponse.device_id);
      console.log("Device ID saved to LocalStorage");

      setSuccessMessage(
        "Registration successful! You can now start syncing messages on this device.",
      );
      setIsPassphraseModalOpen(false);
      resetPassphraseState();
      setUsername("");
      onLoginSuccess();
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

  const handlePassphraseModalClose = () => {
    if (isLoading) {
      return;
    }
    setIsPassphraseModalOpen(false);
    resetPassphraseState();
  };

  const handlePassphraseSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setPassphraseError("Passphrase is required");
      return;
    }
    if (passphrase.length < 8) {
      setPassphraseError("Passphrase must be at least 8 characters");
      return;
    }
    if (passphrase !== passphraseConfirm) {
      setPassphraseError("Passphrases do not match");
      return;
    }

    setPassphraseError("");
    await completeRegistration(passphrase);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {isPassphraseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Set Recovery Passphrase
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Enter a passphrase to unlock your master key on new devices. We
                never store this passphrase, so write it down somewhere safe.
              </p>
            </div>

            {passphraseError && (
              <div className="text-red-600 text-sm">{passphraseError}</div>
            )}

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <form onSubmit={handlePassphraseSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor={passphraseId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Passphrase
                </label>
                <input
                  type="password"
                  id={passphraseId}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a secure passphrase"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label
                  htmlFor={passphraseConfirmId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Passphrase
                </label>
                <input
                  type="password"
                  id={passphraseConfirmId}
                  value={passphraseConfirm}
                  onChange={(e) => setPassphraseConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter the passphrase"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handlePassphraseModalClose}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Confirm & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          CSE Sync PoC
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
