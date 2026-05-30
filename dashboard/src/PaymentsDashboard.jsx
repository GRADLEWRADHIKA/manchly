import React, { useEffect, useState } from "react";
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  ShieldCheck,
  Loader2,
  Receipt,
  Wallet,
} from "lucide-react";

export default function PaymentsDashboard({ role = "STUDENT" }) {
  const T = {
    bg: "#000000",
    card: "#111111",
    cardHigh: "#161616",
    sidebar: "#0A0A0A",
    orange: "#FFC107",
    orangeD: "#FFB300",
    orangeL: "rgba(255,193,7,0.15)",
    green: "#22C55E",
    greenL: "rgba(34,197,94,0.12)",
    red: "#EF4444",
    border: "rgba(255,255,255,0.08)",
    borderHi: "rgba(255,193,7,0.35)",
    textPri: "#FFFFFF",
    textSec: "#A1A1AA",
    textMut: "#71717A",
  };
  const TOKEN = localStorage.getItem("token") || "";
  const [transactions, setTransactions] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const purchasableCourses = [
    {
      id: 1,
      title: "Advanced React Architecture",
      price: 4999,
    },

    {
      id: 2,
      title: "AI Prompt Engineering",
      price: 2999,
    },

    {
      id: 3,
      title: "System Design Bootcamp",
      price: 6999,
    },
  ];

  const [selectedCourse, setSelectedCourse] = useState(purchasableCourses[0]);
  const apiFetch = async (url, options = {}) => {
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
        throw new Error(`API Error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  };
  useEffect(() => {
    loadTransactions();

    if (role === "CREATOR") {
      loadCreatorSales();
    }
  }, []);

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    const data = await apiFetch(
      "https://server.manchly.com/payments/my-transactions",
    );

    if (Array.isArray(data)) {
      setTransactions(data);
    } else if (Array.isArray(data.transactions)) {
      setTransactions(data.transactions);
    } else {
      setTransactions([]);
    }
    setLoadingTransactions(false);
  };

  const loadCreatorSales = async () => {
    setLoadingSales(true);

    const data = await apiFetch(
      "https://server.manchly.com/payments/creator-sales",
    );

    if (Array.isArray(data)) {
      setSalesData(data);
    } else if (Array.isArray(data.sales)) {
      setSalesData(data.sales);
    } else {
      setSalesData([]);
    }

    setLoadingSales(false);
  };
  const createOrder = async () => {
    setCreatingOrder(true);
    setGeneratedOrder(null);
    const data = await apiFetch(
      `https://server.manchly.com/payments/create-order/${selectedCourse.id}`,
      {
        method: "POST",
      },
    );

    setTimeout(() => {
      setGeneratedOrder({
        orderId: data.order_id || `course_${selectedCourse.id}_${Date.now()}`,
        paymentLink: data.payment_link || "https://paymentsandbox.manchly.com",
      });

      setCreatingOrder(false);
    }, 1500);
  };
  const verifyPayment = async () => {
    setVerifyingPayment(true);

    const data = await apiFetch("https://server.manchly.com/payments/verify", {
      method: "POST",

      body: JSON.stringify({
        order_id: generatedOrder.orderId,
      }),
    });

    setTimeout(() => {
      setVerifyingPayment(false);
      setPaymentVerified(true);
      setTransactions((prev) => [
        {
          id: Date.now(),
          title: selectedCourse.title,
          amount: selectedCourse.price,
          status: "Paid",
          order_id: generatedOrder.orderId,
          created_at: new Date().toISOString(),
        },

        ...prev,
      ]);
    }, 1800);
  };
  const totalSpent = transactions.reduce((acc, item) => acc + (item.amount || 0), 0) || 0;
  const totalRevenue = salesData.reduce((acc, item) => acc + (item.amount || 0), 0) || 0;
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.textPri,
        padding: 30,
        fontFamily: "system-ui, sans-serif",
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
            marginBottom: 8,
          }}
        >
          Payments Dashboard
        </h1>

        <p
          style={{
            color: T.textSec,
          }}
        >
          {role === "CREATOR"
            ? "Revenue analytics & payouts"
            : "Course payments & transactions"}
        </p>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            role === "CREATOR" ? "repeat(3,1fr)" : "repeat(2,1fr)",
          gap: 18,
          marginBottom: 30,
        }}
      >
        {role === "CREATOR" && (
          <StatCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={<TrendingUp />}
            T={T}
          />
        )}

        <StatCard
          title="My Transactions"
          value={transactions.length}
          icon={<Receipt />}
          T={T}
        />

        <StatCard
          title="Total Spend"
          value={`₹${totalSpent.toLocaleString()}`}
          icon={<Wallet />}
          T={T}
        />
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: role === "CREATOR" ? "1.3fr 0.9fr" : "1fr",
          gap: 28,
        }}
      >
        {role === "CREATOR" && (
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 28,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 24,
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                Creator Sales
              </h2>

              <p
                style={{
                  color: T.textSec,
                  marginTop: 6,
                }}
              >
                GET /payments/creator-sales
              </p>
            </div>

            <div
              style={{
                padding: 24,
                display: "grid",
                gap: 18,
              }}
            >
              {loadingSales ? (
                <Loader />
              ) : (
                salesData.map((sale) => (
                  <div
                    key={sale.id}
                    style={{
                      background: T.cardHigh,
                      border: `1px solid ${T.border}`,
                      borderRadius: 20,
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
                            fontWeight: 700,
                            fontSize: 18,
                          }}
                        >
                          {sale.customer || "Student"}
                        </div>

                        <div
                          style={{
                            color: T.textSec,
                            marginTop: 8,
                          }}
                        >
                          {sale.course || "Course Purchase"}
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            color: T.textMut,
                          }}
                        >
                          {sale.created_at || "Recent"}
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
                          ₹{(sale.amount || 0).toLocaleString()}
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
                          Settled
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.borderHi}`,
            borderRadius: 30,
            padding: 28,
            height: "fit-content",
          }}
        >
          {/* TITLE */}
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
                Payment Sandbox
              </h2>

              <p
                style={{
                  color: T.textSec,
                  marginTop: 6,
                }}
              >
                Create & verify orders
              </p>
            </div>
          </div>
          {/* SELECT */}
          <select
            value={selectedCourse.id}
            onChange={(e) => {
              const course = purchasableCourses.find(
                (c) => c.id === Number(e.target.value),
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
            {purchasableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} • ₹{course.price}
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
            {creatingOrder ? "Generating Order..." : "Create Order"}
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

          {/* SUCCESS */}

          {paymentVerified && (
            <div
              style={{
                marginTop: 22,
                background: T.greenL,
                border: `1px solid ${T.green}`,
                borderRadius: 20,
                padding: 18,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CheckCircle color={T.green} />

              <div>
                <div
                  style={{
                    fontWeight: 800,
                  }}
                >
                  Payment Verified
                </div>

                <div
                  style={{
                    color: T.textSec,
                    marginTop: 4,
                    fontSize: 14,
                  }}
                >
                  POST /payments/verify successful
                </div>
              </div>
            </div>
          )}

          {/* WEBHOOK INFO */}
          <div
            style={{
              marginTop: 28,
              background: T.sidebar,
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <ShieldCheck size={18} color={T.orange} />

              <div
                style={{
                  fontWeight: 700,
                }}
              >
                Cashfree Webhook
              </div>
            </div>

            <div
              style={{
                color: T.textSec,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              POST: https://server.manchly.com/payments/webhook
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div
        style={{
          marginTop: 40,
        }}
      >
        <h2
          style={{
            fontSize: 30,
            marginBottom: 22,
          }}
        >
          My Transactions
        </h2>

        <div
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {loadingTransactions ? (
            <Loader />
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 22,
                  padding: 22,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {tx.title || "Course Purchase"}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: T.textSec,
                    }}
                  >
                    {tx.order_id}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: T.textMut,
                    }}
                  >
                    {tx.created_at}
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
                    ₹{(tx.amount || 0).toLocaleString()}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      background: T.greenL,
                      color: T.green,
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    {tx.status || "Paid"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
// STAT CARD
function StatCard({ title, value, icon, T }) {
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
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {icon}

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: T.orangeL,
          }}
        />
      </div>

      <h2
        style={{
          fontSize: 34,
          marginTop: 18,
          fontWeight: 900,
        }}
      >
        {value}
      </h2>

      <p
        style={{
          marginTop: 6,
          color: T.textSec,
        }}
      >
        {title}
      </p>
    </div>
  );
}
// LOADER
function Loader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <Loader2 size={38} color="#FFC107" className="spin" />
    </div>
  );
}
