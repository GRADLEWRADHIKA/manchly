import React, { useEffect, useState } from "react";
import {
  BookOpen,
  PlayCircle,
  Trash2,
  CalendarDays,
  BadgeCheck,
  Zap,
  Loader2,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

export default function StudentDashboard() {
  // =========================================
  // THEME
  // =========================================

  const T = {
    bg: "#000000",
    card: "#111111",
    sidebar: "#0A0A0A",
    border: "rgba(255,255,255,0.08)",
    orange: "#FFC107",
    orangeLight: "rgba(255,193,7,0.12)",
    text: "#FFFFFF",
    textSec: "#A1A1AA",
    green: "#10B981",
    red: "#EF4444",
  };

  // =========================================
  // TOKEN
  // =========================================

  const TOKEN =
    localStorage.getItem("token") || "";

  // =========================================
  // STATES
  // =========================================

  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] =
    useState([]);

  const [webinars, setWebinars] = useState(
    []
  );

  const [myWebinars, setMyWebinars] =
    useState([]);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingWebinars, setLoadingWebinars] =
    useState(true);

  const [activeTab, setActiveTab] =
    useState("catalog");

  const [gatewayLoading, setGatewayLoading] =
    useState(false);

  const [selectedWebinar, setSelectedWebinar] =
    useState(null);

  // =========================================
  // SAFE FETCH
  // =========================================

  const apiFetch = async (
    url,
    options = {}
  ) => {
    try {
      const response = await fetch(url, {
        ...options,

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${TOKEN}`,

          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        throw new Error(
          `API Error ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(error);

      return [];
    }
  };

  // =========================================
  // LOAD DATA
  // =========================================

  useEffect(() => {
    loadCourses();
    loadEnrollments();
    loadWebinars();
    loadMyWebinars();
  }, []);

  // =========================================
  // COURSES
  // =========================================

  const loadCourses = async () => {
    setLoadingCourses(true);

    const data = await apiFetch(
      "https://server.manchly.com/courses"
    );

    if (Array.isArray(data)) {
      setCourses(data);
    } else if (
      Array.isArray(data.courses)
    ) {
      setCourses(data.courses);
    } else {
      setCourses([]);
    }

    setLoadingCourses(false);
  };

  const loadEnrollments = async () => {
    const data = await apiFetch(
      "https://server.manchly.com/courses/enrolled/me"
    );

    if (Array.isArray(data)) {
      setEnrolledCourses(data);
    } else if (
      Array.isArray(data.enrollments)
    ) {
      setEnrolledCourses(data.enrollments);
    } else {
      setEnrolledCourses([]);
    }
  };

  // =========================================
  // WEBINARS
  // =========================================

  const loadWebinars = async () => {
    setLoadingWebinars(true);

    const data = await apiFetch(
      "https://server.manchly.com/webinars"
    );

    if (Array.isArray(data)) {
      setWebinars(data);
    } else if (
      Array.isArray(data.webinars)
    ) {
      setWebinars(data.webinars);
    } else {
      setWebinars([]);
    }

    setLoadingWebinars(false);
  };

  const loadMyWebinars = async () => {
    const data = await apiFetch(
      "https://server.manchly.com/webinars/enrolled/me"
    );

    if (Array.isArray(data)) {
      setMyWebinars(data);
    } else if (
      Array.isArray(data.webinars)
    ) {
      setMyWebinars(data.webinars);
    } else {
      setMyWebinars([]);
    }
  };

  // =========================================
  // ENROLL COURSE
  // =========================================

  const enrollCourse = async (courseId) => {
    try {
      await apiFetch(
        `https://server.manchly.com/courses/${courseId}/enroll`,
        {
          method: "POST",
        }
      );

      loadEnrollments();
    } catch (err) {
      console.log(err);
    }
  };

  // =========================================
  // UPDATE PROGRESS
  // =========================================

  const updateProgress = async (
    courseId,
    progress
  ) => {
    try {
      await apiFetch(
        `https://server.manchly.com/courses/${courseId}/progress`,
        {
          method: "PUT",

          body: JSON.stringify({
            progress,
            last_video_id: "video_001",
          }),
        }
      );

      setEnrolledCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                progress,
              }
            : course
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  // =========================================
  // UNENROLL
  // =========================================

  const unenrollCourse = async (
    courseId
  ) => {
    try {
      await apiFetch(
        `https://server.manchly.com/courses/${courseId}/enroll`,
        {
          method: "DELETE",
        }
      );

      setEnrolledCourses((prev) =>
        prev.filter(
          (course) => course.id !== courseId
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  // =========================================
  // WEBINAR ENROLL
  // =========================================

  const enrollWebinar = async (
    webinarId
  ) => {
    setGatewayLoading(true);

    try {
      await apiFetch(
        `https://server.manchly.com/webinars/${webinarId}/enroll`,
        {
          method: "POST",
        }
      );

      setTimeout(() => {
        setGatewayLoading(false);

        setSelectedWebinar(webinarId);

        loadMyWebinars();
      }, 2000);
    } catch (err) {
      console.log(err);

      setGatewayLoading(false);
    }
  };

  // =========================================
  // STATS
  // =========================================

  const avgProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce(
            (acc, c) =>
              acc + (c.progress || 0),
            0
          ) / enrolledCourses.length
        )
      : 0;

  // =========================================
  // UI
  // =========================================

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.text,
        padding: 30,
        fontFamily:
          "system-ui, sans-serif",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            marginBottom: 10,
          }}
        >
          Student Learning Hub
        </h1>

        <p
          style={{
            color: T.textSec,
          }}
        >
          Courses, progress tracking &
          webinar enrollments
        </p>
      </div>

      {/* STATS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
          marginBottom: 28,
        }}
      >
        <StatCard
          title="Courses Enrolled"
          value={enrolledCourses.length}
          icon={<BookOpen />}
          T={T}
        />

        <StatCard
          title="Average Progress"
          value={`${avgProgress}%`}
          icon={<BarChart3 />}
          T={T}
        />

        <StatCard
          title="My Webinars"
          value={myWebinars.length}
          icon={<CalendarDays />}
          T={T}
        />
      </div>

      {/* TABS */}

      <div
        style={{
          display: "flex",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <TabButton
          active={activeTab === "catalog"}
          onClick={() =>
            setActiveTab("catalog")
          }
          label="Browse Courses"
          T={T}
        />

        <TabButton
          active={activeTab === "learning"}
          onClick={() =>
            setActiveTab("learning")
          }
          label="My Learning Shelf"
          T={T}
        />
      </div>

      {/* COURSE CONTENT */}

      {activeTab === "catalog" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(300px,1fr))",
            gap: 22,
          }}
        >
          {loadingCourses ? (
            <Loader />
          ) : (
            Array.isArray(courses) &&
            courses.map((course) => (
              <div
                key={course.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 22,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: 14,
                  }}
                >
                  <BookOpen
                    color={T.orange}
                  />

                  <div
                    style={{
                      color: T.orange,
                      fontWeight: 800,
                    }}
                  >
                    FREE
                  </div>
                </div>

                <h3>{course.title}</h3>

                <p
                  style={{
                    color: T.textSec,
                    marginTop: 10,
                  }}
                >
                  {course.description ||
                    "Premium learning experience"}
                </p>

                <button
                  onClick={() =>
                    enrollCourse(course.id)
                  }
                  style={{
                    width: "100%",
                    marginTop: 18,
                    background: T.orange,
                    color: "#000",
                    border: "none",
                    padding: "14px",
                    borderRadius: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Enroll Free Now
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 20,
          }}
        >
          {Array.isArray(enrolledCourses) &&
          enrolledCourses.length > 0 ? (
            enrolledCourses.map((course) => (
              <div
                key={course.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 24,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h2>{course.title}</h2>

                    <p
                      style={{
                        color: T.textSec,
                      }}
                    >
                      Last Video:
                      {" "}
                      {course.last_video_id ||
                        "video_001"}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      unenrollCourse(
                        course.id
                      )
                    }
                    style={{
                      background:
                        "rgba(239,68,68,0.1)",
                      border: "none",
                      color: T.red,
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* PROGRESS */}

                <div
                  style={{
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span>
                      Course Progress
                    </span>

                    <span
                      style={{
                        color: T.orange,
                        fontWeight: 800,
                      }}
                    >
                      {course.progress || 0}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: 10,
                      background: "#222",
                      borderRadius: 20,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${
                          course.progress || 0
                        }%`,
                        height: "100%",
                        background:
                          T.orange,
                      }}
                    />
                  </div>
                </div>

                {/* SLIDER */}

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={
                    course.progress || 0
                  }
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
                  }}
                />
              </div>
            ))
          ) : (
            <EmptyState
              text="No enrollments yet"
              T={T}
            />
          )}
        </div>
      )}

      {/* WEBINARS */}

      <div
        style={{
          marginTop: 50,
        }}
      >
        <h2
          style={{
            marginBottom: 22,
            fontSize: 30,
          }}
        >
          Premium Webinars
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(300px,1fr))",
            gap: 22,
          }}
        >
          {loadingWebinars ? (
            <Loader />
          ) : (
            Array.isArray(webinars) &&
            webinars.map((webinar) => (
              <div
                key={webinar.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 24,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: 16,
                  }}
                >
                  <Zap color={T.orange} />

                  <BadgeCheck
                    color={T.green}
                  />
                </div>

                <h3>{webinar.title}</h3>

                <p
                  style={{
                    color: T.textSec,
                    marginTop: 10,
                  }}
                >
                  {webinar.description ||
                    "Live premium masterclass"}
                </p>

                <button
                  onClick={() =>
                    enrollWebinar(
                      webinar.id
                    )
                  }
                  style={{
                    width: "100%",
                    marginTop: 18,
                    background: T.orange,
                    color: "#000",
                    border: "none",
                    padding: "14px",
                    borderRadius: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Join Masterclass
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* GATEWAY */}

      {gatewayLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: T.card,
              padding: 40,
              borderRadius: 24,
              textAlign: "center",
              border: `1px solid ${T.border}`,
            }}
          >
            <Loader2
              size={48}
              color={T.orange}
              className="spin"
            />

            <h2
              style={{
                marginTop: 20,
              }}
            >
              Redirecting to Payment Gateway
            </h2>

            <p
              style={{
                color: T.textSec,
                marginTop: 10,
              }}
            >
              Processing secure Cashfree
              payment...
            </p>
          </div>
        </div>
      )}

      {/* VERIFIED */}

      {selectedWebinar && (
        <div
          style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            background: T.card,
            border: `1px solid ${T.green}`,
            borderRadius: 20,
            padding: 22,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <CheckCircle2
            color={T.green}
          />

          <div>
            <div
              style={{
                fontWeight: 800,
              }}
            >
              Webinar Enrollment Successful
            </div>

            <div
              style={{
                color: T.textSec,
                fontSize: 14,
              }}
            >
              Webinar ID:
              {" "}
              {selectedWebinar}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================
// COMPONENTS
// =========================================

function StatCard({
  title,
  value,
  icon,
  T,
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 22,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        {icon}

        <div
          style={{
            width: 42,
            height: 42,
            background: T.orangeLight,
            borderRadius: 12,
          }}
        />
      </div>

      <h2
        style={{
          marginTop: 18,
          fontSize: 34,
        }}
      >
        {value}
      </h2>

      <p
        style={{
          color: T.textSec,
          marginTop: 6,
        }}
      >
        {title}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  T,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active
          ? T.orange
          : T.card,

        color: active ? "#000" : "#fff",

        border: `1px solid ${T.border}`,

        padding: "14px 22px",

        borderRadius: 14,

        fontWeight: 800,

        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function Loader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <Loader2
        size={38}
        className="spin"
      />
    </div>
  );
}

function EmptyState({ text, T }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: 40,
        textAlign: "center",
        color: T.textSec,
      }}
    >
      {text}
    </div>
  );
}