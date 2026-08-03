// Post-call rating — 1–5 stars + optional feedback → POST /sessions/rate.
import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import colors from "../../utils/colors";
import { GradientButton, StarRating, TextArea } from "../../components/ui";
import { toast } from "../../utils/toast";

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function SessionRating() {
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!rating) return toast.error("Please select a rating");
    setSaving(true);
    try {
      await apiFetch("/sessions/rate", { method: "POST", body: JSON.stringify({ session_id: sessionId, rating, feedback: feedback.trim() || undefined }) });
      toast.success("Thanks for your feedback!");
      navigate("/app/sessions", { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: "40px auto", textAlign: "center" }}>
      <div style={{ background: colors.gradients.heroNavy, borderRadius: 20, padding: 30 }}>
        <div style={{ fontSize: 40 }}>📞</div>
        <h1 style={{ margin: "10px 0 4px", fontSize: 22, fontWeight: 900 }}>Session Ended</h1>
        <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>
          {params.get("name") ? `with ${params.get("name")} · ` : ""}{params.get("duration") || 0} min session
        </p>

        <div style={{ margin: "26px 0 8px" }}>
          <StarRating value={rating} onChange={setRating} />
          <div style={{ marginTop: 8, fontWeight: 800, color: "#F0C040", minHeight: 20 }}>{LABELS[rating]}</div>
        </div>

        <TextArea dark placeholder="Share your feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ marginTop: 8 }} />

        <GradientButton full size="lg" loading={saving} onClick={submit} style={{ marginTop: 18 }}>Submit Rating</GradientButton>
        <button onClick={() => navigate("/app/sessions", { replace: true })} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", marginTop: 14, fontSize: 13.5 }}>
          Skip
        </button>
      </div>
    </div>
  );
}
