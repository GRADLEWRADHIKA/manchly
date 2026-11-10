// CreatorDashboard.jsx
// ---------------------------------------------------------------------------
// Creator-side landing page shell. Houses six tab-views:
//   • Overview   (OverviewPage)
//   • Earnings   (EarningsPage)
//   • Audience   (AudiencePage)
//   • Courses    (CoursePage)
//   • Webinars   (WebinarsPage)
//   • Sessions   (SessionPage)
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import { LayoutDashboard, TrendingUp, Users, BookOpen, Video, Calendar } from "lucide-react";
import { T } from "./types";

import OverviewPage  from "./OverviewPage";
import EarningsPage  from "./EarningsPage";
import AudiencePage  from "./AudiencePage";
import CoursePage    from "./CoursePage";
import WebinarsPage  from "./WebinarsPage";
import SessionsPage  from "./SessionPage";

/* ---------------------------------------------------------------------- */
/* Tab definitions                                                         */
/* ---------------------------------------------------------------------- */
const TABS = [
  { id: "overview",  label: "Overview",     Icon: LayoutDashboard, Page: OverviewPage  },
  { id: "earnings",  label: "Earnings",     Icon: TrendingUp,      Page: EarningsPage  },
  { id: "audience",  label: "Audience",     Icon: Users,           Page: AudiencePage  },
  { id: "courses",   label: "Courses",      Icon: BookOpen,        Page: CoursePage    },
  { id: "webinars",  label: "Webinars",     Icon: Video,           Page: WebinarsPage  },
  { id: "sessions",  label: "1:1 Sessions", Icon: Calendar,        Page: SessionsPage  },
];

/* ---------------------------------------------------------------------- */
/* Component                                                               */
/* ---------------------------------------------------------------------- */
export default function CreatorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("overview");

  const current = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const { Page: ActivePage } = current;

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh" }}>
      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, #0D0D0D 0%, #111111 100%)`,
          borderBottom: `1px solid ${T.border}`,
          padding: "28px 32px 0",
        }}
      >
        {/* greeting */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: T.textMut, fontSize: 13, marginBottom: 4 }}>
            Creator Dashboard
          </p>
          <h2
            style={{
              color: T.textPri,
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Welcome back,{" "}
            <span style={{ color: T.orange }}>
              {user?.name || "Creator"}
            </span>{" "}
            👋
          </h2>
          <p style={{ color: T.textMut, fontSize: 13, marginTop: 6 }}>
            Manage your content, track earnings, and grow your audience — all in
            one place.
          </p>
        </div>

        {/* Tab row */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 0 }}>
          {TABS.map(({ id, label, Icon }) => {
            const isActive = id === activeTab;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 18px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.orange : T.textMut,
                  borderBottom: isActive
                    ? `2px solid ${T.orange}`
                    : "2px solid transparent",
                  borderRadius: "6px 6px 0 0",
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = T.textSec;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = T.textMut;
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────── */}
      <div style={{ padding: "28px 32px" }}>
        <ActivePage user={user} />
      </div>
    </div>
  );
}
