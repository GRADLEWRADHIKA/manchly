import { useState } from "react";

import {
  Play,
  Plus,
  CheckCircle,
  Upload,
  Eye,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Users,
  Star,
  DollarSign,
  BarChart2,
  X,
} from "lucide-react";

/* ───────────────────────────────────────── */
/* DESIGN TOKENS */
/* ───────────────────────────────────────── */

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
  purple: "#A855F7",
  purpleL: "rgba(168,85,247,0.12)",
  blue: "#3B82F6",
  blueL: "rgba(59,130,246,0.12)",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,193,7,0.35)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
  textMut: "#71717A",
};

/* ───────────────────────────────────────── */
/* MOCK DATA */
/* ───────────────────────────────────────── */

const CREATOR_COURSES = [
  {
    id: "c1",
    title: "Advanced Options Trading",
    category: "Trading",
    price: 999,
    level: "Advanced",
    language: "English",
    status: "PUBLISHED",
    students: 234,
    rating: 4.8,
    revenue: 233766,
    tags: ["options", "derivatives"],
    curriculum: [
      {
        id: "v1",
        title: "Introduction to Options",
        order: 1,
        duration: "18:22",
        status: "READY",
        is_free: true,
      },

      {
        id: "v2",
        title: "Call & Put Strategies",
        order: 2,
        duration: "31:10",
        status: "READY",
        is_free: false,
      },

      {
        id: "v3",
        title: "Greeks Explained",
        order: 3,
        duration: "24:45",
        status: "READY",
        is_free: false,
      },

      {
        id: "v4",
        title: "Iron Condor Mastery",
        order: 4,
        duration: "29:08",
        status: "PROCESSING",
        is_free: false,
      },

      {
        id: "v5",
        title: "Live Trade Walkthrough",
        order: 5,
        duration: "—",
        status: "UPLOADING",
        uploadPct: 67,
        is_free: false,
      },
    ],
  },

  {
    id: "c2",
    title: "Startup Growth Masterclass",
    category: "Business",
    price: 699,
    level: "Intermediate",
    language: "English",
    status: "DRAFT",
    students: 0,
    rating: 0,
    revenue: 0,

    tags: ["startup", "growth"],

    curriculum: [
      {
        id: "v6",
        title: "Product-Market Fit",
        order: 1,
        duration: "22:00",
        status: "READY",
        is_free: true,
      },

      {
        id: "v7",
        title: "Growth Hacking Tactics",
        order: 2,
        duration: "—",
        status: "UPLOADING",
        uploadPct: 32,
        is_free: false,
      },
    ],
  },
];

const CATEGORIES = [
  "Trading",
  "Business",
  "Marketing",
  "Finance",
  "Design",
  "Tech",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LANGUAGES = ["English", "Hindi", "Hinglish"];
const VIDEO_STATUS = {
  READY: {
    label: "READY",
    color: T.green,
    bg: T.greenL,
  },
  PROCESSING: {
    label: "PROCESSING",
    color: T.blue,
    bg: T.blueL,
  },
  UPLOADING: {
    label: "UPLOADING",
    color: T.orange,
    bg: T.orangeL,
  },
  ERROR: {
    label: "ERROR",
    color: T.red,
    bg: T.redL,
  },
};
/* ───────────────────────────────────────── */
/* GOLD BUTTON */
/* ───────────────────────────────────────── */
function GoldBtn({ children, onClick, outline = false, small = false }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: outline ? "transparent" : hover ? T.orangeD : T.orange,
        border: `1.5px solid ${T.orange}`,
        color: outline ? (hover ? T.orange : T.textSec) : "#000",
        padding: small ? "5px 12px" : "8px 18px",
        borderRadius: 9,
        fontSize: small ? 11.5 : 13,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "0.2s ease",
      }}
    >
      {children}
    </button>
  );
}

/* INPUT */
function Input({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <label
        style={{
          fontSize: 11.5,
          color: T.textSec,
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <input
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        style={{
          background: "#0D0D0D",
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: "10px 12px",
          color: "#fff",
          outline: "none",
          fontSize: 13,
        }}
      />
    </div>
  );
}
/* SELECT */
function Select({ label, value, onChange, options }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <label
        style={{
          fontSize: 11.5,
          color: T.textSec,
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        style={{
          background: "#0D0D0D",
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: "10px 12px",
          color: "#fff",
          outline: "none",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
/* STATUS PILL */
function StatusPill({ status }) {
  const s = VIDEO_STATUS[status] || VIDEO_STATUS.PROCESSING;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 20,
        padding: "2px 8px",
        fontSize: 9.5,
        fontWeight: 700,
      }}
    >
      {s.label}
    </span>
  );
}
/* CREATOR COURSE CARD */
function CreatorCourseCard({ course, selected, onSelect }) {
  const active = selected?.id === course.id;

  return (
    <div
      onClick={() => onSelect(course)}
      style={{
        background: active ? T.cardHigh : T.card,
        border: `1.5px solid ${active ? T.borderHi : T.border}`,
        borderRadius: 14,
        padding: "16px",
        marginBottom: 10,
        cursor: "pointer",
        transition: "0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                background: T.purpleL,
                color: T.purple,
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 20,
                fontWeight: 700,
              }}
            >
              {course.category}
            </span>
            <span
              style={{
                background:
                  course.status === "PUBLISHED" ? T.greenL : T.orangeL,
                color: course.status === "PUBLISHED" ? T.green : T.orange,
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 20,
                fontWeight: 700,
              }}
            >
              {course.status}
            </span>
          </div>
          <h3
            style={{
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            {course.title}
          </h3>
          <p
            style={{
              color: T.textMut,
              fontSize: 11,
            }}
          >
            {course.curriculum.length} lessons • {course.students} students
          </p>
        </div>
        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: T.orange,
            }}
          >
            ₹{course.price}
          </div>
          {course.rating > 0 && (
            <div
              style={{
                color: T.orange,
                fontSize: 11,
                marginTop: 4,
              }}
            >
              ★ {course.rating}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* VIDEO ROW */
function VideoRow({ video, index }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          background: T.orangeL,
          color: T.orange,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {index + 1}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {video.title}
          </p>

          <StatusPill status={video.status} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 5,
          }}
        >
          <span
            style={{
              color: T.textMut,
              fontSize: 11,
            }}
          >
            {video.duration}
          </span>

          {video.is_free && (
            <span
              style={{
                background: T.greenL,
                color: T.green,
                borderRadius: 20,
                padding: "1px 6px",
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              FREE
            </span>
          )}
        </div>

        {video.status === "UPLOADING" && (
          <div
            style={{
              marginTop: 8,
            }}
          >
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${video.uploadPct}%`,
                  height: "100%",
                  background: T.orange,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
        }}
      >
        <button style={iconBtn(T.orangeL, T.orange)}>
          <Edit3 size={12} />
        </button>

        <button style={iconBtn(T.redL, T.red)}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
/* CURRICULUM MANAGER */
function CurriculumManager({ course }) {
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 14,
        padding: 18,
        border: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            {course.title}
          </h3>

          <p
            style={{
              color: T.textMut,
              fontSize: 11,
            }}
          >
            {course.curriculum.length} lessons
          </p>
        </div>

        <GoldBtn small>
          <Plus size={13} />
          Add Lesson
        </GoldBtn>
      </div>

      {course.curriculum.map((video, index) => (
        <VideoRow key={video.id} video={video} index={index} />
      ))}

      <div
        style={{
          marginTop: 10,
          border: `2px dashed ${T.borderHi}`,
          borderRadius: 12,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <Upload
          size={18}
          style={{
            color: T.orange,
            marginBottom: 8,
          }}
        />

        <p
          style={{
            color: T.textMut,
            fontSize: 12,
          }}
        >
          Drop videos here or click to upload
        </p>
      </div>
    </div>
  );
}
/* COURSE WIZARD */

function CourseWizard({ onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Trading",
    level: "Beginner",
    language: "English",
  });

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));

  return (
    <div
      style={{
        background: T.card,
        borderRadius: 14,
        padding: 22,
        border: `1px solid ${T.borderHi}`,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Course Blueprint Wizard
        </h3>

        <button
          onClick={onCancel}
          style={{
            background: "transparent",
            border: "none",
            color: T.textMut,
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {step === 1 && (
        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          <Input
            label="Course Title"
            value={form.title}
            onChange={set("title")}
          />

          <Input
            label="Description"
            value={form.description}
            onChange={set("description")}
          />
        </div>
      )}

      {step === 2 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <Input label="Price" value={form.price} onChange={set("price")} />

          <Select
            label="Category"
            value={form.category}
            onChange={set("category")}
            options={CATEGORIES}
          />
          <Select
            label="Level"
            value={form.level}
            onChange={set("level")}
            options={LEVELS}
          />
          <Select
            label="Language"
            value={form.language}
            onChange={set("language")}
            options={LANGUAGES}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20,
        }}
      >
        {step > 1 && (
          <GoldBtn outline onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft size={13} />
            Back
          </GoldBtn>
        )}

        {step < 2 ? (
          <GoldBtn onClick={() => setStep((s) => s + 1)}>
            Continue
            <ChevronRight size={13} />
          </GoldBtn>
        ) : (
          <GoldBtn>
            <CheckCircle size={13} />
            Publish
          </GoldBtn>
        )}
      </div>
    </div>
  );
}
/* STATS */
function CreatorStats() {
  const stats = [
    {
      label: "Total Revenue",
      value: "₹2.33L",
      icon: DollarSign,
      color: T.orange,
    },

    {
      label: "Total Students",
      value: "234",
      icon: Users,
      color: T.purple,
    },

    {
      label: "Avg Rating",
      value: "4.8 ★",
      icon: Star,
      color: T.orange,
    },

    {
      label: "Completion Rate",
      value: "68%",
      icon: BarChart2,
      color: T.green,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 12,
        marginBottom: 18,
      }}
    >
      {stats.map((s, i) => {
        const Icon = s.icon;

        return (
          <div
            key={i}
            style={{
              background: T.card,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              padding: "14px",
            }}
          >
            <Icon
              size={16}
              style={{
                color: s.color,
                marginBottom: 8,
              }}
            />

            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: s.color,
              }}
            >
              {s.value}
            </div>

            <div
              style={{
                color: T.textMut,
                fontSize: 11,
                marginTop: 4,
              }}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
/* MAIN COMPONENT */
export default function CourseStudio() {
  const [showWizard, setShowWizard] = useState(false);

  const [selectedCreatorCourse, setSelectedCreatorCourse] = useState(
    CREATOR_COURSES[0],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: "#fff",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: T.sidebar,
          borderBottom: `1px solid ${T.border}`,
          padding: "18px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 4,
              height: 22,
              background: T.orange,
              borderRadius: 4,
            }}
          />
          <h1
            style={{
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            Course Studio
          </h1>
        </div>
        <GoldBtn>
          <Eye size={14} />
          Preview Store
        </GoldBtn>
      </div>
      <div
        style={{
          padding: "22px 26px",
        }}
      >
        <CreatorStats />
        {showWizard && <CourseWizard onCancel={() => setShowWizard(false)} />}
        {!showWizard && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 14,
            }}
          >
            <GoldBtn onClick={() => setShowWizard(true)}>
              <Plus size={14} />
              New Course
            </GoldBtn>
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.12fr 0.88fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.textMut,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              Your Courses
            </p>
            {CREATOR_COURSES.map((course) => (
              <CreatorCourseCard
                key={course.id}
                course={course}
                selected={selectedCreatorCourse}
                onSelect={setSelectedCreatorCourse}
              />
            ))}
          </div>
          {/* RIGHT */}
          <div>
            {selectedCreatorCourse && (
              <CurriculumManager course={selectedCreatorCourse} />
            )}
          </div>
        </div>
      </div>
      <style>{`
        *{
          box-sizing:border-box;
          margin:0;
          padding:0;
        }
        body{
          background:#000;
        }
        ::-webkit-scrollbar{
          width:5px;
          height:5px;
        }
        ::-webkit-scrollbar-track{
          background:#0A0A0A;
        }
        ::-webkit-scrollbar-thumb{
          background:#222;
          border-radius:20px;
        }
        button,
        input,
        textarea,
        select{
          font-family:inherit;
        }
        select option{
          background:#111;
          color:#fff;
        }
      `}</style>
    </div>
  );
}
/* ICON BUTTON */
function iconBtn(bg, color) {
  return {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "none",
    background: bg,
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}
