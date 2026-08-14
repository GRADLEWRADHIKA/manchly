// src/hooks/useMultiTabLogout.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";

export function useMultiTabLogout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = (e) => {
      // If token key was removed or cleared from another tab
      if ((e.key === "manchly_token" || e.key === "token") && !e.newValue) {
        dispatch(logout());
        navigate("/auth", { replace: true });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch, navigate]);
}