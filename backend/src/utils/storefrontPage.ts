/**
 * Server-rendered creator storefront for <handle>.manchly.com.
 *
 * Rendered on the server rather than shipped as an SPA for one reason that
 * matters commercially: a creator's link gets pasted into WhatsApp and
 * Instagram, and those crawlers read the HTML they are served. A client-side
 * app would give every creator the same blank preview.
 *
 * Everything interpolated here except the markup itself is creator-authored,
 * so it all goes through escapeHtml.
 */

const APP_BASE = (process.env.APP_BASE_URL || "https://dashboard.manchly.com").replace(/\/$/, "");
const ROOT_DOMAIN = process.env.STOREFRONT_ROOT_DOMAIN || "manchly.com";

/** Escape for HTML text and quoted attribute values. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow http(s) URLs through — a creator-supplied javascript: link would
 *  otherwise become stored XSS the moment a visitor clicks it. */
function safeUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) return null;
  return escapeHtml(raw);
}

function inr(amount: unknown): string {
  const n = Number(amount ?? 0);
  return n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`;
}

function formatWhen(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    hour12: true, timeZone: "Asia/Kolkata",
  });
}

/** Readable text colour for a given background, so a creator picking a pale
 *  accent does not end up with white-on-yellow buttons. */
function contrastInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return "#3A2A00";
  const int = parseInt(m[1], 16);
  const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  // Rec. 709 luma
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? "#1a1a1a" : "#ffffff";
}

function sanitizeAccent(value: unknown): string {
  const raw = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : "#FFC107";
}

interface StorefrontData {
  creator: any;
  courses: any[];
  webinars: any[];
  sessions: any[];
}

export function renderStorefront(data: StorefrontData): string {
  const { creator, courses, webinars, sessions } = data;

  const accent = sanitizeAccent(creator.accent_color);
  const ink = contrastInk(accent);
  const name = escapeHtml(creator.name || creator.handle);
  const handle = escapeHtml(creator.handle);
  const tagline = escapeHtml(creator.tagline || "");
  const bio = escapeHtml(creator.bio || "");
  const url = `https://${handle}.${ROOT_DOMAIN}`;

  const avatar = safeUrl(creator.profile_image);
  const cover = safeUrl(creator.cover_image);

  // What a link preview shows. Falls back through the creator's own imagery.
  const ogImage = cover || avatar || null;
  const description = tagline || bio ||
    `${name} on Manchly — ${courses.length} courses, ${webinars.length} webinars, ${sessions.length} 1:1 sessions.`;

  const socials = [
    ["Website", safeUrl(creator.socials?.website)],
    ["Instagram", safeUrl(creator.socials?.instagram)],
    ["YouTube", safeUrl(creator.socials?.youtube)],
    ["LinkedIn", safeUrl(creator.socials?.linkedin)],
    ["X", safeUrl(creator.socials?.twitter)],
  ].filter(([, href]) => href) as [string, string][];

  const isEmpty = !courses.length && !webinars.length && !sessions.length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} · Manchly</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">

<meta property="og:type" content="profile">
<meta property="og:title" content="${name} · Manchly">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${name} · Manchly">
<meta name="twitter:description" content="${escapeHtml(description)}">
${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ""}

<link rel="icon" type="image/svg+xml" href="https://server.${ROOT_DOMAIN}/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --accent:${accent}; --ink:${ink};
    --bg:#F6F7F9; --surface:#fff; --border:#E9ECF0; --border-soft:#F1F3F6;
    --text:#111827; --text-mid:#4B5563; --text-soft:#8A919E;
    --radius:16px; --shadow:0 1px 3px rgba(16,24,40,.06);
    --shadow-md:0 8px 28px rgba(16,24,40,.10);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);
    font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:1080px;margin:0 auto;padding:0 20px}

  /* ── hero ── */
  .cover{height:220px;background:${cover ? `url('${cover}') center/cover no-repeat` : `linear-gradient(120deg,var(--accent),#ffffff 140%)`}}
  .hero{margin-top:-64px;padding-bottom:34px}
  .hero-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
    box-shadow:var(--shadow-md);padding:26px}
  .avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;border:4px solid var(--surface);
    margin-top:-70px;background:var(--accent);display:grid;place-items:center;
    font-size:36px;font-weight:800;color:var(--ink)}
  h1{margin:14px 0 4px;font-size:1.85rem;font-weight:800;letter-spacing:-.02em}
  .handle{color:var(--text-soft);font-size:.9rem;font-weight:600}
  .tagline{margin:10px 0 0;font-size:1.05rem;color:var(--text-mid);font-weight:600}
  .bio{margin:12px 0 0;color:var(--text-mid);line-height:1.62;max-width:62ch}
  .socials{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
  .chip{border:1px solid var(--border);border-radius:999px;padding:7px 14px;font-size:.8125rem;
    font-weight:600;color:var(--text-mid);background:var(--surface);transition:.15s}
  .chip:hover{border-color:var(--accent);color:var(--text)}
  .stats{display:flex;gap:26px;margin-top:20px;padding-top:18px;border-top:1px solid var(--border-soft)}
  .stat b{display:block;font-size:1.25rem;font-weight:800}
  .stat span{font-size:.75rem;color:var(--text-soft);text-transform:uppercase;letter-spacing:.06em}

  /* ── sections ── */
  section{padding:34px 0}
  h2{font-size:1.3rem;font-weight:800;letter-spacing:-.01em;margin:0 0 4px}
  .sub{color:var(--text-soft);font-size:.9rem;margin:0 0 20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:18px}

  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
    overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;transition:.16s}
  .card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);border-color:var(--accent)}
  .thumb{aspect-ratio:16/9;background:var(--border-soft) center/cover no-repeat;display:grid;place-items:center;
    color:var(--text-soft);font-size:.8rem}
  .card-body{padding:15px;display:flex;flex-direction:column;gap:8px;flex:1}
  .card h3{margin:0;font-size:1rem;font-weight:700;line-height:1.35}
  .meta{font-size:.8rem;color:var(--text-soft)}
  .desc{font-size:.85rem;color:var(--text-mid);line-height:1.5;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding-top:6px}
  .price{font-weight:800;font-size:1.02rem}
  .btn{background:var(--accent);color:var(--ink);border:none;border-radius:10px;
    padding:9px 16px;font-weight:700;font-size:.875rem;cursor:pointer;white-space:nowrap;
    font-family:inherit;display:inline-block}
  .btn:hover{filter:brightness(.95)}
  .badge{display:inline-block;background:var(--border-soft);color:var(--text-mid);
    border-radius:999px;padding:3px 9px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}

  .empty{background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius);
    padding:52px 20px;text-align:center;color:var(--text-soft)}

  footer{border-top:1px solid var(--border);margin-top:26px;padding:26px 0 40px;text-align:center;
    color:var(--text-soft);font-size:.85rem}
  footer a{font-weight:700;color:var(--text-mid)}

  @media(max-width:600px){
    .cover{height:150px}
    .stats{gap:18px;flex-wrap:wrap}
    h1{font-size:1.5rem}
    .grid{grid-template-columns:1fr}
  }
</style>
</head>
<body>
  <div class="cover"></div>

  <div class="wrap hero">
    <div class="hero-card">
      ${avatar
        ? `<img class="avatar" src="${avatar}" alt="${name}">`
        : `<div class="avatar">${escapeHtml((creator.name || creator.handle || "?").charAt(0).toUpperCase())}</div>`}
      <h1>${name}</h1>
      <div class="handle">${url.replace(/^https:\/\//, "")}</div>
      ${tagline ? `<p class="tagline">${tagline}</p>` : ""}
      ${bio ? `<p class="bio">${bio}</p>` : ""}
      ${socials.length ? `<div class="socials">${socials.map(([label, href]) =>
        `<a class="chip" href="${href}" target="_blank" rel="noopener nofollow">${label}</a>`).join("")}</div>` : ""}
      <div class="stats">
        <div class="stat"><b>${courses.length}</b><span>Courses</span></div>
        <div class="stat"><b>${webinars.length}</b><span>Webinars</span></div>
        <div class="stat"><b>${sessions.length}</b><span>1:1 Sessions</span></div>
      </div>
    </div>
  </div>

  <div class="wrap">
    ${isEmpty ? `<div class="empty">${name} hasn't published anything yet — check back soon.</div>` : ""}

    ${courses.length ? `
    <section id="courses">
      <h2>Courses</h2>
      <p class="sub">Learn at your own pace, lifetime access.</p>
      <div class="grid">
        ${courses.map((c) => {
          const thumb = safeUrl(c.thumbnail_url) || safeUrl(c.thumbnail);
          return `<article class="card">
            <div class="thumb" ${thumb ? `style="background-image:url('${thumb}')"` : ""}>${thumb ? "" : "No cover"}</div>
            <div class="card-body">
              ${c.category ? `<span class="badge">${escapeHtml(c.category)}</span>` : ""}
              <h3>${escapeHtml(c.title)}</h3>
              ${c.description ? `<p class="desc">${escapeHtml(c.description)}</p>` : ""}
              <div class="meta">${c._count?.videos ?? 0} lessons · ${c._count?.enrollments ?? 0} enrolled</div>
              <div class="card-foot">
                <span class="price">${inr(c.price)}</span>
                <a class="btn" href="${APP_BASE}/app/course/${escapeHtml(c.id)}">Enrol</a>
              </div>
            </div>
          </article>`;
        }).join("")}
      </div>
    </section>` : ""}

    ${webinars.length ? `
    <section id="webinars">
      <h2>Upcoming webinars</h2>
      <p class="sub">Live sessions — seats are limited.</p>
      <div class="grid">
        ${webinars.map((w) => {
          const thumb = safeUrl(w.thumbnail_url) || safeUrl(w.thumbnail);
          return `<article class="card">
            <div class="thumb" ${thumb ? `style="background-image:url('${thumb}')"` : ""}>${thumb ? "" : "No cover"}</div>
            <div class="card-body">
              <span class="badge">${escapeHtml(formatWhen(w.scheduled_at) || "Scheduled")}</span>
              <h3>${escapeHtml(w.title)}</h3>
              ${w.description ? `<p class="desc">${escapeHtml(w.description)}</p>` : ""}
              <div class="meta">${w.duration ? `${escapeHtml(w.duration)} min · ` : ""}${w._count?.enrollments ?? 0} registered</div>
              <div class="card-foot">
                <span class="price">${inr(w.price)}</span>
                <a class="btn" href="${APP_BASE}/app/webinar/${escapeHtml(w.id)}">Register</a>
              </div>
            </div>
          </article>`;
        }).join("")}
      </div>
    </section>` : ""}

    ${sessions.length ? `
    <section id="sessions">
      <h2>Book a 1:1</h2>
      <p class="sub">Talk to ${name} directly.</p>
      <div class="grid">
        ${sessions.map((s) => `<article class="card">
          <div class="card-body">
            <span class="badge">${escapeHtml(String(s.mode) === "VIDEO" ? "Video call" : "Audio call")}</span>
            <h3>${escapeHtml(s.title)}</h3>
            ${s.description ? `<p class="desc">${escapeHtml(s.description)}</p>` : ""}
            <div class="meta">${escapeHtml(s.duration)} minutes</div>
            <div class="card-foot">
              <span class="price">${inr(s.price)}</span>
              <a class="btn" href="${APP_BASE}/app/experts/${escapeHtml(creator.id)}">Book</a>
            </div>
          </div>
        </article>`).join("")}
      </div>
    </section>` : ""}
  </div>

  <footer>
    <div class="wrap">
      Powered by <a href="https://${ROOT_DOMAIN}">Manchly</a>
    </div>
  </footer>
</body>
</html>`;
}

/** Shown for a handle nobody has claimed, and for reserved subdomains. */
export function renderStorefrontNotFound(handle?: string | null): string {
  const h = handle ? escapeHtml(handle) : null;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found · Manchly</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="https://server.${ROOT_DOMAIN}/favicon.svg">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F6F7F9;color:#111827;
    font-family:Inter,system-ui,sans-serif;padding:24px;text-align:center}
  .box{max-width:420px}
  .mark{font-size:2rem;font-weight:800;background:linear-gradient(93deg,#FFC107,#E09B00);
    -webkit-background-clip:text;background-clip:text;color:transparent}
  h1{font-size:1.4rem;margin:22px 0 8px}
  p{color:#6B7280;line-height:1.6;margin:0 0 22px}
  code{background:#F1F3F6;border-radius:6px;padding:2px 7px;font-size:.9em}
  a{display:inline-block;background:linear-gradient(180deg,#FFC107,#FFB300);color:#3A2A00;
    border-radius:10px;padding:11px 22px;font-weight:700;text-decoration:none}
</style>
</head>
<body>
  <div class="box">
    <div class="mark">Manchly</div>
    <h1>This page isn't available</h1>
    <p>${h
      ? `No creator has claimed <code>${h}.${ROOT_DOMAIN}</code> yet.`
      : `We couldn't find the page you're looking for.`}</p>
    <a href="https://${ROOT_DOMAIN}">Go to Manchly</a>
  </div>
</body>
</html>`;
}
