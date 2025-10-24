import { useCallback, useEffect, useState } from "react";
import { getSession, LoginForm, type SessionInfo } from "./features/auth";
import { ensureUMKForSession } from "./features/auth/utils/umkSession";
import { Dashboard } from "./features/dashboard";
import { Debug } from "./features/debug";

type Page = "login" | "dashboard" | "debug";

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("login");

  const checkSession = useCallback(async () => {
    try {
      const sessionInfo = await getSession();
      console.log(
        "Session validated successfully for user:",
        sessionInfo.user_id,
      );
      await ensureUMKForSession(sessionInfo);
      console.log("UMK ensured for session");
      setSession(sessionInfo);
      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Session validation failed:", error);
      setSession(null);
      setCurrentPage("login");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLoginSuccess = () => {
    checkSession();
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentPage("login");
  };

  const handleShowDebug = () => {
    setCurrentPage("debug");
  };

  const handleBackFromDebug = () => {
    if (session) {
      setCurrentPage("dashboard");
    } else {
      setCurrentPage("login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (currentPage === "debug") {
    return <Debug onBack={handleBackFromDebug} />;
  }

  if (session && currentPage === "dashboard") {
    return (
      <Dashboard
        session={session}
        onLogout={handleLogout}
        onShowDebug={handleShowDebug}
      />
    );
  }

  return (
    <LoginForm
      onLoginSuccess={handleLoginSuccess}
      onShowDebug={handleShowDebug}
    />
  );
}

export default App;
