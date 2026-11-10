import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/ui";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function UserTopbar({ style = {} }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ---------- Meta Pixel Initialization ----------
  useEffect(() => {
    if (!window.fbq) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

      window.fbq("init", "1934937467197429");
    }
    window.fbq("track", "PageView");
  }, []);
  // -----------------------------------------------

  const firstName = String(user?.name || "Student").split(" ")[0];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "14px 32px",
        background: colors.user?.card || colors.base?.card || "#fff",
        borderBottom: `1px solid ${colors.user?.border || colors.base?.border}`,
        position: "sticky",
        top: 0,
        zIndex: 90,
        ...style,
      }}
    >
      {/* Greeting */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 900,
            color: colors.user?.text || colors.typography?.primaryText,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {greeting()}, {firstName} 👋
        </div>
        <div
          style={{
            fontSize: 12,
            color: colors.user?.subHeading || colors.typography?.secondaryText,
            marginTop: 1,
          }}
        >
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
      </div>

      {/* User Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {/* Quick Link: My Learning */}
        <button
          onClick={() => navigate("/app/learning")}
          style={{
            border: `1px solid ${colors.user?.border || colors.base?.border}`,
            cursor: "pointer",
            borderRadius: 11,
            padding: "8px 14px",
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "inherit",
            color: colors.user?.text || colors.typography?.primaryText,
            background: "transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <BookOpen size={15} /> My Learning
        </button>

        {/* User Profile Avatar */}
        <div
          onClick={() => navigate("/app/settings")}
          style={{ cursor: "pointer", display: "flex" }}
          title="Profile & Settings"
        >
          <Avatar src={user?.profile_image} name={user?.name || "U"} size={32} />
        </div>
      </div>
    </div>
  );
}