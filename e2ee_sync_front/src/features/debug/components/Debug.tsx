import { useCallback, useEffect, useState } from "react";
import { getDebugInfo } from "../api/debugApi";
import type { DebugInfo } from "../types/debug";

interface DebugProps {
  onBack: () => void;
}

export function Debug({ onBack }: DebugProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDebugInfo = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const info = await getDebugInfo();
      setDebugInfo(info);
    } catch (err) {
      setError("Failed to load debug information");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDebugInfo();
  }, [loadDebugInfo]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Debug Information</h1>
          <div className="space-x-2">
            <button
              type="button"
              onClick={loadDebugInfo}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="text-center text-gray-600">Loading...</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {debugInfo && (
          <div className="space-y-6">
            {/* Users Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Users ({debugInfo.users.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                {debugInfo.users.length === 0 ? (
                  <p className="px-6 py-4 text-gray-500 text-sm">
                    No users registered
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {debugInfo.users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.username}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Sessions ({debugInfo.sessions.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                {debugInfo.sessions.length === 0 ? (
                  <p className="px-6 py-4 text-gray-500 text-sm">
                    No active sessions
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {debugInfo.sessions.map((session) => (
                        <tr key={session.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {session.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {session.user_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(session.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(session.expires_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isExpired(session.expires_at) ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Expired
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Devices Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Devices ({debugInfo.devices?.length || 0})
                </h2>
              </div>
              <div className="overflow-x-auto">
                {!debugInfo.devices || debugInfo.devices.length === 0 ? (
                  <p className="px-6 py-4 text-gray-500 text-sm">
                    No devices registered
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wrapped UMK (Preview)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {debugInfo.devices.map((device) => (
                        <tr key={device.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {device.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {device.user_id}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">
                            <div className="max-w-xs truncate">
                              {device.wrapped_umk?.substring(0, 40) || "N/A"}...
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(device.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Messages Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Messages ({debugInfo.messages?.length || 0})
                </h2>
              </div>
              <div className="overflow-x-auto">
                {!debugInfo.messages || debugInfo.messages.length === 0 ? (
                  <p className="px-6 py-4 text-gray-500 text-sm">
                    No messages sent
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Message ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {debugInfo.messages.map((message) => (
                        <tr key={message.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {message.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {message.user_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-md">{message.content}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(message.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
