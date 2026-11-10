import React, { useEffect, useState } from "react";

import {
  ShieldCheck,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCcw,
  UploadCloud,
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
  blue: "#3B82F6",
  blueL: "rgba(59,130,246,0.12)",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,193,7,0.35)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
  textMut: "#71717A",
};

import { API_BASE as BASE } from "./api";

export default function CreateKycDashboard() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [panForm, setPanForm] = useState({
    pan_number: "",
    name: "",
    dob: "",
  });

  const [bankForm, setBankForm] = useState({
    account_number: "",
    ifsc_code: "",
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
  // FETCH STATUS
  
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${BASE}/kyc/status`, {
        headers,
      });

      const data = await res.json();
      console.log("KYC STATUS:", data);
      setStatus(data?.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // VERIFY PAN
  const verifyPan = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/kyc/verify-pan`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          pan_number: panForm.pan_number,
        }),
      });

      const data = await res.json();
      console.log("VERIFY PAN:", data);
      if (!res.ok) throw new Error(data?.message || "PAN verification failed");
      alert("PAN verified");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // FULL KYC
  const verifyKyc = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE}/kyc/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify(panForm),
      });

      const data = await res.json();
      console.log("VERIFY KYC:", data);
      if (!res.ok) throw new Error(data?.message || "KYC failed");
      alert("KYC verification successful");
      fetchStatus();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // VERIFY BANK
  const verifyBank = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE}/kyc/verify-bank`, {
        method: "POST",
        headers,
        body: JSON.stringify(bankForm),
      });

      const data = await res.json();
      console.log("VERIFY BANK:", data);
      if (!res.ok) throw new Error(data?.message || "Bank verification failed");
      alert("Bank verified successfully");
      fetchStatus();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // RESET
  const resetKyc = async () => {
    try {
      const res = await fetch(`${BASE}/kyc/reset`, {
        method: "POST",
        headers,
      });

      const data = await res.json();
      console.log("RESET:", data);
      fetchStatus();
      alert("KYC Reset");
    } catch (err) {
      console.error(err);
    }
  };

  const isVerified = status?.kyc_verified;
  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.textPri,
        padding: 30,
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            style={{
              color: T.orange,
            }}
            className="text-4xl font-black"
          >
            Creator KYC
          </h1>
          <p
            style={{
              color: T.textSec,
            }}
            className="mt-2"
          >
            Compliance & Verification Dashboard
          </p>
        </div>

        <button
          onClick={resetKyc}
          style={{
            background: T.redL,
            color: T.red,
            border: `1px solid ${T.red}`,
          }}
          className="px-5 py-3 rounded-2xl font-bold flex items-center gap-2"
        >
          <RefreshCcw size={18} />
          Reset KYC
        </button>
      </div>

      {isVerified ? (
        <div
          style={{
            background: "linear-gradient(135deg,#052e16,#071a11)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
          className="rounded-3xl p-8 mb-8"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 color={T.green} size={30} />

            <div>
              <h2
                style={{
                  color: T.green,
                }}
                className="text-2xl font-black"
              >
                Verified Creator
              </h2>

              <p className="text-green-200 mt-1">
                Upload courses & monetize webinars.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "linear-gradient(135deg,#2b1f00,#120d00)",
            border: `1px solid ${T.borderHi}`,
          }}
          className="rounded-3xl p-8 mb-8"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle color={T.orange} size={30} />

            <div>
              <h2
                style={{
                  color: T.orange,
                }}
                className="text-2xl font-black"
              >
                Complete KYC
              </h2>

              <p
                style={{
                  color: T.orangeM,
                }}
                className="mt-1"
              >
                Verify PAN & bank account to unlock creator tools.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
          }}
          className="rounded-3xl p-7"
        >
          <div className="flex items-center gap-3 mb-6">
            <FileText color={T.orange} />

            <h2 className="text-2xl font-black">PAN Verification</h2>
          </div>

          <div className="space-y-4">
            <input
              placeholder="PAN Number"
              value={panForm.pan_number}
              onChange={(e) =>
                setPanForm({
                  ...panForm,
                  pan_number: e.target.value.toUpperCase(),
                })
              }
              style={inputStyle()}
            />

            <input
              placeholder="Full Name"
              value={panForm.name}
              onChange={(e) =>
                setPanForm({
                  ...panForm,
                  name: e.target.value,
                })
              }
              style={inputStyle()}
            />

            <input
              type="date"
              value={panForm.dob}
              onChange={(e) =>
                setPanForm({
                  ...panForm,
                  dob: e.target.value,
                })
              }
              style={inputStyle()}
            />

            <div className="flex gap-3">
              <button
                onClick={verifyPan}
                style={buttonStyle()}
                className="flex-1"
              >
                Verify PAN
              </button>

              <button
                onClick={verifyKyc}
                style={buttonStyle()}
                className="flex-1"
              >
                Complete KYC
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
          }}
          className="rounded-3xl p-7"
        >
          <div className="flex items-center gap-3 mb-6">
            <Building2 color={T.orange} />

            <h2 className="text-2xl font-black">Bank Verification</h2>
          </div>

          <div className="space-y-4">
            <input
              placeholder="Account Number"
              value={bankForm.account_number}
              onChange={(e) =>
                setBankForm({
                  ...bankForm,
                  account_number: e.target.value,
                })
              }
              style={inputStyle()}
            />

            <input
              placeholder="IFSC Code"
              value={bankForm.ifsc_code}
              onChange={(e) =>
                setBankForm({
                  ...bankForm,
                  ifsc_code: e.target.value.toUpperCase(),
                })
              }
              style={inputStyle()}
            />

            <button
              onClick={verifyBank}
              style={buttonStyle()}
              className="w-full"
            >
              Verify Bank Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%",
    background: T.sidebar,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: "14px 16px",
    color: T.textPri,
    outline: "none",
  };
}

function buttonStyle() {
  return {
    background: T.orange,
    color: "#000",
    border: "none",
    borderRadius: 16,
    padding: "14px 20px",
    fontWeight: 800,
    cursor: "pointer",
  };
}
