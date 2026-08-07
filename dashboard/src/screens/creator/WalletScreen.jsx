// Wallet & Payouts — light creator-suite redesign, fully dynamic:
// balance hero + gated withdrawal, earnings breakdown, settlement ledger +
// wallet transactions, beneficiary bank account (add/edit + penny-less
// verification), KYC gate banner, 90/10 share note.
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet, IndianRupee, Landmark, ShieldCheck, ShieldAlert, ArrowDownToLine,
  ArrowUpRight, ArrowDownLeft, Pencil, CheckCircle2, Clock3, RefreshCw,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Modal, Badge, EmptyState, Spinner } from "../../components/ui";
import { GoldBtn, StatCard, lbl } from "../../components/creatorUi";
import { toast } from "../../utils/toast";
import { formatCurrency, timeAgo } from "../../utils/formatters";

const G = colors.gradients;
const card = { background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 18, padding: 22 };

const SETTLE_COLORS = { COMPLETED: "#16A34A", SETTLED: "#16A34A", PENDING: "#B45309", PENDING_SETTLEMENT: "#B45309", PROCESSING: "#2563EB", FAILED: "#DC2626" };

const mask = (n) => (n ? `••••${String(n).slice(-4)}` : "—");

// Case/field-name-tolerant truthiness check — handles booleans (true/"true"),
// and status strings in any casing ("verified" / "VERIFIED" / "Verified").
function isVerifiedFlag(...candidates) {
  for (const value of candidates) {
    if (value === true || value === "true") return true;
    if (typeof value === "string" && value.toUpperCase() === "VERIFIED") return true;
  }
  return false;
}

export default function WalletScreen() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [bank, setBank] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState("Settlements");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // modals
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ account_number: "", confirm: "", ifsc_code: "", beneficiary_name: "", bank_name: "" });
  const [bankSaving, setBankSaving] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyAcct, setVerifyAcct] = useState("");
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    const [w, b, ba, k, st] = await Promise.allSettled([
      apiFetch("/settlements/wallet"),
      apiFetch("/settlements/earnings-breakdown"),
      apiFetch("/settlements/bank-account"),
      apiFetch("/kyc/status"),
      apiFetch("/settlements/my-settlements?page=1&limit=30"),
    ]);

    if (w.status === "fulfilled") {
      const d = unwrap(w.value);
      const wd = d?.wallet || d;
      setWallet(wd);
      setEntries(wd?.entries || wd?.transactions || d?.entries || d?.transactions || []);
    } else {
      console.error("Failed to load wallet:", w.reason);
    }

    if (b.status === "fulfilled") {
      setBreakdown(unwrap(b.value));
    } else {
      console.error("Failed to load earnings breakdown:", b.reason);
    }

    if (ba.status === "fulfilled") {
      const d = unwrap(ba.value);
      // DIAGNOSTIC: confirm the real field names/casing the backend actually
      // returns here, then trim this log once verified.
      console.log("RAW bank-account response:", d);
      setBank(d?.bank_account || d?.account || d?.bankAccount || (d && (d.account_number || d.ifsc_code) ? d : null));
    } else {
      console.error("Failed to load bank account:", ba.reason);
    }

    if (k.status === "fulfilled") {
      const d = unwrap(k.value);
      // DIAGNOSTIC: confirm the real field names/casing the backend actually
      // returns here, then trim this log once verified.
      console.log("RAW kyc/status response:", d);
      setKyc(d);
    } else {
      console.error("Failed to load KYC status:", k.reason);
    }

    if (st.status === "fulfilled") {
      const d = unwrap(st.value);
      setSettlements(d?.settlements || (Array.isArray(d) ? d : []));
    } else {
      console.error("Failed to load settlements:", st.reason);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // Tolerant of boolean flags in either casing AND status strings in any
  // casing ("verified" / "VERIFIED" / "Verified") — a mismatch here was
  // silently forcing both of these to false regardless of actual KYC/bank state.
  const kycVerified = isVerifiedFlag(
    kyc?.verified,
    kyc?.is_verified,
    kyc?.kyc_verified,
    kyc?.status,
    kyc?.kyc_status,
  );
  const bankVerified = isVerifiedFlag(
    bank?.is_verified,
    bank?.verified,
    bank?.verification_status,
    bank?.status,
  );

  const available = Number(wallet?.available_balance ?? wallet?.balance ?? 0);
  const totalEarned = Number(wallet?.total_net_earnings ?? breakdown?.total_earnings ?? 0);
  const pending = Number(wallet?.pending_settlement ?? 0);

  const openWithdraw = () => {
    if (!kycVerified) { toast.error("Complete KYC before withdrawing"); navigate("/creator/kyc"); return; }
    if (!bank) { toast.error("Add your bank account first"); setBankOpen(true); return; }
    if (available <= 0) { toast.info("No withdrawable balance yet"); return; }
    setAmount(String(available));
    setWithdrawOpen(true);
  };

  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > available) return toast.error("Amount exceeds available balance");
    setWithdrawing(true);
    try {
      await apiFetch("/settlements/withdraw", { method: "POST", body: JSON.stringify({ amount: amt }) });
      toast.success("Withdrawal requested — funds arrive in T+2 business days");
      setWithdrawOpen(false);
      setRefreshing(true);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const openBank = () => {
    setBankForm({
      account_number: "", confirm: "",
      ifsc_code: bank?.ifsc_code || "", beneficiary_name: bank?.beneficiary_name || bank?.account_holder || "",
      bank_name: bank?.bank_name || "",
    });
    setBankOpen(true);
  };

  const saveBank = async () => {
    const { account_number, confirm, ifsc_code, beneficiary_name, bank_name } = bankForm;
    if (!/^\d{8,18}$/.test(account_number)) return toast.error("Account number must be 8–18 digits");
    if (account_number !== confirm) return toast.error("Account numbers don't match");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code.toUpperCase())) return toast.error("Invalid IFSC code");
    if (!beneficiary_name.trim()) return toast.error("Beneficiary name is required");
    setBankSaving(true);
    try {
      await apiFetch("/settlements/bank-account", {
        method: "POST",
        body: JSON.stringify({ account_number, ifsc_code: ifsc_code.toUpperCase(), beneficiary_name: beneficiary_name.trim(), bank_name: bank_name.trim() || undefined }),
      });
      toast.success("Bank account saved");
      setBankOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBankSaving(false);
    }
  };

  const verifyBank = async () => {
    if (!/^\d{8,18}$/.test(verifyAcct)) return toast.error("Re-enter your full account number");
    setVerifying(true);
    try {
      const res = unwrap(
        await apiFetch("/kyc/verify-bank", {
          method: "POST",
          body: JSON.stringify({ account_number: verifyAcct, ifsc_code: bank?.ifsc_code, account_holder_name: bank?.beneficiary_name || bank?.account_holder }),
        })
      );
      const nameAtBank = res?.beneficiary_name_with_bank || res?.name_at_bank;
      toast.success(nameAtBank ? `Verified ✓ Name at bank: ${nameAtBank}` : "Bank account verified ✓");
      setVerifyOpen(false);
      load();
    } catch (e) {
      toast.error(e.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const ledger = tab === "Settlements" ? settlements : entries;

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900 }}>
            Wallet & <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Payouts</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: colors.typography.secondaryText, fontSize: 14 }}>
            Earnings settle automatically to your bank in T+2 business days.
          </p>
        </div>
        <button className="cs-icon-btn" title="Refresh" onClick={() => { setRefreshing(true); load(); }}>
          {refreshing ? <Spinner size={15} /> : <RefreshCw size={15} />}
        </button>
      </div>

      {/* KYC banner */}
      {!loading && !kycVerified && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: "13px 18px", marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: "#92400E", fontSize: 14, fontWeight: 700 }}>
            <ShieldAlert size={18} /> Complete PAN KYC to unlock withdrawals
          </span>
          <GoldBtn style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => navigate("/creator/kyc")}>Verify Now</GoldBtn>
        </div>
      )}

      {/* Balance hero */}
      <div style={{ background: G.heroGold, borderRadius: 22, padding: "26px 30px", color: "#fff", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.85 }}>
            <Wallet size={14} /> Withdrawable Balance
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, margin: "6px 0 10px", letterSpacing: -1 }}>
            {loading ? "…" : formatCurrency(available)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.16)", borderRadius: 99, padding: "5px 14px", fontSize: 12.5, fontWeight: 700 }}>
              Lifetime earned {formatCurrency(totalEarned)}
            </span>
            <span style={{ background: "rgba(255,255,255,0.16)", borderRadius: 99, padding: "5px 14px", fontSize: 12.5, fontWeight: 700 }}>
              <Clock3 size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Pending settlement {formatCurrency(pending)}
            </span>
          </div>
        </div>
        <button
          onClick={openWithdraw}
          style={{ border: "none", cursor: "pointer", borderRadius: 14, padding: "15px 26px", fontWeight: 900, fontSize: 15.5, fontFamily: "inherit", background: "#fff", color: "#92400E", display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 10px 28px rgba(0,0,0,0.28)" }}
        >
          <ArrowDownToLine size={18} /> Withdraw
        </button>
      </div>

      {/* Earnings breakdown */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard icon={IndianRupee} label="Net This Month" value={formatCurrency(breakdown?.net_earnings ?? 0)} tint="#22C55E" />
        <StatCard icon={ArrowUpRight} label="Lifetime Earnings" value={formatCurrency(breakdown?.total_earnings ?? totalEarned)} tint="#3B82F6" />
        <StatCard icon={ArrowDownLeft} label="Last Payout" value={breakdown?.last_payout ? formatCurrency(breakdown.last_payout?.amount ?? breakdown.last_payout) : "—"} tint="#8B5CF6" />
        <StatCard icon={Landmark} label="Your Share" value="90%" tint="#F5A623" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Ledger */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 900 }}>Ledger</h3>
            <div className="cs-seg" style={{ width: 260 }}>
              {["Settlements", "Transactions"].map((t) => (
                <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mn-shimmer" style={{ height: 200, borderRadius: 14, opacity: 0.3 }} />
          ) : ledger.length === 0 ? (
            <EmptyState icon="🧾" title={`No ${tab.toLowerCase()} yet`} subtitle="Your sales settle here automatically after each purchase." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ledger.slice(0, 20).map((row, i) => {
                const status = String(row.status || "").toUpperCase();
                const isDebit = String(row.type || "").toUpperCase() === "DEBIT" || status.includes("WITHDRAW");
                const amt = Number(row.net_amount ?? row.amount ?? 0);
                return (
                  <div key={row.id || i} className="cs-lesson-row" style={{ padding: "11px 14px" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isDebit ? "#FEF2F2" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isDebit ? <ArrowUpRight size={16} color="#DC2626" /> : <ArrowDownLeft size={16} color="#16A34A" />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.title || row.description || (tab === "Settlements" ? `Settlement #${String(row.id || "").slice(-6)}` : isDebit ? "Withdrawal" : "Sale credit")}
                      </div>
                      <div style={{ color: colors.typography.secondaryText, fontSize: 12 }}>
                        {row.created_at || row.date ? `${new Date(row.created_at || row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${timeAgo(row.created_at || row.date)}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, fontSize: 14, color: isDebit ? "#DC2626" : "#16A34A" }}>
                        {isDebit ? "−" : "+"}{formatCurrency(Math.abs(amt))}
                      </div>
                      {status && <Badge color={SETTLE_COLORS[status] || "#6B7280"}>{status.replace(/_/g, " ")}</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Bank account */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                <Landmark size={16} color="#F5A623" /> Beneficiary Account
              </h3>
              {bank && (
                <button className="cs-icon-btn" style={{ width: 30, height: 30 }} title="Edit" onClick={openBank}><Pencil size={13} /></button>
              )}
            </div>

            {loading ? (
              <div className="mn-shimmer" style={{ height: 110, borderRadius: 12, opacity: 0.3 }} />
            ) : !bank ? (
              <>
                <p style={{ margin: "0 0 14px", color: colors.typography.secondaryText, fontSize: 13.5, lineHeight: 1.6 }}>
                  Add your bank account to receive automatic T+2 settlements.
                </p>
                <GoldBtn full onClick={openBank} style={{ width: "100%", justifyContent: "center" }}><Landmark size={15} /> Add Bank Account</GoldBtn>
              </>
            ) : (
              <>
                <div style={{ background: "linear-gradient(135deg, #1F2937, #374151)", borderRadius: 14, padding: 18, color: "#fff", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>{bank.bank_name || "Bank Account"}</span>
                    {bankVerified ? (
                      <Badge color="#4ADE80" bg="rgba(74,222,128,0.15)"><ShieldCheck size={11} style={{ marginRight: 4 }} />Verified</Badge>
                    ) : (
                      <Badge color="#FCD34D" bg="rgba(252,211,77,0.15)">Not Verified</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: 2, margin: "12px 0 8px" }}>{mask(bank.account_number)}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, opacity: 0.85 }}>
                    <span>{bank.beneficiary_name || bank.account_holder}</span>
                    <span>{bank.ifsc_code}</span>
                  </div>
                </div>
                {!bankVerified && (
                  <GoldBtn ghost onClick={() => { setVerifyAcct(""); setVerifyOpen(true); }} style={{ width: "100%", justifyContent: "center" }}>
                    <ShieldCheck size={15} /> Verify Account
                  </GoldBtn>
                )}
              </>
            )}
          </div>

          {/* 90/10 share */}
          <div style={card}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15.5, fontWeight: 900 }}>Aapki Kamaai ka Hissa</h3>
            <p style={{ margin: "0 0 12px", color: colors.typography.secondaryText, fontSize: 13, lineHeight: 1.6 }}>
              You keep <b style={{ color: "#15803D" }}>90%</b> of every sale. Manchly's 10% covers payments, hosting & support. 2% TDS applies on payouts per government rules.
            </p>
            <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: "90%", background: G.gold }} />
              <div style={{ width: "10%", background: "#E5E7EB" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, color: colors.typography.secondaryText, marginTop: 6 }}>
              <span>You · 90%</span><span>Manchly · 10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Withdraw modal ---------- */}
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Request Withdrawal" width={440}>
        <p style={{ margin: "0 0 16px", color: colors.typography.secondaryText, fontSize: 13.5, lineHeight: 1.6 }}>
          Available: <b style={{ color: "#15803D" }}>{formatCurrency(available)}</b> → credited to {mask(bank?.account_number)} within <b>T+2 business days</b>.
        </p>
        <label style={lbl}>Amount</label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 900, color: "#92400E" }}>₹</span>
          <input className="cs-input" style={{ paddingLeft: 30, fontWeight: 800, fontSize: 17 }} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
        <button onClick={() => setAmount(String(available))} style={{ background: "transparent", border: "none", color: "#B45309", fontWeight: 800, fontSize: 12.5, cursor: "pointer", padding: 0, fontFamily: "inherit", marginBottom: 16 }}>
          Withdraw all {formatCurrency(available)}
        </button>
        <GoldBtn loading={withdrawing} onClick={withdraw} style={{ width: "100%", justifyContent: "center", padding: "13px 18px" }}>
          <ArrowDownToLine size={16} /> Confirm Withdrawal
        </GoldBtn>
      </Modal>

      {/* ---------- Bank modal ---------- */}
      <Modal open={bankOpen} onClose={() => setBankOpen(false)} title={bank ? "Edit Bank Account" : "Add Bank Account"} width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Account Number</label>
            <input className="cs-input" inputMode="numeric" maxLength={18} value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value.replace(/\D/g, "") })} placeholder="8–18 digits" />
          </div>
          <div>
            <label style={lbl}>Confirm Account Number</label>
            <input className="cs-input" inputMode="numeric" maxLength={18} value={bankForm.confirm} onChange={(e) => setBankForm({ ...bankForm, confirm: e.target.value.replace(/\D/g, "") })} placeholder="Re-enter account number" />
            {bankForm.confirm && bankForm.confirm !== bankForm.account_number && (
              <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>Doesn't match</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>IFSC Code</label>
              <input className="cs-input" maxLength={11} value={bankForm.ifsc_code} onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })} placeholder="HDFC0001234" style={{ textTransform: "uppercase" }} />
            </div>
            <div>
              <label style={lbl}>Bank Name (optional)</label>
              <input className="cs-input" value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} placeholder="HDFC Bank" />
            </div>
          </div>
          <div>
            <label style={lbl}>Beneficiary Name</label>
            <input className="cs-input" value={bankForm.beneficiary_name} onChange={(e) => setBankForm({ ...bankForm, beneficiary_name: e.target.value })} placeholder="Name as per bank records" />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${colors.base.border}`, paddingTop: 14 }}>
            <GoldBtn ghost onClick={() => setBankOpen(false)}>Cancel</GoldBtn>
            <GoldBtn loading={bankSaving} onClick={saveBank}><CheckCircle2 size={15} /> Save Account</GoldBtn>
          </div>
        </div>
      </Modal>

      {/* ---------- Verify modal ---------- */}
      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Verify Bank Account" width={420}>
        <p style={{ margin: "0 0 14px", color: colors.typography.secondaryText, fontSize: 13.5, lineHeight: 1.6 }}>
          Re-enter your full account number ending {mask(bank?.account_number)} — we'll run a penny-less verification with your bank.
        </p>
        <input className="cs-input" inputMode="numeric" maxLength={18} value={verifyAcct} onChange={(e) => setVerifyAcct(e.target.value.replace(/\D/g, ""))} placeholder="Full account number" autoFocus />
        <GoldBtn loading={verifying} onClick={verifyBank} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
          <ShieldCheck size={16} /> Verify Account
        </GoldBtn>
      </Modal>
    </div>
  );
}