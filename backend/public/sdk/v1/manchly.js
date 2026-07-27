/*!
 * Manchly SDK — drop-in payments & course access for creators.
 * Usage:
 *   <script src="https://server.manchly.com/sdk/v1/manchly.js"></script>
 *   <script>
 *     const m = Manchly.init({ creatorId: 'YOUR_CREATOR_ID' });
 *     document.getElementById('buy').onclick = () => m.buy('COURSE_ID');
 *   </script>
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.Manchly = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Config ---------- */
  const DEFAULTS = {
    apiBase: 'https://server.manchly.com',
    checkoutPage: null, // defaults to apiBase + '/pay.html'
    storagePrefix: 'manchly',
    theme: {
      accent: '#EAB308',
      accentDark: '#CA8A04',
      charcoal: '#111827',
      text: '#111827',
      muted: '#6B7280',
      border: '#E5E7EB',
      danger: '#DC2626',
      success: '#059669',
    },
  };

  /* ---------- Errors ---------- */
  class ManchlyError extends Error {
    constructor(opts) {
      super(opts.message || 'Manchly SDK error');
      this.name = 'ManchlyError';
      this.kind = opts.kind || 'unknown';
      this.status = opts.status || 0;
      this.code = opts.code || null;
      this.details = opts.details || null;
    }
  }

  function kindOf(status) {
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status === 422 || status === 400) return 'validation';
    if (status === 429) return 'rate_limited';
    if (status >= 500) return 'server';
    return 'unknown';
  }

  function friendly(kind, raw) {
    if (typeof raw === 'string' && raw.trim()) return raw;
    const map = {
      network:      'No internet connection. Please check your network.',
      timeout:      'The server took too long to respond. Please try again.',
      unauthorized: 'Your session has expired. Please log in again.',
      forbidden:    "You don't have permission to do that.",
      not_found:    "We couldn't find what you were looking for.",
      conflict:     'This action conflicts with your current state.',
      rate_limited: 'Too many attempts. Please wait a moment and try again.',
      server:       "Our servers are having trouble — please retry shortly.",
      validation:   'Some details look wrong. Please review and try again.',
      unknown:      'Something went wrong. Please try again.',
    };
    return map[kind] || map.unknown;
  }

  /* ---------- Tiny event emitter ---------- */
  function emitter() {
    const listeners = {};
    return {
      on(ev, cb) { (listeners[ev] = listeners[ev] || []).push(cb); return () => this.off(ev, cb); },
      off(ev, cb) { listeners[ev] = (listeners[ev] || []).filter(fn => fn !== cb); },
      emit(ev, data) { (listeners[ev] || []).slice().forEach(cb => { try { cb(data); } catch (e) { console.error(e); } }); },
    };
  }

  /* ---------- Storage ---------- */
  function storage(prefix) {
    const tokenKey = prefix + ':token';
    const userKey = prefix + ':user';
    const deviceKey = prefix + ':device';
    const creatorKey = prefix + ':creator';
    return {
      getToken() {
        try {
          const t = localStorage.getItem(tokenKey);
          return t && t !== 'undefined' && t !== 'null' ? t : null;
        } catch (_) { return null; }
      },
      getUser() {
        try { return JSON.parse(localStorage.getItem(userKey) || 'null'); } catch (_) { return null; }
      },
      setAuth(token, user) {
        try {
          localStorage.setItem(tokenKey, token);
          localStorage.setItem(userKey, JSON.stringify(user || null));
        } catch (_) {}
      },
      clearAuth() {
        try { localStorage.removeItem(tokenKey); localStorage.removeItem(userKey); } catch (_) {}
      },
      getCreator() {
        try { return JSON.parse(localStorage.getItem(creatorKey) || 'null'); } catch (_) { return null; }
      },
      setCreator(info) {
        try { localStorage.setItem(creatorKey, JSON.stringify(info || null)); } catch (_) {}
      },
      clearCreator() {
        try { localStorage.removeItem(creatorKey); } catch (_) {}
      },
      deviceId() {
        try {
          let id = localStorage.getItem(deviceKey);
          if (!id) {
            id = 'dev_' + Date.now().toString(36) + '_' +
              Math.random().toString(36).slice(2, 10);
            localStorage.setItem(deviceKey, id);
          }
          return id;
        } catch (_) {
          return 'dev_ephemeral_' + Math.random().toString(36).slice(2, 10);
        }
      },
    };
  }

  /* ---------- HTTP ---------- */
  async function httpJson(baseUrl, path, opts, getToken, getDeviceId, timeoutMs) {
    const headers = Object.assign(
      { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() },
      opts && opts.headers || {}
    );
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs || 25000);
    let res;
    try {
      res = await fetch(baseUrl + path, Object.assign({}, opts, { headers, signal: ctrl.signal }));
    } catch (e) {
      clearTimeout(tid);
      if (e && e.name === 'AbortError') {
        throw new ManchlyError({ kind: 'timeout', message: friendly('timeout') });
      }
      throw new ManchlyError({ kind: 'network', message: friendly('network'), details: e && e.message });
    }
    clearTimeout(tid);
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const kind = kindOf(res.status);
      throw new ManchlyError({
        kind,
        status: res.status,
        code: data && (data.code || data.error_code) || null,
        message: friendly(kind, data && (data.message || data.error)),
        details: data,
      });
    }
    return data;
  }

  /* ---------- UI: style injection ---------- */
  function injectStyles(theme) {
    if (document.getElementById('manchly-sdk-styles')) return;
    const s = document.createElement('style');
    s.id = 'manchly-sdk-styles';
    s.textContent = `
.manchly-overlay{position:fixed;inset:0;background:rgba(17,24,39,.6);backdrop-filter:blur(4px);
  display:none;align-items:center;justify-content:center;z-index:99999;padding:20px;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
.manchly-overlay.manchly-open{display:flex}
.manchly-modal{background:#fff;border-radius:24px;padding:28px;max-width:420px;width:100%;
  box-shadow:0 30px 60px -15px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto;position:relative;color:${theme.text};}
.manchly-close{position:absolute;top:14px;right:14px;background:#F3F4F6;border:none;width:34px;height:34px;
  border-radius:50%;cursor:pointer;font-size:14px;color:${theme.muted};display:flex;align-items:center;justify-content:center;}
.manchly-close:hover{background:${theme.charcoal};color:#fff;}
.manchly-title{font-size:1.35rem;font-weight:800;margin:0 0 6px;letter-spacing:-.01em;}
.manchly-sub{color:${theme.muted};font-size:.9rem;margin:0 0 22px;}
.manchly-label{display:block;font-size:.7rem;font-weight:700;color:#374151;margin:12px 0 6px;
  text-transform:uppercase;letter-spacing:.04em;}
.manchly-input{width:100%;padding:12px 14px;border:1.5px solid ${theme.border};border-radius:12px;
  font-size:.95rem;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;}
.manchly-input:focus{border-color:${theme.accent};box-shadow:0 0 0 3px ${hexToRgba(theme.accent, 0.15)};}
.manchly-btn{width:100%;background:${theme.charcoal};color:#fff;border:none;padding:13px;border-radius:60px;
  font-weight:800;font-size:.95rem;cursor:pointer;margin-top:18px;font-family:inherit;transition:background .15s;}
.manchly-btn:hover{background:${theme.accent};color:${theme.charcoal};}
.manchly-btn:disabled{opacity:.6;cursor:not-allowed;}
.manchly-btn-ghost{background:transparent;color:${theme.charcoal};border:1.5px solid ${theme.border};}
.manchly-btn-ghost:hover{border-color:${theme.accent};color:${theme.accent};background:transparent;}
.manchly-msg{margin-top:12px;padding:10px 14px;border-radius:10px;font-size:.82rem;font-weight:600;display:none;}
.manchly-msg.manchly-on{display:block;}
.manchly-msg.manchly-err{background:#FEE2E2;color:#991B1B;}
.manchly-msg.manchly-ok{background:#D1FAE5;color:#065F46;}
.manchly-link{display:block;text-align:center;margin-top:14px;font-size:.85rem;color:${theme.muted};}
.manchly-link a{color:${theme.accentDark};font-weight:700;cursor:pointer;text-decoration:none;}
.manchly-row{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;margin-top:10px;}
.manchly-row button{background:none;border:none;cursor:pointer;font-family:inherit;color:${theme.charcoal};font-weight:600;padding:0;}
.manchly-row button:hover{color:${theme.accent};}
.manchly-row button:disabled{color:#D1D5DB;cursor:not-allowed;}
.manchly-toast{position:fixed;top:20px;right:20px;z-index:100000;max-width:340px;
  background:#fff;border:1px solid ${theme.border};border-radius:16px;padding:12px 16px;
  box-shadow:0 15px 35px -10px rgba(0,0,0,.2);font-size:.85rem;font-family:system-ui,sans-serif;
  opacity:0;transform:translateX(20px);transition:all .25s ease;}
.manchly-toast.manchly-show{opacity:1;transform:translateX(0);}
.manchly-toast-ok{border-left:4px solid ${theme.success};}
.manchly-toast-err{border-left:4px solid ${theme.danger};}

/* Account widget */
.manchly-account{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:.88rem;color:${theme.text};}
.manchly-account-avatar{width:32px;height:32px;border-radius:50%;background:${theme.accent};color:${theme.charcoal};
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.82rem;flex-shrink:0;overflow:hidden;}
.manchly-account-avatar img{width:100%;height:100%;object-fit:cover;}
.manchly-account-info{display:flex;flex-direction:column;line-height:1.25;min-width:0;}
.manchly-account-info .name{font-weight:700;color:${theme.text};}
.manchly-account-info .email{font-size:.72rem;color:${theme.muted};}
.manchly-account-btn{background:transparent;color:${theme.charcoal};border:1.5px solid ${theme.border};
  padding:7px 14px;border-radius:40px;font-weight:700;font-size:.78rem;cursor:pointer;font-family:inherit;transition:all .15s;}
.manchly-account-btn:hover{border-color:${theme.accent};color:${theme.accent};}
.manchly-account-btn.primary{background:${theme.charcoal};color:white;border-color:${theme.charcoal};}
.manchly-account-btn.primary:hover{background:${theme.accent};color:${theme.charcoal};border-color:${theme.accent};}
.manchly-account-pill{display:inline-flex;align-items:center;gap:6px;background:#D1FAE5;color:#065F46;
  padding:4px 10px;border-radius:30px;font-size:.7rem;font-weight:700;}
.manchly-account-pill::before{content:'';width:6px;height:6px;border-radius:50%;background:#10B981;}

/* My courses list */
.manchly-mycourses{display:flex;flex-direction:column;gap:10px;}
.manchly-mycourse{display:flex;align-items:center;gap:14px;padding:12px 14px;background:#fff;border:1px solid ${theme.border};
  border-radius:14px;cursor:pointer;transition:all .15s;text-decoration:none;color:${theme.text};}
.manchly-mycourse:hover{border-color:${theme.accent};transform:translateX(2px);box-shadow:0 8px 20px -8px rgba(0,0,0,.08);}
.manchly-mycourse-thumb{width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,${theme.accent},${theme.accentDark});
  display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;flex-shrink:0;overflow:hidden;}
.manchly-mycourse-thumb img{width:100%;height:100%;object-fit:cover;}
.manchly-mycourse-body{flex:1;min-width:0;}
.manchly-mycourse-body .t{font-weight:700;font-size:.92rem;color:${theme.text};margin:0 0 2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.manchly-mycourse-body .s{font-size:.75rem;color:${theme.muted};}
.manchly-mycourse-pill{background:#D1FAE5;color:#065F46;padding:3px 9px;border-radius:30px;font-size:.65rem;font-weight:800;flex-shrink:0;}
.manchly-mycourses-empty{text-align:center;padding:28px 16px;color:${theme.muted};font-size:.88rem;
  border:1.5px dashed ${theme.border};border-radius:14px;}

/* Thank-you overlay (shown on creator domain after successful payment) */
.manchly-thanks-overlay{position:fixed;inset:0;background:linear-gradient(135deg,#FEFCE8 0%,#F9FAFB 100%);
  display:flex;align-items:center;justify-content:center;padding:20px;z-index:100001;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  animation:manchly-fade .3s ease-out;}
@keyframes manchly-fade{from{opacity:0}to{opacity:1}}
.manchly-thanks-card{background:#fff;border-radius:28px;box-shadow:0 25px 60px -15px rgba(0,0,0,.15);
  padding:48px 40px;max-width:480px;width:100%;text-align:center;animation:manchly-slide .5s ease-out;}
@keyframes manchly-slide{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.manchly-thanks-icon{width:90px;height:90px;background:#D1FAE5;color:#065F46;border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-size:2.4rem;margin:0 auto 24px;
  animation:manchly-pop .6s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes manchly-pop{0%{transform:scale(0)}100%{transform:scale(1)}}
.manchly-thanks-icon svg{width:44px;height:44px;stroke:#065F46;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round;}
.manchly-thanks-card h1{font-size:1.8rem;font-weight:800;margin:0 0 10px;letter-spacing:-.02em;color:${theme.text};}
.manchly-thanks-card p{color:${theme.muted};font-size:1rem;line-height:1.6;margin:0;}
.manchly-thanks-order{background:#FEFCE8;border:1px solid #FDE68A;border-radius:16px;
  padding:14px 20px;margin:22px 0;text-align:left;}
.manchly-thanks-order .l{font-size:.72rem;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.05em;}
.manchly-thanks-order .v{font-family:monospace;font-size:.82rem;color:${theme.text};margin-top:4px;word-break:break-all;}
.manchly-thanks-btn{display:inline-block;background:${theme.charcoal};color:#fff;padding:14px 36px;
  border-radius:60px;border:none;font-weight:700;cursor:pointer;font-family:inherit;font-size:.95rem;
  margin-top:8px;transition:background .2s;text-decoration:none;}
.manchly-thanks-btn:hover{background:${theme.accent};color:${theme.charcoal};}
`;
    document.head.appendChild(s);
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ---------- UI: Modal + Toast helpers ---------- */
  function mountOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'manchly-overlay';
    const box = document.createElement('div');
    box.className = 'manchly-modal';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('manchly-open'); });
    return { overlay, box, open: () => overlay.classList.add('manchly-open'), close: () => overlay.classList.remove('manchly-open') };
  }

  function showToast(kind, title, msg) {
    const el = document.createElement('div');
    el.className = 'manchly-toast manchly-toast-' + (kind === 'error' ? 'err' : 'ok');
    el.innerHTML = `<div style="font-weight:700;color:#111827;">${escapeHtml(title)}</div>` +
                   (msg ? `<div style="color:#6B7280;margin-top:2px;">${escapeHtml(msg)}</div>` : '');
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('manchly-show'), 10);
    setTimeout(() => { el.classList.remove('manchly-show'); setTimeout(() => el.remove(), 300); }, 4000);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  /* ---------- Auth modal ---------- */
  function renderAuthModal(box, ctx) {
    const state = { step: 'form', email: '', name: '', phone: '', otp: '', resendIn: 0 };
    let resendTimer;

    function render() {
      box.innerHTML = `
        <button class="manchly-close" aria-label="Close">✕</button>
        <h2 class="manchly-title">${state.step === 'form' ? 'Get Started' : 'Verify Your Email'}</h2>
        <p class="manchly-sub">${state.step === 'form'
            ? 'Enter your details to continue.'
            : 'We sent a 6-digit code to <strong>' + escapeHtml(state.email) + '</strong>'}</p>
        ${state.step === 'form' ? formHtml() : otpHtml()}
        <div class="manchly-msg" id="manchly-msg"></div>
      `;
      box.querySelector('.manchly-close').onclick = () => ctx.close();
      if (state.step === 'form') bindForm();
      else bindOtp();
    }

    function formHtml() {
      return `
        <form id="m-form">
          <label class="manchly-label">Full Name</label>
          <input class="manchly-input" id="m-name" type="text" placeholder="John Doe" value="${escapeHtml(state.name)}" required>
          <label class="manchly-label">Email Address</label>
          <input class="manchly-input" id="m-email" type="email" placeholder="you@example.com" value="${escapeHtml(state.email)}" required>
          <label class="manchly-label">Phone Number</label>
          <input class="manchly-input" id="m-phone" type="tel" placeholder="+91 98765 43210" value="${escapeHtml(state.phone)}" required>
          <button type="submit" class="manchly-btn" id="m-submit">Continue</button>
        </form>`;
    }

    function otpHtml() {
      return `
        <form id="m-otp-form">
          <label class="manchly-label">Enter 6-Digit OTP</label>
          <input class="manchly-input" id="m-otp" type="text" inputmode="numeric" maxlength="6"
                 placeholder="••••••" style="text-align:center;letter-spacing:.4em;font-family:monospace;font-size:1.1rem;" autofocus>
          <button type="submit" class="manchly-btn" id="m-verify">Verify &amp; Continue</button>
          <div class="manchly-row">
            <button type="button" id="m-back">← Change details</button>
            <button type="button" id="m-resend" ${state.resendIn > 0 ? 'disabled' : ''}>
              ${state.resendIn > 0 ? 'Resend in ' + state.resendIn + 's' : 'Resend OTP'}
            </button>
          </div>
        </form>`;
    }

    function msg(text, type) {
      const el = box.querySelector('#manchly-msg');
      if (!el) return;
      el.className = 'manchly-msg manchly-on manchly-' + (type === 'success' ? 'ok' : 'err');
      el.textContent = text;
    }

    function bindForm() {
      box.querySelector('#m-form').onsubmit = async (e) => {
        e.preventDefault();
        state.name = box.querySelector('#m-name').value.trim();
        state.email = box.querySelector('#m-email').value.trim().toLowerCase();
        state.phone = box.querySelector('#m-phone').value.trim();
        if (!state.name || !state.email || !state.phone) { msg('Please fill all fields.', 'error'); return; }
        const btn = box.querySelector('#m-submit'); btn.disabled = true; btn.textContent = 'Sending OTP...';
        try {
          await ctx.sdk.auth.sendOtp({ name: state.name, email: state.email, phone: state.phone });
          state.step = 'otp';
          state.resendIn = 30;
          render();
          startResendTimer();
          msg('OTP sent to ' + state.email, 'success');
        } catch (err) {
          msg(err.message || 'Failed to send OTP', 'error');
          btn.disabled = false; btn.textContent = 'Continue';
        }
      };
    }

    function bindOtp() {
      box.querySelector('#m-otp-form').onsubmit = async (e) => {
        e.preventDefault();
        const code = box.querySelector('#m-otp').value.trim();
        if (!/^\d{6}$/.test(code)) { msg('Please enter the full 6-digit OTP.', 'error'); return; }
        const btn = box.querySelector('#m-verify'); btn.disabled = true; btn.textContent = 'Verifying...';
        try {
          const res = await ctx.sdk.auth.verifyOtp({ email: state.email, code });
          msg('Logged in!', 'success');
          setTimeout(() => { ctx.close(); ctx.onVerified && ctx.onVerified(res); }, 500);
        } catch (err) {
          box.querySelector('#m-otp').value = '';
          msg(err.message || 'Invalid OTP', 'error');
          btn.disabled = false; btn.textContent = 'Verify & Continue';
        }
      };
      box.querySelector('#m-back').onclick = () => { state.step = 'form'; state.otp = ''; render(); };
      box.querySelector('#m-resend').onclick = async () => {
        if (state.resendIn > 0) return;
        try {
          await ctx.sdk.auth.sendOtp({ name: state.name, email: state.email, phone: state.phone });
          state.resendIn = 30;
          render();
          startResendTimer();
          msg('A new OTP was sent.', 'success');
        } catch (err) { msg(err.message, 'error'); }
      };
    }

    function startResendTimer() {
      clearInterval(resendTimer);
      resendTimer = setInterval(() => {
        state.resendIn--;
        const btn = box.querySelector('#m-resend');
        if (btn) btn.textContent = state.resendIn > 0 ? 'Resend in ' + state.resendIn + 's' : 'Resend OTP';
        if (state.resendIn > 0) { if (btn) btn.disabled = true; }
        else { clearInterval(resendTimer); if (btn) btn.disabled = false; }
      }, 1000);
    }

    render();
  }

  /* ---------- Creator-onboarding modal ---------- */
  function renderCreatorOnboarding(box, ctx) {
    const state = { step: 'form', email: '', phone: '', resendIn: 0 };
    let resendTimer;

    function render() {
      box.innerHTML = `
        <button class="manchly-close" aria-label="Close">✕</button>
        <h2 class="manchly-title">${state.step === 'form' ? 'Connect your creator account' : 'Verify your email'}</h2>
        <p class="manchly-sub">${state.step === 'form'
            ? 'Enter the email and phone you used to sign up as a creator on <strong>manchly.com</strong>. We will send a one-time code to confirm it is you.'
            : 'We sent a 6-digit code to <strong>' + escapeHtml(state.email) + '</strong>'}</p>
        ${state.step === 'form' ? formHtml() : otpHtml()}
        <div class="manchly-msg" id="manchly-msg"></div>
        ${state.step === 'form' ? '<div class="manchly-link">Not a creator yet? <a href="https://manchly.com" target="_blank">Sign up on manchly.com</a> and publish a course first.</div>' : ''}
      `;
      box.querySelector('.manchly-close').onclick = () => ctx.close();
      if (state.step === 'form') bindForm();
      else bindOtp();
    }

    function formHtml() {
      return `
        <form id="c-form">
          <label class="manchly-label">Creator Email</label>
          <input class="manchly-input" id="c-email" type="email" placeholder="you@example.com" value="${escapeHtml(state.email)}" required>
          <label class="manchly-label">Phone Number</label>
          <input class="manchly-input" id="c-phone" type="tel" placeholder="+91 98765 43210" value="${escapeHtml(state.phone)}" required>
          <button type="submit" class="manchly-btn" id="c-submit">Send OTP</button>
        </form>`;
    }

    function otpHtml() {
      return `
        <form id="c-otp-form">
          <label class="manchly-label">Enter 6-Digit OTP</label>
          <input class="manchly-input" id="c-otp" type="text" inputmode="numeric" maxlength="6"
                 placeholder="••••••" style="text-align:center;letter-spacing:.4em;font-family:monospace;font-size:1.1rem;" autofocus>
          <button type="submit" class="manchly-btn" id="c-verify">Verify &amp; Connect</button>
          <div class="manchly-row">
            <button type="button" id="c-back">← Change details</button>
            <button type="button" id="c-resend" ${state.resendIn > 0 ? 'disabled' : ''}>
              ${state.resendIn > 0 ? 'Resend in ' + state.resendIn + 's' : 'Resend OTP'}
            </button>
          </div>
        </form>`;
    }

    function msg(text, type) {
      const el = box.querySelector('#manchly-msg');
      if (!el) return;
      el.className = 'manchly-msg manchly-on manchly-' + (type === 'success' ? 'ok' : 'err');
      el.textContent = text;
    }

    function bindForm() {
      box.querySelector('#c-form').onsubmit = async (e) => {
        e.preventDefault();
        state.email = box.querySelector('#c-email').value.trim().toLowerCase();
        state.phone = box.querySelector('#c-phone').value.trim();
        const btn = box.querySelector('#c-submit');
        btn.disabled = true; btn.textContent = 'Sending OTP...';
        try {
          await ctx.sdk.creator.requestOtp({ email: state.email, phone: state.phone });
          state.step = 'otp';
          state.resendIn = 30;
          render();
          startResendTimer();
          msg('OTP sent to ' + state.email, 'success');
        } catch (err) {
          msg(err.message || 'Could not send OTP', 'error');
          btn.disabled = false; btn.textContent = 'Send OTP';
        }
      };
    }

    function bindOtp() {
      box.querySelector('#c-otp-form').onsubmit = async (e) => {
        e.preventDefault();
        const code = box.querySelector('#c-otp').value.trim();
        if (!/^\d{6}$/.test(code)) { msg('Please enter the full 6-digit OTP.', 'error'); return; }
        const btn = box.querySelector('#c-verify'); btn.disabled = true; btn.textContent = 'Verifying...';
        try {
          const info = await ctx.sdk.creator.verify({ email: state.email, code });
          msg('Connected! Loading your courses…', 'success');
          setTimeout(() => { ctx.close(); ctx.onConnected && ctx.onConnected(info); }, 500);
        } catch (err) {
          box.querySelector('#c-otp').value = '';
          msg(err.message || 'Invalid OTP', 'error');
          btn.disabled = false; btn.textContent = 'Verify & Connect';
        }
      };
      box.querySelector('#c-back').onclick = () => { state.step = 'form'; render(); };
      box.querySelector('#c-resend').onclick = async () => {
        if (state.resendIn > 0) return;
        try {
          await ctx.sdk.creator.requestOtp({ email: state.email, phone: state.phone });
          state.resendIn = 30;
          render();
          startResendTimer();
          msg('A new OTP was sent.', 'success');
        } catch (err) { msg(err.message, 'error'); }
      };
    }

    function startResendTimer() {
      clearInterval(resendTimer);
      resendTimer = setInterval(() => {
        state.resendIn--;
        const btn = box.querySelector('#c-resend');
        if (btn) btn.textContent = state.resendIn > 0 ? 'Resend in ' + state.resendIn + 's' : 'Resend OTP';
        if (state.resendIn > 0) { if (btn) btn.disabled = true; }
        else { clearInterval(resendTimer); if (btn) btn.disabled = false; }
      }, 1000);
    }

    render();
  }

  /* ---------- SDK ---------- */
  function init(userConfig) {
    const cfg = Object.assign({}, DEFAULTS, userConfig || {});
    cfg.theme = Object.assign({}, DEFAULTS.theme, userConfig && userConfig.theme || {});
    if (!cfg.checkoutPage) cfg.checkoutPage = cfg.apiBase + '/pay.html';

    const store = storage(cfg.storagePrefix);
    const bus = emitter();
    injectStyles(cfg.theme);

    // If creatorId wasn't passed, try to recover it from a previous onboarding.
    if (!cfg.creatorId) {
      const saved = store.getCreator();
      if (saved && saved.creator_id) cfg.creatorId = saved.creator_id;
    }

    const http = (path, opts) => httpJson(cfg.apiBase, path, opts, store.getToken, store.deviceId, cfg.timeoutMs);

    const auth = {
      isLoggedIn: () => !!store.getToken(),
      user: () => store.getUser(),
      token: () => store.getToken(),
      logout() { store.clearAuth(); bus.emit('logout'); },
      async sendOtp({ name, email, phone }) {
        const data = await http('/auth/xtech/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, device_id: store.deviceId() }),
        });
        bus.emit('otp:sent', { email });
        return data;
      },
      async verifyOtp({ email, code }) {
        const data = await http('/auth/xtech/verify', {
          method: 'POST',
          body: JSON.stringify({ email, code, device_id: store.deviceId() }),
        });
        const payload = (data && data.data) || data || {};
        if (!payload.token) throw new ManchlyError({ kind: 'unknown', message: 'Login failed — missing token' });
        store.setAuth(payload.token, payload.user);
        bus.emit('login', payload.user);
        return payload;
      },
      openLogin(opts) {
        const m = mountOverlay();
        renderAuthModal(m.box, {
          sdk: { auth },
          close: () => { m.close(); setTimeout(() => m.overlay.remove(), 250); },
          onVerified: (payload) => { (opts && opts.onLogin) && opts.onLogin(payload); },
        });
        m.open();
        return { close: () => m.close() };
      },
    };

    const creator = {
      info() { return store.getCreator(); },
      isConnected() { return !!(cfg.creatorId && store.getCreator()); },
      async requestOtp({ email, phone }) {
        const data = await http('/sdk/creator/request-otp', {
          method: 'POST',
          body: JSON.stringify({ email, phone }),
        });
        bus.emit('creator:otp:sent', { email });
        return data;
      },
      async verify({ email, code }) {
        const data = await http('/sdk/creator/verify', {
          method: 'POST',
          body: JSON.stringify({ email, code }),
        });
        const info = (data && data.data) || data || {};
        if (!info.creator_id) throw new ManchlyError({ kind: 'unknown', message: 'Verification failed' });
        store.setCreator(info);
        cfg.creatorId = info.creator_id;
        bus.emit('creator:connected', info);
        return info;
      },
      disconnect() {
        store.clearCreator();
        cfg.creatorId = null;
        bus.emit('creator:disconnected');
      },
      /** Open the built-in connect modal. Resolves with creator info on success. */
      openOnboarding(opts) {
        opts = opts || {};
        return new Promise((resolve) => {
          const m = mountOverlay();
          renderCreatorOnboarding(m.box, {
            sdk: { creator },
            close: () => { m.close(); setTimeout(() => m.overlay.remove(), 250); resolve(null); },
            onConnected: (info) => { (opts.onConnected) && opts.onConnected(info); resolve(info); },
          });
          m.open();
        });
      },
    };

    // ---- Enrollment cache ----
    // Keeps a local Set of enrolled course IDs so buttons/cards can render
    // synchronously without every component hitting the API.
    let enrollmentSet = new Set();
    let enrollmentsLoaded = false;

    async function refreshEnrollments() {
      if (!auth.isLoggedIn()) {
        enrollmentSet = new Set();
        enrollmentsLoaded = true;
        bus.emit('enrollments:loaded', { courseIds: [] });
        return [];
      }
      try {
        const res = await http('/courses/enrolled/me?page=1&limit=100');
        const items = (res && res.data && res.data.enrollments) || res.enrollments || [];
        const ids = items.map(it => (it.course && it.course.id) || it.course_id || it.id).filter(Boolean);
        enrollmentSet = new Set(ids);
        enrollmentsLoaded = true;
        bus.emit('enrollments:loaded', { courseIds: ids });
        return ids;
      } catch (_) {
        enrollmentsLoaded = true;
        return [];
      }
    }

    function isEnrolledSync(courseId) { return enrollmentSet.has(courseId); }
    function markEnrolled(courseId) {
      if (!enrollmentSet.has(courseId)) {
        enrollmentSet.add(courseId);
        bus.emit('enrollment:added', { courseId });
      }
    }

    // Auto-refresh on auth changes and successful payments.
    bus.on('login', () => refreshEnrollments());
    bus.on('logout', () => { enrollmentSet = new Set(); bus.emit('enrollments:loaded', { courseIds: [] }); });
    bus.on('enrollment:existing', ({ courseId }) => markEnrolled(courseId));
    bus.on('enrollment:success', (payload) => {
      const id = payload && (payload.enrollment?.course_id || payload.course_id);
      if (id) markEnrolled(id);
    });

    // Prime the cache once at startup (non-blocking).
    if (auth.isLoggedIn()) refreshEnrollments();

    /**
     * mountButton(selectorOrEl, { courseId, enrolledLabel, notEnrolledLabel, onContinue })
     * Renders a smart Enroll / Continue button that auto-switches state.
     * Returns an unmount function.
     */
    function mountButton(target, options) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) { console.warn('[Manchly] mountButton: element not found', target); return () => {}; }
      options = options || {};
      if (!options.courseId) { console.warn('[Manchly] mountButton: courseId is required'); return () => {}; }

      const enrolledLabel    = options.enrolledLabel    || 'Continue Watching';
      const notEnrolledLabel = options.notEnrolledLabel || 'Enroll Now';
      const onContinue       = options.onContinue;

      function render() {
        const enrolled = isEnrolledSync(options.courseId);
        el.textContent = enrolled ? enrolledLabel : notEnrolledLabel;
        el.dataset.manchlyState = enrolled ? 'enrolled' : 'not-enrolled';
      }
      el.onclick = () => {
        if (isEnrolledSync(options.courseId)) {
          if (typeof onContinue === 'function') onContinue(options.courseId);
          else bus.emit('continue:requested', { courseId: options.courseId });
        } else {
          buy(options.courseId);
        }
      };
      render();
      const off1 = bus.on('enrollments:loaded', render);
      const off2 = bus.on('enrollment:added',    render);
      const off3 = bus.on('login',               render);
      const off4 = bus.on('logout',              render);
      return () => { off1(); off2(); off3(); off4(); };
    }

    /**
     * mountAccount(el) — renders a login-state widget.
     * When logged out: shows a "Log in" button.
     * When logged in:  shows avatar + name/email + Logout button.
     */
    function mountAccount(target, options) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) { console.warn('[Manchly] mountAccount: element not found', target); return () => {}; }
      options = options || {};
      el.classList.add('manchly-account');

      function initials(s) {
        return String(s || '?').trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?';
      }
      function render() {
        const u = auth.user();
        if (!u) {
          el.innerHTML = `<button class="manchly-account-btn primary" data-manchly="login">Log in</button>`;
          el.querySelector('[data-manchly="login"]').onclick = () => {
            auth.openLogin({ onLogin: (payload) => {
              if (typeof options.onLogin === 'function') options.onLogin(payload);
            }});
          };
          return;
        }
        const name = u.name || u.email || 'User';
        const avatar = u.profile_image
          ? `<img src="${escapeHtml(u.profile_image)}" alt="">`
          : escapeHtml(initials(name));
        el.innerHTML = `
          <div class="manchly-account-avatar">${avatar}</div>
          <div class="manchly-account-info">
            <span class="name">${escapeHtml(name)}</span>
            ${u.email && u.email !== name ? `<span class="email">${escapeHtml(u.email)}</span>` : ''}
          </div>
          <span class="manchly-account-pill">Logged in</span>
          <button class="manchly-account-btn" data-manchly="logout">Log out</button>`;
        el.querySelector('[data-manchly="logout"]').onclick = () => auth.logout();
      }
      render();
      const off1 = bus.on('login',  render);
      const off2 = bus.on('logout', render);
      return () => { off1(); off2(); };
    }

    /**
     * mountMyCourses(el, { emptyMessage, loginPromptMessage, onCourseClick })
     * Renders the buyer's purchased/enrolled courses.
     */
    function mountMyCourses(target, options) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) { console.warn('[Manchly] mountMyCourses: element not found', target); return () => {}; }
      options = options || {};
      el.classList.add('manchly-mycourses');

      async function render() {
        if (!auth.isLoggedIn()) {
          el.innerHTML = `<div class="manchly-mycourses-empty">
            ${escapeHtml(options.loginPromptMessage || 'Log in to see your purchased courses.')}
          </div>`;
          return;
        }
        el.innerHTML = `<div class="manchly-mycourses-empty">Loading your courses…</div>`;
        try {
          const res = await http('/courses/enrolled/me?page=1&limit=100');
          const items = (res && res.data && res.data.enrollments) || res.enrollments || [];
          if (!items.length) {
            el.innerHTML = `<div class="manchly-mycourses-empty">
              ${escapeHtml(options.emptyMessage || "You haven't enrolled in any course yet.")}
            </div>`;
            return;
          }
          el.innerHTML = items.map(it => {
            const c = it.course || it;
            const id    = c.id || it.course_id;
            const title = c.title || 'Untitled course';
            const creatorName = (c.creator && c.creator.name) || '';
            const thumb = c.thumbnail_url || c.thumbnail || '';
            return `
              <div class="manchly-mycourse" data-id="${escapeHtml(id || '')}">
                <div class="manchly-mycourse-thumb">${thumb ? `<img src="${escapeHtml(thumb)}" alt="">` : '▶'}</div>
                <div class="manchly-mycourse-body">
                  <p class="t">${escapeHtml(title)}</p>
                  <span class="s">${escapeHtml(creatorName)}</span>
                </div>
                <span class="manchly-mycourse-pill">Enrolled</span>
              </div>`;
          }).join('');
          el.querySelectorAll('.manchly-mycourse').forEach(row => {
            row.onclick = () => {
              const id = row.dataset.id;
              if (!id) return;
              if (typeof options.onCourseClick === 'function') options.onCourseClick(id);
              else bus.emit('continue:requested', { courseId: id });
            };
          });
        } catch (err) {
          el.innerHTML = `<div class="manchly-mycourses-empty" style="color:${cfg.theme.danger}">
            ${escapeHtml(err.message || 'Failed to load your courses')}
          </div>`;
        }
      }
      render();
      const off1 = bus.on('login',               render);
      const off2 = bus.on('logout',              render);
      const off3 = bus.on('enrollment:added',    render);
      const off4 = bus.on('enrollments:loaded',  render);
      return () => { off1(); off2(); off3(); off4(); };
    }

    const courses = {
      async listByCreator(opts) {
        // If no creatorId is set and autoPrompt is on (default), show the onboarding modal.
        if (!cfg.creatorId) {
          if (opts && opts.autoPrompt === false) {
            throw new ManchlyError({
              kind: 'not_found',
              message: 'No creator connected. Call sdk.creator.openOnboarding() first.',
            });
          }
          const info = await creator.openOnboarding();
          if (!info) throw new ManchlyError({ kind: 'unauthorized', message: 'Creator onboarding cancelled.' });
        }
        return http('/courses/public?creator_id=' + encodeURIComponent(cfg.creatorId) + '&page=1&limit=50');
      },
      async get(courseId) {
        return http('/courses/' + encodeURIComponent(courseId));
      },
      async myCourses() {
        if (!auth.isLoggedIn()) throw new ManchlyError({ kind: 'unauthorized', message: 'Please log in first.' });
        return http('/courses/enrolled/me?page=1&limit=50');
      },
      async isEnrolled(courseId) {
        if (!auth.isLoggedIn()) return false;
        if (!enrollmentsLoaded) await refreshEnrollments();
        return enrollmentSet.has(courseId);
      },
      isEnrolledSync,
      refreshEnrollments,
    };

    const payments = {
      async createOrder(courseId) {
        if (!auth.isLoggedIn()) throw new ManchlyError({ kind: 'unauthorized', message: 'Please log in first.' });
        return http('/payments/create-order/' + encodeURIComponent(courseId), { method: 'POST' });
      },
    };

    /**
     * Top-level: buy a course. Handles auth → order → redirect to hosted checkout.
     * Pass { onLogin } if you want a callback when login completes (before redirect).
     */
    async function buy(courseId, opts) {
      opts = opts || {};
      if (!courseId) throw new Error('buy(): courseId is required');

      // Prompt login if needed
      if (!auth.isLoggedIn()) {
        return new Promise((resolve, reject) => {
          auth.openLogin({
            onLogin: async () => {
              try {
                opts.onLogin && opts.onLogin();
                const result = await buy(courseId, opts);
                resolve(result);
              } catch (e) { reject(e); }
            },
          });
        });
      }

      try {
        const res = await payments.createOrder(courseId);
        const payload = (res && res.data) || res || {};

        // Free course path
        if (payload.enrollment && !payload.cashfree_order) {
          bus.emit('enrollment:success', payload);
          showToast('ok', 'Enrolled!', 'You now have access to this course.');
          return { free: true, enrollment: payload.enrollment };
        }

        const order = payload.cashfree_order || {};
        const sessionId = order.payment_session_id;
        const orderId = order.order_id;
        const env = (payload.cashfree_env || 'PRODUCTION').toLowerCase();
        const amount = (payload.transaction && payload.transaction.amount) ||
                       (payload.course_details && payload.course_details.price) || '';
        const title = (payload.course_details && payload.course_details.title) || '';
        const bd = payload.pricing_breakdown || {};
        if (!sessionId || !orderId) throw new ManchlyError({ kind: 'unknown', message: 'Could not start payment (missing session id)' });

        const returnTo = (opts.returnTo || (window.location.origin + window.location.pathname));
        const params = new URLSearchParams({
          session_id: sessionId,
          order_id:   orderId,
          env:        env,
          amount:     String(amount),
          title:      title,
          token:      auth.token() || '',
          return_to:  returnTo,
        });
        if (bd.base_price !== undefined)           params.set('base_price',  String(bd.base_price));
        if (bd.gst_amount !== undefined)           params.set('gst',         String(bd.gst_amount));
        if (bd.gst_percent !== undefined)          params.set('gst_percent', String(bd.gst_percent));
        if (bd.platform_fee_amount !== undefined)  params.set('fee',         String(bd.platform_fee_amount));
        if (bd.platform_fee_percent !== undefined) params.set('fee_percent', String(bd.platform_fee_percent));
        var url = cfg.checkoutPage + '?' + params.toString();

        bus.emit('payment:redirect', { url, orderId });
        window.location.href = url;
        return { redirecting: true, orderId };
      } catch (err) {
        // Idempotent recovery — already enrolled?
        if (err && (err.code === 'ALREADY_ENROLLED' || err.kind === 'conflict' ||
                    (err.message || '').toLowerCase().includes('already enrolled'))) {
          bus.emit('enrollment:existing', { courseId });
          showToast('ok', 'Already enrolled', 'You already have access to this course.');
          return { alreadyEnrolled: true };
        }
        showToast('error', "Couldn't start payment", err.message || 'Please try again.');
        bus.emit('payment:error', err);
        throw err;
      }
    }

    /**
     * Handles the redirect back from hosted checkout. Reads ?payment= from URL,
     * cleans it up, and fires events. Call this on every page load (it's safe
     * to call unconditionally — it no-ops without the param).
     */
    function showThankYouOverlay({ orderId, title, amount, currency, onContinue }) {
      const existing = document.getElementById('manchly-thanks');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.id = 'manchly-thanks';
      overlay.className = 'manchly-thanks-overlay';
      const symbol = currency === 'INR' ? '₹' : (currency ? currency + ' ' : '');
      const amountDisplay = amount ? symbol + parseFloat(amount).toFixed(2) : '';
      overlay.innerHTML = `
        <div class="manchly-thanks-card">
          <div class="manchly-thanks-icon">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h1>🎉 Payment Successful!</h1>
          <p>${title ? 'You are now enrolled in <strong>' + escapeHtml(title) + '</strong>.' : 'You are now enrolled.'}</p>
          ${amountDisplay ? '<div class="manchly-thanks-order"><div class="l">Amount Paid</div><div class="v">' + amountDisplay + '</div></div>' : ''}
          ${orderId ? '<div class="manchly-thanks-order"><div class="l">Order ID</div><div class="v">' + escapeHtml(orderId) + '</div></div>' : ''}
          <button class="manchly-thanks-btn" id="manchly-thanks-continue">Continue</button>
        </div>`;
      document.body.appendChild(overlay);
      document.getElementById('manchly-thanks-continue').onclick = () => {
        overlay.remove();
        if (typeof onContinue === 'function') onContinue();
      };
    }

    function handlePaymentReturn(opts) {
      opts = opts || {};
      const p = new URLSearchParams(window.location.search);
      const status = p.get('payment');
      if (!status) return null;
      const orderId  = p.get('order_id');
      const reason   = p.get('reason');
      const amount   = p.get('amount');
      const currency = p.get('currency') || 'INR';
      const title    = p.get('title');
      // Strip payment-related params from URL (keep others).
      const clean = window.location.pathname + (function () {
        const kept = new URLSearchParams();
        p.forEach((v, k) => {
          if (!['payment','order_id','reason','amount','currency','title'].includes(k)) kept.append(k, v);
        });
        const s = kept.toString();
        return s ? '?' + s : '';
      })() + window.location.hash;
      history.replaceState({}, document.title, clean);

      if (status === 'success') {
        bus.emit('payment:success', { orderId, amount, currency, title });
        if (opts.showThankYou !== false) {
          showThankYouOverlay({ orderId, title, amount, currency });
        } else {
          showToast('ok', 'Payment successful', 'You now have access to the course.');
        }
      } else if (status === 'cancelled') {
        bus.emit('payment:cancelled', { orderId });
        showToast('error', 'Payment cancelled', 'You closed the checkout. You can try again anytime.');
      } else if (status === 'failed') {
        bus.emit('payment:failed', { orderId, reason });
        showToast('error', 'Payment failed', reason ? decodeURIComponent(reason) : 'Please try again or use a different method.');
      }
      return { status, orderId, reason, amount, currency, title };
    }

    // Auto-handle return on init (next tick so listeners can bind first)
    setTimeout(handlePaymentReturn, 0);

    return {
      version: '1.4.0',
      config: cfg,
      creator,
      auth,
      courses,
      payments,
      buy,
      mountButton,
      mountAccount,
      mountMyCourses,
      isEnrolledSync,
      refreshEnrollments,
      handlePaymentReturn,
      on: bus.on,
      off: bus.off,
      showToast,
      ManchlyError,
    };
  }

  return { init, ManchlyError };
});
