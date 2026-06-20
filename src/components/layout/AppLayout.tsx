import { useAuth } from "@clerk/react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthSync } from "../auth/AuthSync";
import { Header } from "./Header";
import { LoadingState } from "./PageHeader";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthSync />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingState />;
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingState />;
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}
