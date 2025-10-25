import { useCallback, useEffect, useState } from "react";
import { clearStoredUMK } from "../../../shared/crypto/keyManagement";
import {
  clearCachedDeviceWrap,
  clearCachedMessagesForUser,
} from "../../../shared/db/indexedDB";
import { getDeviceId } from "../../../shared/storage/deviceStorage";
import { clearCachedSessionInfo } from "../../../shared/storage/sessionStorage";
import {
  isDebugOffline,
  setDebugOffline,
} from "../../../shared/utils/debugOffline";
import { logout } from "../../auth/api/authApi";
import type { SessionInfo } from "../../auth/types/session";
import { getMessages, sendMessage } from "../api/messageApi";
import type { Message } from "../types/message";

interface DashboardProps {
  session: SessionInfo;
  onLogout: () => void;
  onShowDebug: () => void;
}

export function Dashboard({ session, onLogout, onShowDebug }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [debugOfflineEnabled, setDebugOfflineEnabled] = useState(false);

  useEffect(() => {
    setDebugOfflineEnabled(isDebugOffline());
  }, []);

  const handleDebugOfflineToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const enabled = event.target.checked;
    setDebugOfflineEnabled(enabled);
    setDebugOffline(enabled);
  };

  const loadMessages = useCallback(async () => {
    try {
      setStatusMessage(null);
      const result = await getMessages(session);
      setMessages(result.messages);
      if (result.source === "cache") {
        setStatusMessage("Offline mode: showing previously synced messages.");
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    }
  }, [session]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    setIsSending(true);
    setError(null);
    setStatusMessage(null);
    try {
      await sendMessage(messageInput, session);
      setMessageInput("");
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      try {
        await clearCachedMessagesForUser(session.user_id);
      } catch (cacheError) {
        console.warn("Failed to clear cached messages on logout:", cacheError);
      }

      const deviceId = getDeviceId();
      if (deviceId) {
        try {
          await clearCachedDeviceWrap(deviceId);
        } catch (wrapError) {
          console.warn("Failed to clear cached device wrap:", wrapError);
        }
      }

      clearCachedSessionInfo();
      clearStoredUMK();
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            CSE Sync Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={debugOfflineEnabled}
                onChange={handleDebugOfflineToggle}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>Simulate Offline</span>
            </label>
            <button
              type="button"
              onClick={onShowDebug}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              Debug
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            User Information
          </h2>

          <div className="space-y-2">
            <div className="flex">
              <span className="font-medium text-gray-600 w-24">Username:</span>
              <span className="text-gray-800">{session.username}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-600 w-24">User ID:</span>
              <span className="text-gray-800 font-mono text-sm">
                {session.user_id}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Messages</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {statusMessage && !error && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Enter your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !messageInput.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No messages yet. Send your first message!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 bg-gray-50 rounded-md border border-gray-200"
                >
                  <p className="text-gray-800">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
