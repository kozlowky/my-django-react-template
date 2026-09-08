import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../../lib/auth";

export function RequireAuth() {
  return getAccessToken() ? <Outlet /> : <Navigate to="/feed" replace />;
}
