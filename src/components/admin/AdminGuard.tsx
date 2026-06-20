import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isAdmin } from "@/lib/roles";
import { LoadingState } from "@/components/layout/PageHeader";

export function AdminGuard() {
  const user = useQuery(api.users.current);

  if (user === undefined) {
    return <LoadingState />;
  }

  if (!isAdmin(user?.roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
