import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
/* ─────────────────────────────────────────────
   MANCHLY ULTRA DARK DESIGN TOKENS
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
/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const creatorSalesSeed = [
  {
    id: 1,
    customer: "Aarav Sharma",
    course: "Advanced React Architecture",
    amount: 4999,
    status: "Settled",
    time: "2026-05-21 7:45 PM",
  },
  {
    id: 2,
    customer: "Priya Nair",
    course: "AI Prompt Engineering",
    amount: 2999,
    status: "Processing",
    time: "2026-05-22 2:15 PM",
  },
  {
    id: 3,
    customer: "Rohan Gupta",
    course: "Full Stack Mastery",
    amount: 7999,
    status: "Settled",
    time: "2026-05-24 10:30 AM",
  },
];
const transactionSeed = [
  {
    id: 1,
    title: "AI Product Building Bootcamp",
    orderId: "course_843_1748091",
    date: "2026-05-19",
    amount: 2499,
    method: "UPI",
    status: "Paid",
  },
  {
    id: 2,
    title: "Frontend Performance Engineering",
    orderId: "course_992_1748011",
    date: "2026-05-21",
    amount: 3499,
    method: "Credit Card",
    status: "Paid",
  },
];

const availableCourses = [
  {
    id: "react-advanced",
    title: "Advanced React Architecture",
    price: 4999,
  },
  {
    id: "ai-prompt-engineering",
    title: "AI Prompt Engineering",
    price: 2999,
  },
  {
    id: "fullstack-mastery",
    title: "Full Stack Mastery",
    price: 7999,
  },
];
/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function PaymentsDashboard() {
  const [activeTab, setActiveTab] = useState("sales");
  const [salesData, setSalesData] = useState(creatorSalesSeed);
  const [transactions, setTransactions] = useState(transactionSeed);
  const [selectedCourse, setSelectedCourse] = useState(availableCourses[0]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState(null);
  const totalRevenue = useMemo(() => {
    return salesData.reduce((acc, item) => acc + item.amount, 0);
  }, [salesData]);
  const totalSpendings = useMemo(() => {
    return transactions.reduce((acc, item) => acc + item.amount, 0);
  }, [transactions]);
  const pendingSettlements = useMemo(() => {
    return salesData
      .filter((sale) => sale.status === "Processing")
      .reduce((acc, item) => acc + item.amount, 0);
  }, [salesData]);
  /* ───────────────────────────────────────── */
  const createOrder = () => {
    setCreatingOrder(true);
    setGeneratedOrder(null);
    setTimeout(() => {
      setGeneratedOrder({
        orderId: `course_${selectedCourse.id}_${Date.now()}`,
        checkout: "https://sandbox.manchly-payments.io",
      });
      setCreatingOrder(false);
    }, 1800);
  };
  const verifyPayment = () => {
    setVerifyingPayment(true);
    setTimeout(() => {
      setPaymentVerified(true);
      setVerifyingPayment(false);
      setTransactions((prev) => [
        {
          id: Date.now(),
          title: selectedCourse.title,
          orderId: generatedOrder.orderId,
          date: new Date().toISOString().split("T")[0],
          amount: selectedCourse.price,
          method: "Sandbox Wallet",
          status: "Paid",
        },
        ...prev,
      ]);
    }, 2000);
  };

  /* ───────────────────────────────────────── */
  useEffect(() => {
    if (!paymentVerified) return;
    const timeout = setTimeout(() => {
      setPaymentVerified(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [paymentVerified]);
  /* ───────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.textPri,
        padding: 24,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 900,
                margin: 0,
                color: T.orange,
              }}
            >
              Payments Dashboard
            </h1>

            <p
              style={{
                color: T.textSec,
                marginTop: 10,
              }}
            >
              Revenue analytics & sandbox transactions.
            </p>
          </div>

          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ShieldCheck color={T.orange} />

            <div>
              <div
                style={{
                  fontSize: 13,
                  color: T.textMut,
                }}
              >
                Payment Security
              </div>
              <div
                style={{
                  fontWeight: 700,
                }}
              >
                Sandbox Protected
              </div>
            </div>
          </div>
        </div>
        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 24,
            marginBottom: 40,
          }}
        >
          <StatsCard
            title="Total Creator Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            subtitle="Monthly creator sales"
            icon={<TrendingUp />}
            trend="+18.4%"
          />
          <StatsCard
            title="My Spendings"
            value={`₹${totalSpendings.toLocaleString()}`}
            subtitle="Course investments"
            icon={<Wallet />}
            trend="+7.2%"
          />
          <StatsCard
            title="Pending Settlements"
            value={`₹${pendingSettlements.toLocaleString()}`}
            subtitle="Awaiting payouts"
            icon={<Clock3 />}
            trend="+2.1%"
          />
        </div>
        {/* MAIN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 0.9fr",
            gap: 28,
          }}
        >
          {/* LEFT PANEL */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 30,
              overflow: "hidden",
            }}
          >
            {/* TOP BAR */}
            <div
              style={{
                padding: 26,
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  Financial Data
                </h2>
                <p
                  style={{
                    color: T.textSec,
                    marginTop: 6,
                  }}
                >
                  Incoming & outgoing payment flows
                </p>
              </div>
              {/* TABS */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  background: T.sidebar,
                  padding: 6,
                  borderRadius: 18,
                }}
              >
                <button
                  onClick={() => setActiveTab("sales")}
                  style={{
                    padding: "12px 22px",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 800,
                    background: activeTab === "sales" ? T.orange : T.sidebar,
                    color: activeTab === "sales" ? "#000" : T.textSec,
                  }}
                >
                  Creator Sales
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  style={{
                    padding: "12px 22px",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 800,
                    background:
                      activeTab === "transactions" ? T.orange : T.sidebar,
                    color: activeTab === "transactions" ? "#000" : T.textSec,
                  }}
                >
                  Transactions
                </button>
              </div>
            </div>
            {/* CONTENT */}
            <div
              style={{
                padding: 26,
                display: "grid",
                gap: 18,
              }}
            >
              {activeTab === "sales"
                ? salesData.map((sale) => (
                    <div
                      key={sale.id}
                      style={{
                        background: T.cardHigh,
                        border: `1px solid ${T.border}`,
                        borderRadius: 22,
                        padding: 22,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
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
                                width: 50,
                                height: 50,
                                borderRadius: 16,
                                background: T.greenL,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ArrowUpRight color={T.green} />
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 18,
                                }}
                              >
                                {sale.customer}
                              </div>
                              <div
                                style={{
                                  color: T.textSec,
                                  marginTop: 4,
                                }}
                              >
                                {sale.course}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 16,
                              color: T.textMut,
                              fontSize: 14,
                            }}
                          >
                            <Calendar size={15} />
                            {sale.time}
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 30,
                              fontWeight: 900,
                              color: T.orange,
                            }}
                          >
                            ₹{sale.amount.toLocaleString()}
                          </div>

                          <div
                            style={{
                              marginTop: 12,
                              padding:
                                sale.status === "Settled"
                                  ? "8px 14px"
                                  : "8px 14px",
                              borderRadius: 999,
                              background:
                                sale.status === "Settled"
                                  ? T.greenL
                                  : T.orangeL,
                              color:
                                sale.status === "Settled" ? T.green : T.orange,
                              fontWeight: 700,
                              display: "inline-block",
                            }}
                          >
                            {sale.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                : transactions.map((txn) => (
                    <div
                      key={txn.id}
                      style={{
                        background: T.cardHigh,
                        border: `1px solid ${T.border}`,
                        borderRadius: 22,
                        padding: 22,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
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
                                width: 50,
                                height: 50,
                                borderRadius: 16,
                                background: T.redL,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ArrowDownLeft color={T.red} />
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 18,
                                }}
                              >
                                {txn.title}
                              </div>

                              <div
                                style={{
                                  color: T.textSec,
                                  marginTop: 4,
                                }}
                              >
                                {txn.orderId}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: 16,
                              color: T.textMut,
                              fontSize: 14,
                            }}
                          >
                            {txn.date} • {txn.method}
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 30,
                              fontWeight: 900,
                              color: T.orange,
                            }}
                          >
                            ₹{txn.amount.toLocaleString()}
                          </div>

                          <div
                            style={{
                              marginTop: 12,
                              padding: "8px 14px",
                              borderRadius: 999,
                              background: T.greenL,
                              color: T.green,
                              fontWeight: 700,
                              display: "inline-block",
                            }}
                          >
                            {txn.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
          {/* SANDBOX */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.borderHi}`,
              borderRadius: 30,
              padding: 28,
              position: "sticky",
              top: 20,
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
                  background: T.orangeL,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard color={T.orange} />
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                  }}
                >
                  Sandbox Emulator
                </h2>

                <p
                  style={{
                    color: T.textSec,
                    marginTop: 6,
                  }}
                >
                  Simulate API payment flows
                </p>
              </div>
            </div>

            {/* SELECT */}

            <select
              value={selectedCourse.id}
              onChange={(e) => {
                const course = availableCourses.find(
                  (c) => c.id === e.target.value,
                );

                setSelectedCourse(course);
              }}
              style={{
                width: "100%",
                background: T.sidebar,
                border: `1px solid ${T.border}`,
                padding: 18,
                borderRadius: 18,
                color: "#fff",
                marginBottom: 20,
                outline: "none",
              }}
            >
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} — ₹{course.price}
                </option>
              ))}
            </select>

            {/* CREATE */}

            <button
              onClick={createOrder}
              style={{
                width: "100%",
                background: T.orange,
                color: "#000",
                border: "none",
                padding: "16px",
                borderRadius: 18,
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              {creatingOrder ? "Generating..." : "Generate Checkout Order"}
            </button>

            {/* ORDER */}

            {generatedOrder && (
              <div
                style={{
                  marginTop: 24,
                  background: T.cardHigh,
                  border: `1px solid ${T.border}`,
                  borderRadius: 22,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    color: T.textSec,
                    fontSize: 14,
                  }}
                >
                  Generated Order ID
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontWeight: 700,
                    wordBreak: "break-all",
                  }}
                >
                  {generatedOrder.orderId}
                </div>

                <button
                  onClick={verifyPayment}
                  style={{
                    width: "100%",
                    marginTop: 20,
                    background: T.green,
                    color: "#000",
                    border: "none",
                    padding: "16px",
                    borderRadius: 18,
                    fontWeight: 900,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  {verifyingPayment ? "Verifying..." : "Verify Payment"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}

      {paymentVerified && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.borderHi}`,
              borderRadius: 32,
              padding: 40,
              width: 420,
              textAlign: "center",
              boxShadow: "0 0 60px rgba(255,193,7,0.15)",
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
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <CheckCircle2 size={48} color={T.green} />
            </div>

            <h2
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: T.orange,
                marginBottom: 14,
              }}
            >
              Payment Verified
            </h2>

            <p
              style={{
                color: T.textSec,
                lineHeight: 1.7,
              }}
            >
              Transaction completed successfully. Course enrollment has been
              activated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATS CARD
───────────────────────────────────────────── */

function StatsCard({ title, value, subtitle, icon, trend = "+12.5%" }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 28,
        padding: 26,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* GLOW */}

      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: T.orangeL,
          top: -90,
          right: -90,
          filter: "blur(50px)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
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
            }}
          >
            {icon}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: T.greenL,
              color: T.green,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {trend}
          </div>
        </div>

        <div
          style={{
            color: T.textSec,
            fontSize: 14,
            marginBottom: 10,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: -1,
            marginBottom: 10,
          }}
        >
          {value}
        </div>

        <div
          style={{
            color: T.textMut,
            fontSize: 14,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
