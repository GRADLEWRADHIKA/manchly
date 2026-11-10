import React, { useEffect, useState } from "react";
import {
  Wallet,
  Building2,
  ArrowDownToLine,
  History,
  PieChart,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Landmark,
  IndianRupee,
  Clock3,
  XCircle,
} from "lucide-react";


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

import { API_BASE as API } from "./api";

export default function CreatorSettlementPortal() {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);

  const [wallet, setWallet] = useState({
    available_balance: 0,
  });

  const [earnings, setEarnings] = useState({
    gross_earnings: 0,
    platform_fee: 0,
    net_earnings: 0,
  });

  const [bank, setBank] = useState(null);

  const [settlements, setSettlements] = useState([]);

  const [showWithdraw, setShowWithdraw] =
    useState(false);

  const [withdrawAmount, setWithdrawAmount] =
    useState("");

  const [bankForm, setBankForm] = useState({
    account_holder: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    beneficiary_name: "",
  });

  const [expandedSettlement, setExpandedSettlement] =
    useState(null);

  /* ═══════════════════════════════════════════════
     API CALL
  ═══════════════════════════════════════════════ */

  const apiCall = async (
    endpoint,
    options = {}
  ) => {
    const response = await fetch(
      `${API}${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "API Error"
      );
    }

    return data;
  };

  /* ═══════════════════════════════════════════════
     FETCH ALL
  ═══════════════════════════════════════════════ */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        walletRes,
        earningsRes,
        bankRes,
        settlementsRes,
      ] = await Promise.allSettled([
      apiCall("/settlements/wallet"),
      apiCall("/settlements/earnings-breakdown"),
      apiCall("/settlements/bank-account"),
      apiCall("/settlements/my-settlements"),
    ]);

      setWallet(
       walletRes.status === "fulfilled"
        ? walletRes.value.data.wallet || { available_balance: 0 }
        : { available_balance: 0 }
      );

      setEarnings(
          earningsRes.status === "fulfilled"
        ? earningsRes.value?.data || {}
        : {}
      );

      setBank(
        bankRes.status === "fulfilled"
    ? bankRes.value.data.bankAccount || null
    : null
      );

      setSettlements(
       settlementsRes.status === "fulfilled"
    ? settlementsRes.value.data.settlements || []
    : []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ═══════════════════════════════════════════════
     ADD BANK
  ═══════════════════════════════════════════════ */

  const addBank = async () => {
    try {
      const res = await apiCall(
        "/settlements/bank-account",
        {
          method: "POST",
          body: JSON.stringify(bankForm),
        }
      );

      setBank(res.data);
      alert("Bank Added Successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  /* ═══════════════════════════════════════════════
     WITHDRAW
  ═══════════════════════════════════════════════ */

  const requestWithdraw = async () => {
    try {
      if (
        Number(withdrawAmount) >
        Number(wallet.available_balance)
      ) {
        return alert(
          "Insufficient wallet balance"
        );
      }

      await apiCall(
        "/settlements/withdraw",
        {
          method: "POST",
          body: JSON.stringify({
            amount: Number(withdrawAmount),
          }),
        }
      );

      setWallet((prev) => ({
        ...prev,
        available_balance:
          prev.available_balance -
          Number(withdrawAmount),
      }));

      setSettlements((prev) => [
        {
          id: Date.now(),
          amount: Number(withdrawAmount),
          status: "PROCESSING",
          created_at: new Date(),
          reference_id:
            "SETTLEMENT_" + Date.now(),
        },
        ...prev,
      ]);

      setWithdrawAmount("");
      setShowWithdraw(false);

      alert("Withdrawal Requested");
    } catch (err) {
      alert(err.message);
    }
  };

  /* ═══════════════════════════════════════════════
     STATUS BADGE
  ═══════════════════════════════════════════════ */

  const statusBadge = (status) => {
    if (status === "SUCCESS") {
      return (
        <div
          className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
          style={{
            background: T.greenL,
            color: T.green,
          }}
        >
          <CheckCircle2 size={14} />
          Success
        </div>
      );
    }

    if (status === "FAILED") {
      return (
        <div
          className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
          style={{
            background: T.redL,
            color: T.red,
          }}
        >
          <XCircle size={14} />
          Failed
        </div>
      );
    }

    return (
      <div
        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
        style={{
          background: T.orangeL,
          color: T.orange,
        }}
      >
        <Clock3 size={14} />
        Processing
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     LOADING
  ═══════════════════════════════════════════════ */

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white"
        style={{ background: T.bg }}
      >
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white p-6"
      style={{ background: T.bg }}
    >
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-4xl font-black"
            style={{ color: T.orange }}
          >
            Creator Settlements
          </h1>

          <p
            className="mt-2"
            style={{ color: T.textSec }}
          >
            Manage payouts, liquidity &
            beneficiary banking
          </p>
        </div>

        <div
          className="px-4 py-2 rounded-xl border flex items-center gap-2"
          style={{
            background: T.card,
            borderColor: T.border,
          }}
        >
          <ShieldCheck
            size={18}
            color={T.orange}
          />
          <span
            className="font-semibold"
            style={{ color: T.orange }}
          >
            Creator Financial Console
          </span>
        </div>
      </div>

      {/* TOP GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* WALLET */}

        <div
          className="rounded-3xl p-6 border"
          style={{
            background: T.card,
            borderColor: T.borderHi,
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div
                className="flex items-center gap-2 mb-3"
                style={{ color: T.textSec }}
              >
                <Wallet size={18} />
                Available Balance
              </div>

              <div
                className="text-5xl font-black"
                style={{ color: T.orange }}
              >
                ₹
                {Number(
                  wallet.available_balance || 0
                ).toLocaleString()}
              </div>

              <div
                className="mt-3 text-sm"
                style={{ color: T.textMut }}
              >
                Withdrawable liquidity
              </div>
            </div>

            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: T.orangeL,
              }}
            >
              <IndianRupee
                size={30}
                color={T.orange}
              />
            </div>
          </div>

          <button
            onClick={() =>
              setShowWithdraw(true)
            }
            className="w-full mt-6 py-4 rounded-2xl font-bold transition-all"
            style={{
              background: T.orange,
              color: "#000",
            }}
          >
            Request Withdrawal
          </button>
        </div>

        {/* EARNINGS */}

        <div
          className="rounded-3xl p-6 border"
          style={{
            background: T.card,
            borderColor: T.border,
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <PieChart
              size={20}
              color={T.orange}
            />

            <h2 className="font-bold text-lg">
              Earnings Breakdown
            </h2>
          </div>

          <div className="space-y-4">
            <BreakdownRow
              label="Gross Earnings"
              value={
                earnings.gross_earnings || 0
              }
              color={T.blue}
            />

            <BreakdownRow
              label="Platform Fee"
              value={
                earnings.platform_fee || 0
              }
              color={T.red}
            />

            <BreakdownRow
              label="Net Earnings"
              value={
                earnings.net_earnings || 0
              }
              color={T.green}
            />
          </div>
        </div>

        {/* BANK */}

        <div
          className="rounded-3xl p-6 border"
          style={{
            background: T.card,
            borderColor: T.border,
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Building2
              size={20}
              color={T.orange}
            />

            <h2 className="font-bold text-lg">
              Beneficiary Account
            </h2>
          </div>

          {bank ? (
            <div>
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: T.cardHigh,
                  borderColor: T.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="font-bold text-lg"
                    style={{
                      color: T.orange,
                    }}
                  >
                    {bank.bank_name}
                  </div>

                  <CheckCircle2
                    color={T.green}
                  />
                </div>

                <div
                  style={{
                    color: T.textSec,
                  }}
                >
                  {bank.account_holder}
                </div>

                <div
                  className="mt-2 font-mono text-xl"
                  style={{
                    color: T.textPri,
                  }}
                >
                  •••• ••••
                  {bank.account_number?.slice(
                    -4
                  )}
                </div>

                <div
                  className="mt-3 text-sm"
                  style={{
                    color: T.textMut,
                  }}
                >
                  IFSC: {bank.ifsc_code}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Account Holder"
                value={
                  bankForm.account_holder
                }
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    account_holder:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Account Number"
                value={
                  bankForm.account_number
                }
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    account_number:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="IFSC Code"
                value={bankForm.ifsc_code}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    ifsc_code:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Bank Name"
                value={bankForm.bank_name}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    bank_name:
                      e.target.value,
                  })
                }
              />

              <Input
                placeholder="Beneficiary Name"
                value={
                  bankForm.beneficiary_name
                }
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    beneficiary_name:
                      e.target.value,
                  })
                }
              />

              <button
                onClick={addBank}
                className="w-full py-3 rounded-xl font-bold mt-3"
                style={{
                  background: T.orange,
                  color: "#000",
                }}
              >
                Save Bank Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SETTLEMENTS */}

      <div
        className="rounded-3xl border overflow-hidden"
        style={{
          background: T.card,
          borderColor: T.border,
        }}
      >
        <div
          className="p-6 border-b flex items-center gap-3"
          style={{
            borderColor: T.border,
          }}
        >
          <History
            size={20}
            color={T.orange}
          />

          <h2 className="text-xl font-bold">
            Settlement Ledger
          </h2>
        </div>

        <div className="divide-y divide-white/5">
          {settlements.map((item) => (
            <div
              key={item.id}
              className="p-5 hover:bg-white/5 transition-all cursor-pointer"
              onClick={() =>
                setExpandedSettlement(
                  expandedSettlement ===
                    item.id
                    ? null
                    : item.id
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <div
                    className="text-sm"
                    style={{
                      color: T.textMut,
                    }}
                  >
                    Settlement ID
                  </div>

                  <div className="font-bold">
                    {item.reference_id ||
                      item.id}
                  </div>
                </div>

                <div>
                  <div
                    className="text-sm"
                    style={{
                      color: T.textMut,
                    }}
                  >
                    Amount
                  </div>

                  <div
                    className="font-bold text-xl"
                    style={{
                      color: T.orange,
                    }}
                  >
                    ₹{item.amount}
                  </div>
                </div>

                <div>
                  <div
                    className="text-sm"
                    style={{
                      color: T.textMut,
                    }}
                  >
                    Date
                  </div>

                  <div>
                    {new Date(
                      item.created_at
                    ).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div
                    className="text-sm"
                    style={{
                      color: T.textMut,
                    }}
                  >
                    Destination
                  </div>

                  <div>
                    {bank?.bank_name ||
                      "Primary Bank"}
                  </div>
                </div>

                <div>
                  {statusBadge(item.status)}
                </div>
              </div>

              {/* EXPANDED */}

              {expandedSettlement ===
                item.id && (
                <div
                  className="mt-5 p-5 rounded-2xl border"
                  style={{
                    background:
                      T.cardHigh,
                    borderColor:
                      T.border,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Landmark
                      color={T.orange}
                    />

                    <div className="font-bold">
                      Settlement Timeline
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <TimelineStep
                      title="Withdrawal Requested"
                      done
                    />

                    <TimelineStep
                      title="Processing by Platform"
                      done={
                        item.status !==
                        "FAILED"
                      }
                    />

                    <TimelineStep
                      title="Transferred to Bank"
                      done={
                        item.status ===
                        "SUCCESS"
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WITHDRAW MODAL */}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="w-full max-w-md rounded-3xl p-7 border"
            style={{
              background: T.card,
              borderColor: T.borderHi,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <ArrowDownToLine
                color={T.orange}
              />

              <h2 className="text-2xl font-bold">
                Request Withdrawal
              </h2>
            </div>

            <div
              className="mb-4 text-sm"
              style={{ color: T.textSec }}
            >
              Available Balance:
              <span
                className="font-bold ml-2"
                style={{
                  color: T.orange,
                }}
              >
                ₹
                {wallet.available_balance}
              </span>
            </div>

            <Input
              placeholder="Enter Amount"
              value={withdrawAmount}
              onChange={(e) =>
                setWithdrawAmount(
                  e.target.value
                )
              }
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() =>
                  setShowWithdraw(false)
                }
                className="flex-1 py-3 rounded-xl border"
                style={{
                  borderColor: T.border,
                }}
              >
                Cancel
              </button>

              <button
                onClick={requestWithdraw}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{
                  background: T.orange,
                  color: "#000",
                }}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════ */

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl outline-none border text-white"
      style={{
        background: T.sidebar,
        borderColor: T.border,
      }}
    />
  );
}

function BreakdownRow({
  label,
  value,
  color,
}) {
  return (
    <div
      className="flex justify-between items-center p-4 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          color: T.textSec,
        }}
      >
        {label}
      </div>

      <div
        className="font-bold text-lg"
        style={{ color }}
      >
        ₹{Number(value).toLocaleString()}
      </div>
    </div>
  );
}

function TimelineStep({ title, done }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: done
            ? T.greenL
            : "rgba(255,255,255,0.05)",
        }}
      >
        {done ? (
          <CheckCircle2
            size={18}
            color={T.green}
          />
        ) : (
          <AlertCircle
            size={18}
            color={T.orange}
          />
        )}
      </div>

      <div
        style={{
          color: done
            ? T.textPri
            : T.textSec,
        }}
      >
        {title}
      </div>
    </div>
  );
}