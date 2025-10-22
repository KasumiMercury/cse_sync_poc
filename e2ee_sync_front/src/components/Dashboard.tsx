import { useState } from "react";
import type { SessionInfo } from "../types/session";
import { logout } from "../utils/api";

interface DashboardProps {
  session: SessionInfo;
  onLogout: () => void;
  onShowDebug: () => void;
}

export function Dashboard({ session, onLogout, onShowDebug }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
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
            E2EE Sync Dashboard
          </h1>
          <div className="space-x-2">
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
        <div className="bg-white rounded-lg shadow p-6">
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
      </main>
    </div>
  );
}
