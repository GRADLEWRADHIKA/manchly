import React, { useEffect, useState } from "react";
import {
  Users, Plus, ChevronLeft, Trash2, UserPlus, UserMinus,
  Crown, LogOut, Save, X, RefreshCw, AlertCircle, Loader,
} from "lucide-react";

import { API_BASE } from "./api";

const T = {
  bg: "#000000",
  card: "#111111",
  cardHigh: "#161616",
  sidebar: "#0A0A0A",
  orange: "#FFC107",
  orangeL: "rgba(255,193,7,0.12)",
  green: "#22C55E",
  greenL: "rgba(34,197,94,0.12)",
  red: "#EF4444",
  redL: "rgba(239,68,68,0.12)",
  purple: "#A855F7",
  purpleL: "rgba(168,85,247,0.12)",
  blue: "#3B82F6",
  blueL: "rgba(59,130,246,0.12)",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,193,7,0.4)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
  textMut: "#71717A",
};

const getToken = () =>
  (typeof window !== "undefined"
    && (localStorage.getItem("manchly_token") || localStorage.getItem("token")))
  || "";

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`);
  return data;
}

const API = {
  list:        ()                  => apiCall("GET",    "/groups"),
  detail:      (id)                => apiCall("GET",    `/groups/${id}`),
  create:      (b)                 => apiCall("POST",   "/groups", b),
  update:      (id, b)             => apiCall("PUT",    `/groups/${id}`, b),
  remove:      (id)                => apiCall("DELETE", `/groups/${id}`),
  addMembers:  (id, memberIds)     => apiCall("POST",   `/groups/${id}/members`, { memberIds }),
  removeMember:(id, memberId)      => apiCall("DELETE", `/groups/${id}/members/${memberId}`),
  setRole:     (id, memberId, isAdmin) => apiCall("PUT", `/groups/${id}/members/${memberId}/role`, { isAdmin }),
  leave:       (id)                => apiCall("POST",   `/groups/${id}/leave`),
};

export default function GroupsPanel({ currentUser }) {
  const myId = currentUser?.id;
  const isAdmin = Array.isArray(currentUser?.user_type)
    ? currentUser.user_type.includes("ADMIN")
    : currentUser?.user_type === "ADMIN";

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeGroup, setActiveGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await API.list();
      const list = data?.data || (Array.isArray(data) ? data : []);
      setGroups(list);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (activeGroup) {
    return <GroupDetail
      groupId={activeGroup.id}
      myId={myId}
      isAdmin={isAdmin}
      onBack={() => { setActiveGroup(null); load(); }}
    />;
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri,
      padding: 30, fontFamily: "system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 22, gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 6 }}>
            Groups
          </h1>
          <p style={{ color: T.textSec }}>
            Cohort & community chat rooms · {groups.length} membership(s)
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)}
              style={{ background: T.orange, color: "#000", border: "none",
                padding: "12px 20px", borderRadius: 12, fontWeight: 700,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Plus size={16}/> New group
            </button>
          )}
          <button onClick={load}
            style={{ background: T.card, color: T.textPri, border: `1px solid ${T.border}`,
              padding: "12px 16px", borderRadius: 12, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={14}/> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: T.redL, border: `1px solid ${T.red}`,
          color: T.red, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {!isAdmin && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "10px 14px", marginBottom: 14,
          color: T.textSec, fontSize: 12.5, display: "flex",
          alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} color={T.orange}/>
          Only admins can create or manage groups. You see groups you're a member of.
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => { setShowCreate(false); load(); if (g?.id) setActiveGroup(g); }}
        />
      )}

      {/* LIST */}
      {loading ? (
        <Centered text="Loading your groups…"/>
      ) : groups.length === 0 ? (
        <Centered text={isAdmin
          ? "No groups yet — click 'New group' to create one."
          : "You're not in any groups yet."}/>
      ) : (
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} onSelect={setActiveGroup}/>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupCard({ group, onSelect }) {
  return (
    <div onClick={() => onSelect(group)}
      style={{ background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: 18, cursor: "pointer", transition: "border-color 0.2s" }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = T.borderHi}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12,
          background: T.purpleL, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0 }}>
          {group.avatar_url ? (
            <img src={group.avatar_url} alt=""
              style={{ width: "100%", height: "100%",
                borderRadius: 12, objectFit: "cover" }}/>
          ) : (
            <Users color={T.purple} size={20}/>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 800,
              color: T.textPri, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>
              {group.name}
            </div>
            {group.is_admin && (
              <span style={{ background: T.orangeL, color: T.orange,
                borderRadius: 20, padding: "1px 7px", fontSize: 9,
                fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Crown size={9}/> ADMIN
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>
            {group.member_count || 0} member{group.member_count === 1 ? "" : "s"}
          </div>
          {group.description && (
            <div style={{ fontSize: 12, color: T.textMut, marginTop: 8,
              lineHeight: 1.5 }}>
              {group.description.slice(0, 110)}
              {group.description.length > 110 && "…"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DETAIL VIEW ────────────────────────────────────────── */

function GroupDetail({ groupId, myId, isAdmin, onBack }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [memberLoading, setMemberLoading] = useState(null); // memberId being mutated
  const [showDelete, setShowDelete] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await API.detail(groupId);
      const g = data?.data || data;
      setGroup(g);
      setEditForm({
        name: g.name || "",
        description: g.description || "",
        avatarUrl: g.avatar_url || "",
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [groupId]);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const data = await API.update(groupId, editForm);
      const g = data?.data || data;
      setGroup((prev) => ({ ...prev, ...g }));
      setEditing(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const addMember = async () => {
    if (!newMemberId.trim()) return;
    setMemberLoading("__add__");
    try {
      await API.addMembers(groupId, [newMemberId.trim()]);
      setNewMemberId("");
      load();
    } catch (err) { alert(err.message); }
    finally { setMemberLoading(null); }
  };

  const removeMember = async (memberUserId, memberName) => {
    if (!confirm(`Remove ${memberName} from this group?`)) return;
    setMemberLoading(memberUserId);
    try {
      await API.removeMember(groupId, memberUserId);
      load();
    } catch (err) { alert(err.message); }
    finally { setMemberLoading(null); }
  };

  const togglePromote = async (memberUserId, currentIsAdmin) => {
    setMemberLoading(memberUserId + ":role");
    try {
      await API.setRole(groupId, memberUserId, !currentIsAdmin);
      load();
    } catch (err) { alert(err.message); }
    finally { setMemberLoading(null); }
  };

  const leave = async () => {
    if (!confirm("Leave this group?")) return;
    try {
      await API.leave(groupId);
      onBack();
    } catch (err) { alert(err.message); }
  };

  const deleteGroup = async () => {
    try {
      await API.remove(groupId);
      onBack();
    } catch (err) { alert(err.message); }
    finally { setShowDelete(false); }
  };

  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri, padding: 30 }}>
        <button onClick={onBack}
          style={{ background: "transparent", border: `1px solid ${T.border}`,
            color: T.textSec, padding: "8px 14px", borderRadius: 10,
            cursor: "pointer", marginBottom: 18, display: "inline-flex",
            alignItems: "center", gap: 6 }}>
          <ChevronLeft size={14}/> Back
        </button>
        <Centered text="Loading group…"/>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri, padding: 30 }}>
        <button onClick={onBack}
          style={{ background: "transparent", border: `1px solid ${T.border}`,
            color: T.textSec, padding: "8px 14px", borderRadius: 10,
            cursor: "pointer", marginBottom: 18 }}>
          ← Back
        </button>
        <Centered text={error || "Group not found."}/>
      </div>
    );
  }

  const isCreator = group.creator_id === myId;
  const myMembership = (group.members || []).find((m) => m.user_id === myId);
  const iAmGroupAdmin = !!myMembership?.is_admin;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri,
      padding: 30, fontFamily: "system-ui, sans-serif" }}>

      <button onClick={onBack}
        style={{ background: "transparent", border: `1px solid ${T.border}`,
          color: T.textSec, padding: "8px 14px", borderRadius: 10,
          cursor: "pointer", marginBottom: 18, display: "inline-flex",
          alignItems: "center", gap: 6 }}>
        <ChevronLeft size={14}/> Back to groups
      </button>

      {error && (
        <div style={{ background: T.redL, border: `1px solid ${T.red}`,
          color: T.red, borderRadius: 12, padding: "10px 14px",
          marginBottom: 14, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* LEFT — group profile */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 18, padding: 22 }}>
          {!editing ? (
            <>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start",
                marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16,
                  background: T.purpleL, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 }}>
                  {group.avatar_url ? (
                    <img src={group.avatar_url} alt=""
                      style={{ width: "100%", height: "100%",
                        borderRadius: 16, objectFit: "cover" }}/>
                  ) : (
                    <Users color={T.purple} size={26}/>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{group.name}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                    Created by {group.creator?.name || "—"}
                  </div>
                </div>
              </div>
              {group.description && (
                <p style={{ color: T.textSec, fontSize: 13.5, lineHeight: 1.6 }}>
                  {group.description}
                </p>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 18,
                paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
                {isAdmin && (
                  <button onClick={() => setEditing(true)}
                    style={{ flex: 1, background: T.orangeL, color: T.orange,
                      border: "none", padding: "10px", borderRadius: 10,
                      fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                    ✎ Edit details
                  </button>
                )}
                {!isCreator && (
                  <button onClick={leave}
                    style={{ flex: 1, background: T.redL, color: T.red,
                      border: "none", padding: "10px", borderRadius: 10,
                      fontWeight: 700, cursor: "pointer", fontSize: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <LogOut size={12}/> Leave group
                  </button>
                )}
                {(isCreator || isAdmin) && (
                  <button onClick={() => setShowDelete(true)}
                    style={{ flex: 1, background: T.red, color: "#fff",
                      border: "none", padding: "10px", borderRadius: 10,
                      fontWeight: 700, cursor: "pointer", fontSize: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Trash2 size={12}/> Delete
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Edit group</div>
                <button onClick={() => setEditing(false)}
                  style={{ background: "transparent", border: "none",
                    color: T.textMut, cursor: "pointer" }}>
                  <X size={16}/>
                </button>
              </div>
              <Field label="Name" value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}/>
              <div style={{ marginTop: 12 }}>
                <Field label="Avatar URL" value={editForm.avatarUrl}
                  onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}/>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600,
                  color: T.textSec, display: "block", marginBottom: 5 }}>
                  Description
                </label>
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  style={{ width: "100%", background: T.sidebar,
                    border: `1px solid ${T.border}`, padding: "10px 12px",
                    borderRadius: 10, color: T.textPri, outline: "none",
                    fontSize: 13, fontFamily: "inherit", resize: "vertical",
                    boxSizing: "border-box" }}/>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16,
                justifyContent: "flex-end" }}>
                <button onClick={() => setEditing(false)}
                  style={{ background: "transparent", border: `1px solid ${T.border}`,
                    color: T.textSec, padding: "9px 16px", borderRadius: 10,
                    cursor: "pointer", fontSize: 13 }}>
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={saving}
                  style={{ background: T.orange, color: "#000", border: "none",
                    padding: "9px 18px", borderRadius: 10, fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <Save size={12}/> {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — members */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>
              Members ({(group.members || []).length})
            </div>
          </div>

          {isAdmin && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input placeholder="Add user by UUID…" value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
                style={{ flex: 1, background: T.sidebar, border: `1px solid ${T.border}`,
                  padding: "10px 14px", borderRadius: 10, color: T.textPri,
                  outline: "none", fontSize: 12.5 }}/>
              <button onClick={addMember} disabled={memberLoading === "__add__"}
                style={{ background: T.orange, color: "#000", border: "none",
                  padding: "0 16px", borderRadius: 10, fontWeight: 700,
                  cursor: "pointer", display: "inline-flex",
                  alignItems: "center", gap: 6, fontSize: 12.5 }}>
                <UserPlus size={12}/>
                {memberLoading === "__add__" ? "Adding…" : "Add"}
              </button>
            </div>
          )}

          <div style={{ display: "grid", gap: 8, maxHeight: 480, overflowY: "auto" }}>
            {(group.members || []).map((m) => (
              <MemberRow key={m.id} member={m} myId={myId}
                canManage={isAdmin}
                onRemove={() => removeMember(m.user_id, m.user?.name || m.user?.email)}
                onPromote={() => togglePromote(m.user_id, m.is_admin)}
                loading={memberLoading}/>
            ))}
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM */}
      {showDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: T.card, border: `1px solid ${T.red}`,
            borderRadius: 16, padding: 24, width: 360 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertCircle size={20} color={T.red}/>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                Delete this group?
              </h3>
            </div>
            <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, marginBottom: 18 }}>
              "{group.name}" will be removed for all members. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowDelete(false)}
                style={{ background: "transparent", border: `1px solid ${T.border}`,
                  color: T.textSec, padding: "8px 16px", borderRadius: 10,
                  cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={deleteGroup}
                style={{ background: T.red, color: "#fff", border: "none",
                  padding: "8px 18px", borderRadius: 10, cursor: "pointer",
                  fontWeight: 700, fontSize: 13 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, myId, canManage, onRemove, onPromote, loading }) {
  const user = member.user || {};
  const initials = String(user.name || user.email || "?").split(" ")
    .map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const isMe = member.user_id === myId;
  return (
    <div style={{ background: T.sidebar, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 12, display: "flex",
      alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%",
        background: T.orangeL, display: "flex", alignItems: "center",
        justifyContent: "center", fontWeight: 700, color: T.orange,
        flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.name || "—"} {isMe && <span style={{ color: T.textMut }}>(you)</span>}
          </div>
          {member.is_admin && (
            <span style={{ background: T.orangeL, color: T.orange,
              borderRadius: 20, padding: "1px 7px", fontSize: 9,
              fontWeight: 800, display: "inline-flex",
              alignItems: "center", gap: 3 }}>
              <Crown size={9}/> ADMIN
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>
          {user.email || member.user_id?.slice(0, 8)}
        </div>
      </div>
      {canManage && !isMe && (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onPromote} disabled={loading === member.user_id + ":role"}
            title={member.is_admin ? "Demote to member" : "Promote to admin"}
            style={{ background: T.orangeL, color: T.orange, border: "none",
              padding: "5px 9px", borderRadius: 7, cursor: "pointer",
              fontSize: 11, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 4 }}>
            {loading === member.user_id + ":role"
              ? <Loader size={10} className="spin"/>
              : <Crown size={10}/>}
            {member.is_admin ? "Demote" : "Promote"}
          </button>
          <button onClick={onRemove} disabled={loading === member.user_id}
            style={{ background: T.redL, color: T.red, border: "none",
              padding: "5px 9px", borderRadius: 7, cursor: "pointer",
              fontSize: 11, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 4 }}>
            {loading === member.user_id
              ? <Loader size={10} className="spin"/>
              : <UserMinus size={10}/>}
          </button>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

/* ─── CREATE MODAL ───────────────────────────────────────── */

function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", avatarUrl: "" });
  const [memberIds, setMemberIds] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const ids = memberIds.split(",").map((s) => s.trim()).filter(Boolean);
      const data = await API.create({
        name: form.name.trim(),
        description: form.description.trim(),
        avatarUrl: form.avatarUrl.trim() || undefined,
        memberIds: ids,
      });
      onCreated(data?.group || data?.data || data);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, backdropFilter: "blur(4px)" }}>
      <div style={{ background: T.card, border: `1px solid ${T.borderHi}`,
        borderRadius: 18, padding: 24, width: 440, maxHeight: "90vh",
        overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
            New group
          </h3>
          <button onClick={onClose}
            style={{ background: "transparent", border: "none",
              color: T.textMut, cursor: "pointer", fontSize: 22 }}>×</button>
        </div>
        <p style={{ fontSize: 11, color: T.textSec, fontFamily: "monospace",
          marginBottom: 14 }}>
          POST /groups
        </p>

        {error && (
          <div style={{ background: T.redL, border: `1px solid ${T.red}`,
            color: T.red, borderRadius: 10, padding: "8px 12px",
            marginBottom: 12, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <Field label="Group name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Founders Q4 cohort"/>
        <div style={{ marginTop: 12 }}>
          <Field label="Avatar URL (optional)" value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}/>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600,
            color: T.textSec, display: "block", marginBottom: 5 }}>
            Description
          </label>
          <textarea value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            style={{ width: "100%", background: T.sidebar,
              border: `1px solid ${T.border}`, padding: "10px 12px",
              borderRadius: 10, color: T.textPri, outline: "none",
              fontSize: 13, fontFamily: "inherit", resize: "vertical",
              boxSizing: "border-box" }}/>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Initial members (comma-separated UUIDs, optional)"
            value={memberIds}
            onChange={(e) => setMemberIds(e.target.value)}
            placeholder="uuid1, uuid2, …"/>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ background: "transparent", border: `1px solid ${T.border}`,
              color: T.textSec, padding: "10px 18px", borderRadius: 10,
              cursor: "pointer", fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            style={{ background: T.orange, color: "#000", border: "none",
              padding: "10px 20px", borderRadius: 10, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
              fontSize: 13 }}>
            {saving ? "Creating…" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 600,
        color: T.textSec, display: "block", marginBottom: 5 }}>
        {label}
      </label>
      <input value={value} onChange={onChange} placeholder={placeholder || ""}
        style={{ width: "100%", background: T.sidebar,
          border: `1px solid ${T.border}`, padding: "10px 12px",
          borderRadius: 10, color: T.textPri, outline: "none",
          fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" }}/>
    </div>
  );
}

function Centered({ text }) {
  return (
    <div style={{ background: T.card, border: `1px dashed ${T.border}`,
      borderRadius: 14, padding: 50, textAlign: "center",
      color: T.textSec, fontSize: 13 }}>
      {text}
    </div>
  );
}
