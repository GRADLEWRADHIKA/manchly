import { API_BASE } from "./api";
import React, { useState, useEffect } from "react";

import AuthPage from "./AuthPage";
import StudentDashboard from "./StudentDasboard.jsx"; // keep original spelling
import CourseStudio from "./CourseStudio";
import WebinarManager from "./WebinarManager";
import PaymentsDashboard from "./PaymentsDashboard";
import CreatorSettlementPortal from "./CreatorSettlementsPortal";
import CreateKycDashboard from "./CreateKycDashboard.jsx";
import SessionHub from "./SessionHubCreator.jsx";
import SessionHubCreator from "./SessionHubCreator.jsx";
import TelegramChannels from "./TelegramChannels.jsx";
import ChatPanel from "./ChatPanel.jsx";
import StudentSessionBooking from "./StudentSessionBooking.jsx";
import AdminPanel from "./AdminPanel.jsx";
import GroupsPanel from "./GroupsPanel.jsx";
import CreatorOverview from "./CreatorOverview.jsx";
import NotificationsPanel, { NotificationBell } from "./NotificationsPanel.jsx";
import CoursePlayer from "./CoursePlayer.jsx";
import AIAssistant from "./AIAssistant.jsx";
import HelpCenter from "./HelpCenter.jsx";
//import CreatorEngineBrandMarketplace from "./CreatorMarketplace.jsx";
import BrandMarketplace from "./BrandMarketplace.jsx";
import CreatorCenter from "./CreatorCenter.jsx";

export default function App() {
  // USER STATE — restored from localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Hydrate user from GET /auth/me so the cached localStorage profile catches
  // up with server-side changes (e.g. admin promoted them to CREATOR, or kyc_verified flipped).
  // If the token is invalid the call 401s — we treat that as a forced logout.
  useEffect(() => {
    const token =
      localStorage.getItem("manchly_token") || localStorage.getItem("token");
    if (!token) return;

    fetch(API_BASE + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("manchly_token");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const fresh = data?.user || data?.data || data;
        if (!fresh || !fresh.email) return;
        setUser((prev) => {
          const merged = { ...(prev || {}), ...fresh };
          localStorage.setItem("user", JSON.stringify(merged));
          return merged;
        });
      })
      .catch((err) => console.warn("[App] /auth/me hydration:", err?.message));
  }, []);

  // user_type may be an array (e.g. ["USER","CREATOR"]) or a string
  const rawRole = Array.isArray(user?.user_type)
    ? user.user_type.includes("ADMIN")
      ? "ADMIN"
      : user.user_type.includes("CREATOR")
        ? "CREATOR"
        : user.user_type[0] || ""
    : user?.user_type || user?.role || user?.tab || "";
  const role = (() => {
    const r = String(rawRole).toUpperCase();
    if (r === "ADMIN") return "ADMIN";
    if (r === "CREATOR") return "CREATOR";
    if (r === "STUDENT" || r === "USER") return "USER";
    return r;
  })();

  const B = {
    bg: "#000000",
    card: "#111111",
    sidebar: "#0A0A0A",
    orange: "#FFC107",
    orangeD: "#FFB300",
    border: "rgba(255,255,255,0.1)",
    textPrimary: "#FFFFFF",
    textSec: "#A1A1AA",
    green: "#10B981",
    red: "#EF4444",
  };
  const [activePage, setActivePage] = useState(() => {
    const rawT = user?.user_type;
    const r = (
      Array.isArray(rawT)
        ? rawT.includes("ADMIN")
          ? "ADMIN"
          : rawT.includes("CREATOR")
            ? "CREATOR"
            : rawT[0] || ""
        : String(rawT || user?.role || user?.tab || "")
    ).toUpperCase();
    if (r === "ADMIN") return "admin";
    if (r === "CREATOR") return "overview";
    return "dashboard";
  });
  const [showProfile, setShowProfile] = useState(false);
  // bumped whenever notifications are read, so the header bell re-counts immediately
  const [notifRefresh, setNotifRefresh] = useState(0);
  // NOT LOGGED IN
  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={(authData) => {
          console.log("AUTH SUCCESS:", authData);
          const finalUser = authData?.user || authData;
          localStorage.setItem("user", JSON.stringify(finalUser));
          setUser(finalUser);

          const rawT = finalUser?.user_type;
          const finalRole = (
            Array.isArray(rawT)
              ? rawT.includes("ADMIN")
                ? "ADMIN"
                : rawT.includes("CREATOR")
                  ? "CREATOR"
                  : rawT[0] || ""
              : String(rawT || finalUser?.role || finalUser?.tab || "")
          ).toUpperCase();

          setActivePage(
            finalRole === "ADMIN"
              ? "admin"
              : finalRole === "CREATOR"
                ? "overview"
                : "dashboard",
          );
        }}
      />
    );
  }

  const logout = () => {
    localStorage.removeItem("manchly_token"); // primary key used by all API helpers
    localStorage.removeItem("token"); // legacy fallback
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    setActivePage("dashboard");
  };
  // MAIN APP
  return (
    <div
      style={{
        background: B.bg,
        minHeight: "100vh",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 32px",
          borderBottom: `1px solid ${B.border}`,
          background: B.card,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <h1
            style={{
              color: B.orange,
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            Manchly Platform
          </h1>
          <p style={{ color: B.textSec, marginTop: 6 }}>
            Welcome, {user?.name || "User"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <NotificationBell
            role={role}
            active={activePage === "notifications"}
            refreshKey={notifRefresh}
            onOpen={() => setActivePage("notifications")}
          />
          <div
            style={{
              background: B.sidebar,
              border: `1px solid ${B.border}`,
              padding: "10px 16px",
              borderRadius: 12,
              color: B.orange,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {role}
          </div>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              background: B.card,
              border: `1px solid ${B.border}`,
              color: B.textPrimary,
              padding: "10px 16px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            ⚙ Profile
          </button>
          <button
            onClick={logout}
            style={{
              background: B.red,
              border: "none",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* PROFILE EDIT MODAL — PUT /auth/profile */}
      {showProfile && (
        <ProfileEditModal
          B={B}
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={(updatedUser) => {
            setUser((prev) => {
              const merged = { ...(prev || {}), ...updatedUser };
              localStorage.setItem("user", JSON.stringify(merged));
              return merged;
            });
            setShowProfile(false);
          }}
        />
      )}

      {/* ── NAVIGATION ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "20px 24px",
          flexWrap: "wrap",
        }}
      >
        {role === "USER" && (
          <>
            <NavButton
              label="Dashboard"
              active={activePage === "dashboard"}
              onClick={() => setActivePage("dashboard")}
              B={B}
            />
            <NavButton
              label="My Learning"
              active={activePage === "learn"}
              onClick={() => setActivePage("learn")}
              B={B}
            />
            <NavButton
              label="Payments"
              active={activePage === "payments"}
              onClick={() => setActivePage("payments")}
              B={B}
            />
            <NavButton
              label="Book Sessions"
              active={activePage === "book"}
              onClick={() => setActivePage("book")}
              B={B}
            />
            <NavButton
              label="Messages"
              active={activePage === "chat"}
              onClick={() => setActivePage("chat")}
              B={B}
            />
            <NavButton
              label="Groups"
              active={activePage === "groups"}
              onClick={() => setActivePage("groups")}
              B={B}
            />
            <NavButton
              label="Brand Marketplace"
              active={activePage === "brand-marketplace"}
              onClick={() => setActivePage("brand-marketplace")}
              B={B}
            />
          </>
        )}

        {/* CREATOR NAV */}
        {role === "CREATOR" && (
          <>
            <NavButton
              label="Overview"
              active={activePage === "overview"}
              onClick={() => setActivePage("overview")}
              B={B}
            />
            <NavButton
              label="Creator Center"
              active={activePage === "creator-center"}
              onClick={() => setActivePage("creator-center")}
              B={B}
            />
            <NavButton
              label="KYC"
              active={activePage === "kyc"}
              onClick={() => setActivePage("kyc")}
              B={B}
            />
            <NavButton
              label="Payments"
              active={activePage === "payments"}
              onClick={() => setActivePage("payments")}
              B={B}
            />
            <NavButton
              label="Settlements"
              active={activePage === "settlements"}
              onClick={() => setActivePage("settlements")}
              B={B}
            />
            <NavButton
              label="Courses"
              active={activePage === "courses"}
              onClick={() => setActivePage("courses")}
              B={B}
            />
            <NavButton
              label="Webinars"
              active={activePage === "webinars"}
              onClick={() => setActivePage("webinars")}
              B={B}
            />
            <NavButton
              label="1-on-1 Sessions"
              active={activePage === "sessions"}
              onClick={() => setActivePage("sessions")}
              B={B}
            />
            <NavButton
              label="Faah-AI"
              active={activePage === "ai"}
              onClick={() => setActivePage("ai")}
              B={B}
            />
            <NavButton
              label="Telegram"
              active={activePage === "telegram"}
              onClick={() => setActivePage("telegram")}
              B={B}
            />
            <NavButton
              label="Messages"
              active={activePage === "chat"}
              onClick={() => setActivePage("chat")}
              B={B}
            />
            <NavButton
              label="Groups"
              active={activePage === "groups"}
              onClick={() => setActivePage("groups")}
              B={B}
            />
          </>
        )}

        {/* ADMIN NAV */}
        {role === "ADMIN" && (
          <>
            <NavButton
              label="Admin Panel"
              active={activePage === "admin"}
              onClick={() => setActivePage("admin")}
              B={B}
            />
            <NavButton
              label="Messages"
              active={activePage === "chat"}
              onClick={() => setActivePage("chat")}
              B={B}
            />
            <NavButton
              label="Groups"
              active={activePage === "groups"}
              onClick={() => setActivePage("groups")}
              B={B}
            />
            <NavButton
              label="Brand Marketplace"
              active={activePage === "brand-marketplace"}
              onClick={() => setActivePage("brand-marketplace")}
              B={B}
            />

            <NavButton
              label="Creator Center"
              active={activePage === "creator-center"}
              onClick={() => setActivePage("creator-center")}
              B={B}
            />
          </>
        )}
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ padding: "0 24px 24px" }}>
        {/* CREATOR OVERVIEW / HOME */}
        {activePage === "overview" && role === "CREATOR" && (
          <CreatorOverview user={user} onNavigate={setActivePage} />
        )}
        {activePage === "brand-marketplace" &&
          (role === "USER" || role === "ADMIN") && <BrandMarketplace />}
        {activePage === "creator-center" &&
          (role === "CREATOR" || role === "ADMIN") && <CreatorCenter />}
        {/* USER DASHBOARD */}
        {activePage === "dashboard" && role === "USER" && <StudentDashboard />}
        {/* USER — MY LEARNING / VIDEO PLAYER */}
        {activePage === "learn" && role === "USER" && <CoursePlayer />}
        {/* FAAH-AI — CREATOR ONLY */}
        {activePage === "ai" && role === "CREATOR" && <AIAssistant />}
        {/* NOTIFICATIONS — all roles */}
        {activePage === "notifications" && (
          <NotificationsPanel
            role={role}
            onChanged={() => setNotifRefresh((n) => n + 1)}
          />
        )}
        {/* PAYMENTS — both roles */}
        {activePage === "payments" && (
          <PaymentsDashboard role={role} user_type={role} />
        )}
        {/* CREATOR KYC */}
        {activePage === "kyc" && role === "CREATOR" && <CreateKycDashboard />}
        {/* CREATOR SETTLEMENTS */}
        {activePage === "settlements" && role === "CREATOR" && (
          <CreatorSettlementPortal />
        )}
        {/* COURSE STUDIO */}
        {activePage === "courses" && role === "CREATOR" && (
          <CourseStudio
            B={B}
            userProfile={{
              user_type: "CREATOR",
              name: user?.name || "Creator",
            }}
          />
        )}
        {/* WEBINAR MANAGER */}
        {activePage === "webinars" && role === "CREATOR" && (
          <WebinarManager
            B={B}
            userProfile={{
              user_type: "CREATOR",
              name: user?.name || "Creator",
            }}
          />
        )}
        {/* SESSION HUB — CREATOR ONLY */}
        {activePage === "sessions" && role?.toUpperCase() === "CREATOR" && (
          <SessionHubCreator user_type={role} user={user} />
        )}
        {/* TELEGRAM CHANNELS — CREATOR ONLY */}
        {activePage === "telegram" && role?.toUpperCase() === "CREATOR" && (
          <TelegramChannels />
        )}
        {/* CHAT — both roles */}
        {activePage === "chat" && <ChatPanel currentUser={user} />}
        {/* STUDENT SESSION BOOKING — USER ONLY */}
        {activePage === "book" && role === "USER" && (
          <StudentSessionBooking currentUser={user} />
        )}
        {/* ADMIN PANEL — ADMIN ONLY */}
        {activePage === "admin" && role === "ADMIN" && <AdminPanel />}
        {/* GROUPS — all roles */}
        {activePage === "groups" && <GroupsPanel currentUser={user} />}
        {/* HELP & LEGAL — all roles */}
        {activePage === "help" && <HelpCenter role={role} />}
      </div>

      {/* ── FOOTER (support · social · policies) ── */}
      <AppFooter onHelp={() => setActivePage("help")} B={B} />
    </div>
  );
}

function AppFooter({ onHelp, B }) {
  const IG = "https://www.instagram.com/manchly_app";
  const WA =
    "https://wa.me/916363790659?text=" +
    encodeURIComponent("Hello, I need help with Manchly.");
  const link = {
    background: "transparent",
    border: "none",
    color: B.textSec,
    cursor: "pointer",
    fontSize: 12.5,
    padding: 0,
    fontFamily: "inherit",
    textDecoration: "underline",
  };
  return (
    <div
      style={{
        borderTop: `1px solid ${B.border}`,
        padding: "18px 24px",
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        color: B.textSec,
        fontSize: 12.5,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span>© Agnivora Digital · Manchly</span>
        <button onClick={onHelp} style={link}>
          Help &amp; Support
        </button>
        <button onClick={onHelp} style={link}>
          Terms
        </button>
        <button onClick={onHelp} style={link}>
          Privacy
        </button>
        <button onClick={onHelp} style={link}>
          Refund Policy
        </button>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <a
          href={WA}
          target="_blank"
          rel="noreferrer"
          style={{ color: B.textSec, textDecoration: "none" }}
        >
          WhatsApp
        </a>
        <a
          href={IG}
          target="_blank"
          rel="noreferrer"
          style={{ color: B.textSec, textDecoration: "none" }}
        >
          AtSign
        </a>
      </div>
    </div>
  );
}
// PROFILE EDIT MODAL — PUT /auth/profile
function ProfileEditModal({ B, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone_number: user?.phone_number || user?.phone || "",
    profile_image: user?.profile_image || "",
    instagram_link: user?.instagram_link || "",
    linkedin_link: user?.linkedin_link || "",
    youtube_link: user?.youtube_link || "",
    facebook_link: user?.facebook_link || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const token =
        localStorage.getItem("manchly_token") || localStorage.getItem("token");
      const res = await fetch(API_BASE + "/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error?.message || data?.message || "Update failed",
        );
      }
      const updated = data?.user || data?.data || data;
      onSaved(updated || form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: B.card,
          border: `1px solid ${B.border}`,
          borderRadius: 18,
          padding: 26,
          width: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: B.textSec,
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        <p
          style={{
            fontSize: 11,
            color: B.textSec,
            fontFamily: "monospace",
            marginBottom: 16,
          }}
        >
          PUT /auth/profile
        </p>

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: `1px solid ${B.red}`,
              color: B.red,
              borderRadius: 10,
              padding: "8px 12px",
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          <ProfileField
            B={B}
            label="Name"
            value={form.name}
            onChange={set("name")}
          />
          <ProfileField
            B={B}
            label="Phone number"
            value={form.phone_number}
            onChange={set("phone_number")}
          />
          <ProfileField
            B={B}
            label="Profile image URL"
            value={form.profile_image}
            onChange={set("profile_image")}
          />
          <ProfileField
            B={B}
            label="Instagram"
            value={form.instagram_link}
            onChange={set("instagram_link")}
            placeholder="https://instagram.com/..."
          />
          <ProfileField
            B={B}
            label="LinkedIn"
            value={form.linkedin_link}
            onChange={set("linkedin_link")}
            placeholder="https://linkedin.com/in/..."
          />
          <ProfileField
            B={B}
            label="YouTube"
            value={form.youtube_link}
            onChange={set("youtube_link")}
            placeholder="https://youtube.com/@..."
          />
          <ProfileField
            B={B}
            label="Facebook"
            value={form.facebook_link}
            onChange={set("facebook_link")}
            placeholder="https://facebook.com/..."
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              background: "transparent",
              border: `1px solid ${B.border}`,
              color: B.textSec,
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: B.orange,
              color: "#000",
              border: "none",
              padding: "10px 20px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ B, label, value, onChange, placeholder }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11.5,
          fontWeight: 600,
          color: B.textSec,
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder || ""}
        style={{
          width: "100%",
          background: B.sidebar,
          border: `1px solid ${B.border}`,
          color: B.textPrimary,
          padding: "10px 12px",
          borderRadius: 10,
          outline: "none",
          fontSize: 13,
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

// NAV BUTTON
function NavButton({ label, active, onClick, B }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? B.orange : B.card,
        color: active ? "#000" : "#fff",
        border: `1px solid ${active ? B.orange : B.border}`,
        padding: "11px 20px",
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 13,
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}
