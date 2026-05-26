import React, { useEffect, useMemo, useState } from "react";

import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PlayCircle,
  ShieldAlert,
  Trash2,
  Trophy,
  UserCheck,
  Video,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */

const T = {
  bg: "#000000",
  card: "#111111",
  cardHigh: "#161616",
  sidebar: "#0A0A0A",
  orange: "#FFC107",
  orangeD: "#FFB300",
  orangeL: "rgba(255,193,7,0.15)",
  orangeM: "#FFE082",
  green: "#22C55E",
  greenL: "rgba(34,197,94,0.12)",
  red: "#EF4444",
  redL: "rgba(239,68,68,0.12)",
  blue: "#3B82F6",
  blueL: "rgba(59,130,246,0.12)",
  purple: "#A855F7",
  purpleL: "rgba(168,85,247,0.12)",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,193,7,0.3)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
  textMut: "#71717A",
};

/* ─────────────────────────────────────────────
   MOCK COURSE DATA
───────────────────────────────────────────── */
const initialCatalog = [
  {
    id: "course_react_1",
    title: "Advanced React Architecture",
    category: "Frontend",
    students: 1250,
    lessons: 42,
    difficulty: "Advanced",
  },

  {
    id: "course_ai_2",
    title: "AI Prompt Engineering",
    category: "Artificial Intelligence",
    students: 982,
    lessons: 31,
    difficulty: "Intermediate",
  },

  {
    id: "course_node_3",
    title: "Node.js Backend Systems",
    category: "Backend",
    students: 721,
    lessons: 37,
    difficulty: "Intermediate",
  },

  {
    id: "course_ui_4",
    title: "UI/UX Motion Design",
    category: "Design",
    students: 612,
    lessons: 24,
    difficulty: "Beginner",
  },
];

/* ─────────────────────────────────────────────
   ENROLLED COURSES
───────────────────────────────────────────── */

const enrolledSeed = [
  {
    id: "course_react_1",
    title: "Advanced React Architecture",
    progress: 64,
    last_video_id: "vid-react-adv-12",
  },

  {
    id: "course_ai_2",
    title: "AI Prompt Engineering",
    progress: 38,
    last_video_id: "vid-ai-07",
  },
];

/* ─────────────────────────────────────────────
   WEBINARS
───────────────────────────────────────────── */

const webinarSeed = [
  {
    id: "webinar_react_scale",
    title: "Scaling React at Enterprise Level",
    instructor: "Aman Verma",
    date: "28 May 2026",
    price: 499,
  },

  {
    id: "webinar_ai_future",
    title: "Future of AI Products",
    instructor: "Neha Sharma",
    date: "31 May 2026",
    price: 799,
  },

  {
    id: "webinar_ui_motion",
    title: "Motion Systems for Modern UI",
    instructor: "Rahul Kapoor",
    date: "2 June 2026",
    price: 399,
  },
];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function StudentLearningHub() {
  const [activeTab, setActiveTab] = useState("shelf");
  const [catalogCourses, setCatalogCourses] = useState(initialCatalog);
  const [enrolledCourses, setEnrolledCourses] = useState(enrolledSeed);
  const [webinars, setWebinars] = useState(webinarSeed);
  const [enrolledWebinars, setEnrolledWebinars] = useState([]);
  const [loadingWebinarId, setLoadingWebinarId] = useState(null);
  const [verifyWebinarId, setVerifyWebinarId] = useState(null);
  const [successWebinarId, setSuccessWebinarId] = useState(null);

  /* ───────────────────────────────────────── */
  const averageProgress = useMemo(() => {
    if (!enrolledCourses.length) return 0;

    const total = enrolledCourses.reduce(
      (acc, item) => acc + item.progress,
      0
    );
    return Math.round(
      total / enrolledCourses.length
    );
  }, [enrolledCourses]);

  /* ───────────────────────────────────────── */

  const enrollCourse = (course) => {
    const alreadyExists = enrolledCourses.find(
      (c) => c.id === course.id
    );

    if (alreadyExists) return;
    setEnrolledCourses((prev) => [
      ...prev,
      {
        id: course.id,
        title: course.title,
        progress: 0,
        last_video_id: "vid-start-001",
      },
    ]);
  };

  /* ───────────────────────────────────────── */
  const updateProgress = (id, value) => {
    setEnrolledCourses((prev) =>
      prev.map((course) =>
        course.id === id
          ? {
              ...course,
              progress: value,
              last_video_id: `video-${Math.floor(
                value
              )}`,
            }
          : course
      )
    );
  };

  /* ───────────────────────────────────────── */
  const leaveCourse = (id) => {
    setEnrolledCourses((prev) =>
      prev.filter((course) => course.id !== id)
    );
  };

  /* ───────────────────────────────────────── */
  const joinWebinar = (webinar) => {
    setLoadingWebinarId(webinar.id);
    setTimeout(() => {
      setLoadingWebinarId(null);
      setVerifyWebinarId(webinar.id);
    }, 2200);
  };

  /* ───────────────────────────────────────── */
  const verifyPayment = (webinar) => {
    const orderId = `webinar_${webinar.id}_${Date.now()}`;
    if (!orderId.startsWith("webinar_")) {
      return;
    }
    setSuccessWebinarId(webinar.id);
    setEnrolledWebinars((prev) => [
      ...prev,
      {
        ...webinar,
        orderId,
      },
    ]);
    setVerifyWebinarId(null);
    setTimeout(() => {
      setSuccessWebinarId(null);
    }, 3500);
  };

  /* ───────────────────────────────────────── */
  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.textPri,
        padding: 28,
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 36,
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 42,
              fontWeight: 900,
              color: T.orange,
            }}
          >
            Student Dashboard
          </h1>

          <p
            style={{
              color: T.textSec,
              marginTop: 10,
            }}
          >
            Courses, enrollments, webinar
            access & progress tracking.
          </p>
        </div>
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 22,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <BadgeCheck color={T.orange} />

          <div>
            <div
              style={{
                color: T.textMut,
                fontSize: 13,
              }}
            >
              Student Status
            </div>
            <div
              style={{
                fontWeight: 700,
              }}
            >
              Premium Learner
            </div>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",
          gap: 22,
          marginBottom: 40,
        }}
      >
        <StatCard
          icon={<BookOpen />}
          title="Courses In Progress"
          value={enrolledCourses.length}
          subtitle="Currently active learning tracks"
        />

        <StatCard
          icon={<BarChart3 />}
          title="Avg Completion %"
          value={`${averageProgress}%`}
          subtitle="Aggregated learning completion"
        />

        <StatCard
          icon={<CalendarDays />}
          title="Upcoming Webinars"
          value={enrolledWebinars.length}
          subtitle="Verified premium sessions"
        />
      </div>

      {/* MAIN GRID */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.45fr 0.9fr",
          gap: 28,
        }}
      >
        {/* LEFT PANEL */}

        <div>
          {/* TABS */}

          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 26,
            }}
          >
            <button
              onClick={() =>
                setActiveTab("shelf")
              }
              style={tabStyle(
                activeTab === "shelf"
              )}
            >
              My Learning Shelf
            </button>

            <button
              onClick={() =>
                setActiveTab("catalog")
              }
              style={tabStyle(
                activeTab === "catalog"
              )}
            >
              Browse Catalog
            </button>
          </div>

          {/* SHELF */}

          {activeTab === "shelf" && (
            <div
              style={{
                display: "grid",
                gap: 22,
              }}
            >
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  style={courseCardStyle}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 18,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 58,
                            height: 58,
                            borderRadius: 18,
                            background: T.orangeL,
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                          }}
                        >
                          <PlayCircle
                            color={T.orange}
                          />
                        </div>

                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 24,
                            }}
                          >
                            {course.title}
                          </h3>

                          <div
                            style={{
                              marginTop: 6,
                              color: T.textSec,
                            }}
                          >
                            Last Video ID:
                            {" "}
                            <span
                              style={{
                                color: T.orangeM,
                              }}
                            >
                              {
                                course.last_video_id
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        leaveCourse(
                          course.id
                        )
                      }
                      style={{
                        background: T.redL,
                        color: T.red,
                        border: "none",
                        borderRadius: 14,
                        padding:
                          "12px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        height: "fit-content",
                        fontWeight: 700,
                      }}
                    >
                      <Trash2 size={16} />
                      Leave Course
                    </button>
                  </div>

                  {/* PROGRESS */}

                  <div
                    style={{
                      marginTop: 28,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          color: T.textSec,
                        }}
                      >
                        Progress Tracking
                      </span>

                      <span
                        style={{
                          color: T.orange,
                          fontWeight: 700,
                        }}
                      >
                        {course.progress}%
                      </span>
                    </div>

                    <div
                      style={{
                        height: 14,
                        background:
                          "rgba(255,255,255,0.05)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${course.progress}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg,#FFC107,#FFB300)",
                          transition:
                            "0.3s ease",
                        }}
                      />
                    </div>

                    {/* SLIDER */}

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={course.progress}
                      onChange={(e) =>
                        updateProgress(
                          course.id,
                          Number(
                            e.target.value
                          )
                        )
                      }
                      style={{
                        width: "100%",
                        marginTop: 20,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* CATALOG */}

          {activeTab === "catalog" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(320px,1fr))",
                gap: 22,
              }}
            >
              {catalogCourses.map((course) => (
                <div
                  key={course.id}
                  style={courseCardStyle}
                >
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 20,
                      background: T.blueL,
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      marginBottom: 20,
                    }}
                  >
                    <BookOpen
                      color={T.blue}
                      size={32}
                    />
                  </div>

                  <h3
                    style={{
                      fontSize: 24,
                      marginBottom: 12,
                    }}
                  >
                    {course.title}
                  </h3>

                  <div
                    style={{
                      color: T.textSec,
                      lineHeight: 1.7,
                    }}
                  >
                    {course.category}
                    {" • "}
                    {course.lessons} lessons
                    {" • "}
                    {course.difficulty}
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      color: T.textMut,
                    }}
                  >
                    <UserCheck size={16} />
                    {course.students} students
                  </div>

                  <button
                    onClick={() =>
                      enrollCourse(course)
                    }
                    style={{
                      marginTop: 26,
                      width: "100%",
                      background: T.orange,
                      border: "none",
                      color: "#000",
                      padding: "14px",
                      borderRadius: 16,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Enroll Free Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WEBINAR PANEL */}

        <div
          style={{
            background: T.card,
            border: `1px solid ${T.borderHi}`,
            borderRadius: 30,
            padding: 24,
            height: "fit-content",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: T.purpleL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Video
                color={T.purple}
              />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                }}
              >
                Premium Webinars
              </h2>

              <p
                style={{
                  color: T.textSec,
                  marginTop: 6,
                }}
              >
                Paid live masterclasses &
                certifications.
              </p>
            </div>
          </div>

          {/* WEBINAR LIST */}

          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            {webinars.map((webinar) => (
              <div
                key={webinar.id}
                style={{
                  background: T.cardHigh,
                  border: `1px solid ${T.border}`,
                  borderRadius: 24,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 20,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                      }}
                    >
                      {webinar.title}
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        color: T.textSec,
                      }}
                    >
                      {webinar.instructor}
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: T.textMut,
                      }}
                    >
                      <CalendarDays
                        size={16}
                      />
                      {webinar.date}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: T.orange,
                      }}
                    >
                      ₹{webinar.price}
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}

                {!verifyWebinarId &&
                  !enrolledWebinars.find(
                    (w) =>
                      w.id === webinar.id
                  ) && (
                    <button
                      onClick={() =>
                        joinWebinar(
                          webinar
                        )
                      }
                      style={{
                        marginTop: 24,
                        width: "100%",
                        background:
                          T.orange,
                        color: "#000",
                        border: "none",
                        padding:
                          "14px 16px",
                        borderRadius: 16,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {loadingWebinarId ===
                      webinar.id
                        ? "Redirecting to Cashfree Payment Portal..."
                        : "Join Masterclass"}
                    </button>
                  )}

                {/* VERIFY */}

                {verifyWebinarId ===
                  webinar.id && (
                  <div
                    style={{
                      marginTop: 20,
                      background:
                        T.orangeL,
                      borderRadius: 18,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        color:
                          T.orangeM,
                        fontWeight: 700,
                        marginBottom: 12,
                      }}
                    >
                      Verify Payment
                      Gateway Link
                    </div>

                    <button
                      onClick={() =>
                        verifyPayment(
                          webinar
                        )
                      }
                      style={{
                        width: "100%",
                        background:
                          T.green,
                        border: "none",
                        color: "#000",
                        padding:
                          "14px",
                        borderRadius: 16,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Verify Payment
                    </button>
                  </div>
                )}

                {/* SUCCESS */}

                {enrolledWebinars.find(
                  (w) =>
                    w.id === webinar.id
                ) && (
                  <div
                    style={{
                      marginTop: 22,
                      background:
                        T.greenL,
                      borderRadius: 18,
                      padding: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: T.green,
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2
                      size={18}
                    />
                    Webinar Access
                    Verified
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}

      {successWebinarId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.75)",
            backdropFilter:
              "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.borderHi}`,
              borderRadius: 30,
              width: 430,
              padding: 40,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: T.greenL,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                margin:
                  "0 auto 24px",
              }}
            >
              <Trophy
                size={44}
                color={T.green}
              />
            </div>

            <h2
              style={{
                fontSize: 34,
                marginBottom: 14,
                color: T.orange,
              }}
            >
              Webinar Unlocked
            </h2>

            <p
              style={{
                color: T.textSec,
                lineHeight: 1.7,
              }}
            >
              Payment verified successfully.
              Premium access granted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 28,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          background: T.orangeL,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.orange,
          marginBottom: 22,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: T.textSec,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 38,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: T.textMut,
          marginTop: 10,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */

const courseCardStyle = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 28,
  padding: 26,
};

const tabStyle = (active) => ({
  background: active
    ? T.orange
    : T.card,

  color: active
    ? "#000"
    : T.textSec,

  border: active
    ? "none"
    : `1px solid ${T.border}`,

  padding: "14px 22px",

  borderRadius: 16,

  fontWeight: 800,

  cursor: "pointer",

  transition: "0.25s ease",
});