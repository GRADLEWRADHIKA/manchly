import React, { useState } from "react";
import DashboardScreen from "./screens/Auth/Creator/DashboardScreen";
import CoursesScreen from "./screens/Auth/Creator/CoursesScreen";

export default function App() {
  // Temporary mock user
  const user = {
    id: 1,
    name: "Radhika",
    email: "radhika@example.com",
    kyc_verified: true,
  };

  const [activeScreen, setActiveScreen] = useState("dashboard");

  const handleNavigate = (route, params = {}) => {
    console.log("Navigate:", route, params);
    setActiveScreen(route);

  };

  switch (activeScreen) {
    case "courses":
      return <CoursesScreen user={user} onNavigate={handleNavigate} />;
    case "webinars":
    case "sessions":
    case "payments":
    case "community":
    case "settings":
    case "dashboard":
    default:
      return <DashboardScreen user={user} onNavigate={handleNavigate} />;
  }
}