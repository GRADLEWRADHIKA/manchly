import { Request, Response } from "express";
import prisma from "../prismaClient";
import { chat, safeParseJSON, pickProvider } from "../services/aiService";

/**
 * Shape every endpoint returns:
 *   { provider: "hf" | "openai" | "gemini" | "mock", data: <result>, latency_ms: number }
 *
 * When a model call fails or returns un-parseable JSON, we return a mock result
 * instead of erroring — the frontend always gets something useful to display.
 */

function reply(res: Response, provider: string, data: any, started: number) {
  return res.json({
    provider,
    data,
    latency_ms: Date.now() - started,
  });
}

async function generate(opts: {
  system: string;
  user: string;
  jsonOnly?: boolean;
  maxTokens?: number;
  fallback: any;
}): Promise<{ provider: string; data: any }> {
  try {
    const r = await chat({
      system: opts.system,
      user: opts.user,
      jsonOnly: opts.jsonOnly,
      maxTokens: opts.maxTokens,
    });
    if (r.provider === "mock" || !r.text) {
      return { provider: "mock", data: opts.fallback };
    }
    if (opts.jsonOnly) {
      const parsed = safeParseJSON(r.text);
      if (!parsed) return { provider: r.provider + "+fallback", data: opts.fallback };
      return { provider: r.provider, data: parsed };
    }
    return { provider: r.provider, data: r.text };
  } catch (err: any) {
    console.warn("[ai] generate failed:", err.message);
    return { provider: "mock", data: opts.fallback };
  }
}

export class AIController {
  // GET /ai/health — quick status probe
  static async health(_req: Request, res: Response) {
    const provider = pickProvider();
    return res.json({
      provider,
      configured: provider !== "mock",
      endpoints: [
        // course
        "POST /ai/course/generate-meta",
        "POST /ai/course/enhance",
        "POST /ai/course/quiz",
        "POST /ai/course/landing-copy",
        // webinar
        "POST /ai/webinar/describe",
        "POST /ai/webinar/enhance",
        "POST /ai/webinar/email-series",
        "POST /ai/webinar/social-posts",
        // session
        "POST /ai/expert/bio",
        "POST /ai/session/enhance",
        "POST /ai/session/product-suggestions",
        "POST /ai/session/follow-up-message",
        // chat + general
        "POST /ai/chat/suggest-reply",
        "POST /ai/moderate",
        "POST /ai/lesson/summarize",
      ],
    });
  }

  // POST /ai/course/generate-meta
  // Body: { topic, audience?, level? }
  static async courseGenerateMeta(req: Request, res: Response) {
    const started = Date.now();
    const { topic, audience = "general learners", level = "Beginner" } = req.body || {};
    if (!topic) return res.status(400).json({ error: "topic is required" });

    const result = await generate({
      system: "You are a course strategist for Manchly, a creator-economy platform. Return only a JSON object — no prose, no markdown.",
      user: `Topic: ${topic}
Target audience: ${audience}
Level: ${level}

Generate a course blueprint in this exact JSON shape:
{
  "title": "<<catchy course title under 70 chars>>",
  "description": "<<3-sentence value-prop description>>",
  "tags": ["<<5-7 lowercase one-word tags>>"],
  "outline": [
    { "module": "<<module name>>", "lessons": ["<<lesson 1>>", "<<lesson 2>>", "<<lesson 3>>"] }
  ]
}
Aim for 4 modules with 3-5 lessons each.`,
      jsonOnly: true,
      fallback: {
        title: `Mastering ${topic} — A Practical Guide`,
        description: `A hands-on course that walks ${audience} through ${topic} from the ground up. You'll build real projects, internalize the core ideas, and finish with a portfolio piece you can actually ship.`,
        tags: [String(topic).toLowerCase().replace(/\s+/g, "-"), "practical", "beginner-friendly", "hands-on", "manchly"],
        outline: [
          { module: `Foundations of ${topic}`,    lessons: ["Why this matters", "Core mental model", "Setup & tools"] },
          { module: `Working with ${topic}`,      lessons: ["First real example", "Common patterns", "Debugging mistakes"] },
          { module: `Advanced ${topic}`,          lessons: ["Edge cases", "Optimization", "When NOT to use it"] },
          { module: "Ship your project",          lessons: ["Project brief", "Build session walkthrough", "Polish & publish"] },
        ],
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // POST /ai/webinar/describe
  // Body: { title, audience?, duration_min? }
  static async webinarDescribe(req: Request, res: Response) {
    const started = Date.now();
    const { title, audience = "professionals", duration_min = 60 } = req.body || {};
    if (!title) return res.status(400).json({ error: "title is required" });

    const result = await generate({
      system: "You write copy for Manchly's live webinars. Return only JSON.",
      user: `Webinar title: ${title}
Audience: ${audience}
Duration: ${duration_min} minutes

Return JSON: {
  "description": "<<2-paragraph webinar pitch, punchy, no fluff>>",
  "learning_outcomes": ["<<5 specific outcomes attendees will leave with>>"]
}`,
      jsonOnly: true,
      fallback: {
        description: `Join us for "${title}" — a live ${duration_min}-minute deep-dive built for ${audience}. We cover the strategies that actually move the needle, with worked examples and a live Q&A at the end.\n\nNo theory dumps — every section ends with a takeaway you can apply the same week.`,
        learning_outcomes: [
          `Decide if ${title} is right for your situation`,
          "Understand the underlying mental model",
          "Walk through a real worked example end-to-end",
          "Spot the 3 most common mistakes and how to avoid them",
          "Leave with a concrete next-step checklist",
        ],
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // POST /ai/expert/bio
  // Body: { name, expertise, years_experience?, achievements? }
  static async expertBio(req: Request, res: Response) {
    const started = Date.now();
    const { name, expertise, years_experience, achievements = "" } = req.body || {};
    if (!name || !expertise) {
      return res.status(400).json({ error: "name and expertise are required" });
    }

    const result = await generate({
      system: "You write first-person creator bios for Manchly's expert directory. Return only JSON.",
      user: `Name: ${name}
Expertise: ${expertise}
Years of experience: ${years_experience ?? "not given"}
Achievements / proof: ${achievements || "none provided"}

Return JSON: {
  "headline": "<<one-line tagline under 80 chars>>",
  "bio": "<<2-3 sentence first-person bio. Specific, no buzzwords.>>",
  "suggested_categories": ["<<2-3 categories from: Trading, Business, Marketing, Finance, Design, Tech>>"]
}`,
      jsonOnly: true,
      fallback: {
        headline: `${expertise} mentor — ${years_experience ? `${years_experience}+ years` : "real-world experience"}`,
        bio: `I'm ${name}. I've spent the last ${years_experience || "several"} years working in ${expertise}, and I help people get past the parts that aren't in the textbook. Book a 1-on-1 if you want straight answers to a real problem you're stuck on.`,
        suggested_categories: ["Business", "Tech"],
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // POST /ai/chat/suggest-reply
  // Body: { conversationId, tone? }
  static async chatSuggestReply(req: Request, res: Response) {
    const started = Date.now();
    const { conversationId, tone = "friendly" } = req.body || {};
    if (!conversationId) return res.status(400).json({ error: "conversationId is required" });

    // Pull last 8 messages so the model has context
    const messages = await prisma.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: "desc" },
      take: 8,
      include: { sender: { select: { id: true, name: true } } },
    });
    const transcript = messages.reverse().map(
      (m) => `${m.sender?.name || "user"}: ${m.content}`
    ).join("\n");

    const result = await generate({
      system: "You suggest short, sendable replies for a creator-economy DM. Be concrete, no filler. Return only JSON.",
      user: `Conversation so far:
${transcript || "(no messages yet)"}

Tone: ${tone}

Suggest 3 replies in this JSON shape:
{
  "suggestions": [
    { "text": "<<reply 1 under 200 chars>>", "intent": "<<one of: acknowledge, ask, propose, decline, follow_up>>" },
    { "text": "<<reply 2>>", "intent": "<<...>>" },
    { "text": "<<reply 3>>", "intent": "<<...>>" }
  ]
}`,
      jsonOnly: true,
      fallback: {
        suggestions: [
          { text: "Thanks for reaching out! What are you trying to figure out?",              intent: "ask" },
          { text: "Got it — let me check and get back to you within 24 hours.",              intent: "acknowledge" },
          { text: "Happy to chat. Want to book a 15-min call so we can go deeper?",          intent: "propose" },
        ],
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // POST /ai/moderate
  // Body: { text }
  static async moderate(req: Request, res: Response) {
    const started = Date.now();
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    // Quick local heuristic first — covers the obvious cases without a model call.
    const lower = text.toLowerCase();
    const local = {
      hate:        /\b(slur1|slur2|kill\s+all)\b/.test(lower),
      harassment:  /\b(idiot|loser|worthless|kys)\b/.test(lower),
      sexual:      /\b(nsfw|explicit\s+image)\b/.test(lower),
      violence:    /\b(kill|murder|stab|shoot)\s+(you|him|her|them)\b/.test(lower),
      scam:        /\b(guaranteed\s+returns|free\s+money|click\s+this\s+link)\b/.test(lower),
    };
    const localFlagged = Object.values(local).some(Boolean);
    if (localFlagged) {
      return reply(res, "heuristic", {
        flagged: true,
        categories: local,
        severity: "medium",
        reason: "matched local pattern",
      }, started);
    }

    const result = await generate({
      system: "You are a strict content moderator for a creator-economy platform. Reply with ONLY a JSON object.",
      user: `Text to moderate:
"""${text.slice(0, 2000)}"""

Return JSON: {
  "flagged": <<true/false>>,
  "categories": {
    "hate": <<bool>>,
    "harassment": <<bool>>,
    "sexual": <<bool>>,
    "violence": <<bool>>,
    "scam": <<bool>>
  },
  "severity": "<<low | medium | high>>",
  "reason": "<<one short sentence>>"
}`,
      jsonOnly: true,
      fallback: {
        flagged: false,
        categories: { hate: false, harassment: false, sexual: false, violence: false, scam: false },
        severity: "low",
        reason: "no concerns detected",
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // ════════════════════════════════════════════════════════════════
  // COURSE — extra endpoints
  // ════════════════════════════════════════════════════════════════

  // POST /ai/course/enhance
  // Body: { text, kind?: "title"|"description"|"lesson_title"|"outcome"|"general", tone? }
  static async courseEnhance(req: Request, res: Response) {
    const started = Date.now();
    const { text, kind = "general", tone = "conversational" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    if (text.trim().length < 3) {
      return res.status(400).json({ error: "text must be at least 3 characters" });
    }

    const kindHint = ({
      title:        "a course title — under 70 chars, outcome-focused, scroll-stopping but not clickbait",
      description:  "a course description — 2-3 sentences, value-first, no jargon",
      lesson_title: "a lesson title — short, action verbs, makes the learner want to click",
      outcome:      "a learning outcome — starts with an action verb, ends with the concrete result",
      general:      "course content — clear, conversational, no filler",
    } as Record<string, string>)[kind] || "course content";

    const result = await generate({
      system: "You are an expert editor for Manchly course creators. You enhance the author's text WITHOUT changing their voice or meaning. Return ONLY JSON.",
      user: `Original text:
"""${text.slice(0, 4000)}"""

Goal: ${kindHint}
Tone: ${tone}

Tighten phrasing, remove filler words, sharpen the hook, and improve readability. Preserve the author's intent and any specific names/numbers they used.

Return JSON: {
  "enhanced": "<<the improved version>>",
  "changes_summary": "<<one short sentence: what you changed and why>>",
  "alternatives": ["<<a punchier variant>>", "<<a more formal variant>>"]
}`,
      jsonOnly: true,
      maxTokens: 700,
      fallback: {
        enhanced: text,
        changes_summary: "No AI key configured on backend — original text returned unchanged.",
        alternatives: [],
      },
    });
    return reply(res, result.provider, { original: text, ...result.data }, started);
  }

  // POST /ai/course/quiz
  // Body: { topic | lesson_text, count? }
  static async courseQuiz(req: Request, res: Response) {
    const started = Date.now();
    const { topic, lesson_text, count = 5 } = req.body || {};
    const subject = lesson_text || topic;
    if (!subject) return res.status(400).json({ error: "topic or lesson_text is required" });
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 10);

    const result = await generate({
      system: "You write quiz questions for online courses. Each question has 4 options, exactly one correct. Return only JSON.",
      user: `Source material:
"""${String(subject).slice(0, 6000)}"""

Generate ${n} multiple-choice questions. Mix recall, application, and edge-case questions.

Return JSON: {
  "questions": [
    {
      "q": "<<question text>>",
      "options": ["<<A>>", "<<B>>", "<<C>>", "<<D>>"],
      "correct_index": <<0..3>>,
      "explanation": "<<one-sentence rationale>>"
    }
  ]
}`,
      jsonOnly: true,
      maxTokens: 1200,
      fallback: {
        questions: Array.from({ length: n }).map((_, i) => ({
          q: `Sample question ${i + 1} about ${topic || "the lesson"}`,
          options: ["Option A", "Option B (correct)", "Option C", "Option D"],
          correct_index: 1,
          explanation: "This is sample explanation text. When AI is configured, real questions appear here.",
        })),
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // POST /ai/course/landing-copy
  // Body: { title, description, price?, audience? }
  static async courseLandingCopy(req: Request, res: Response) {
    const started = Date.now();
    const { title, description = "", price, audience = "professionals" } = req.body || {};
    if (!title) return res.status(400).json({ error: "title is required" });

    const result = await generate({
      system: "You write high-converting course landing-page copy. Concrete, no jargon. Return only JSON.",
      user: `Course title: ${title}
Existing description: ${description || "(none yet)"}
Price: ${price != null ? "₹" + price : "not set"}
Audience: ${audience}

Return JSON: {
  "headline": "<<10-12 word hero headline, outcome-focused>>",
  "sub_headline": "<<one-line clarifying the headline>>",
  "value_bullets": ["<<5 specific outcomes the student gets>>"],
  "faq": [
    { "q": "<<frequently asked question>>", "a": "<<short answer>>" }
  ],
  "cta_button_text": "<<3-5 word CTA>>",
  "social_proof_template": "<<a fillable template like 'Joined by 200+ X who Y'>>"
}
Include 4 FAQ items.`,
      jsonOnly: true,
      maxTokens: 1100,
      fallback: {
        headline: `Master ${title} in weeks, not years`,
        sub_headline: `Built for ${audience} who want results, not just theory.`,
        value_bullets: [
          "A clear mental model you can apply day one",
          "Real worked examples — no toy projects",
          "The exact mistakes that waste months, and how to dodge them",
          "Lifetime access — revisit any lesson",
          "Direct creator chat for stuck moments",
        ],
        faq: [
          { q: "Do I need prior experience?", a: "No — we start from first principles." },
          { q: "How long is the course?", a: "About 6 hours of video, spread across self-paced modules." },
          { q: "Is there a refund policy?", a: "7-day no-questions-asked refund." },
          { q: "Will I get a certificate?", a: "Yes, on completion." },
        ],
        cta_button_text: "Enroll now",
        social_proof_template: `Joined by 200+ ${audience} building their edge in ${title.toLowerCase()}`,
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // ════════════════════════════════════════════════════════════════
  // WEBINAR — extra endpoints
  // ════════════════════════════════════════════════════════════════

  // POST /ai/webinar/enhance
  // Body: { text, kind?: "title"|"description"|"outcome"|"social_blurb"|"general", tone? }
  static async webinarEnhance(req: Request, res: Response) {
    const started = Date.now();
    const { text, kind = "general", tone = "punchy" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    if (text.trim().length < 3) {
      return res.status(400).json({ error: "text must be at least 3 characters" });
    }

    const kindHint = ({
      title:        "a webinar title — under 70 chars, makes someone stop scrolling and read",
      description:  "a webinar description — 2 short paragraphs, urgent yet credible",
      outcome:      "a learning outcome — specific, measurable, leaves no doubt about what attendees get",
      social_blurb: "a social-media blurb — under 280 chars, designed to drive signups",
      general:      "webinar copy — punchy, no fluff, ends with momentum",
    } as Record<string, string>)[kind] || "webinar copy";

    const result = await generate({
      system: "You are an expert webinar copywriter for Manchly. You enhance the author's text WITHOUT changing their voice or meaning. Return ONLY JSON.",
      user: `Original text:
"""${text.slice(0, 4000)}"""

Goal: ${kindHint}
Tone: ${tone}

Make it scroll-stopping. Strengthen the hook, cut every filler word, surface the outcome up front. Preserve specific names, numbers, and dates exactly.

Return JSON: {
  "enhanced": "<<the improved version>>",
  "changes_summary": "<<one short sentence>>",
  "alternatives": ["<<contrarian-angle variant>>", "<<urgency-angle variant>>"]
}`,
      jsonOnly: true,
      maxTokens: 700,
      fallback: {
        enhanced: text,
        changes_summary: "No AI key configured on backend — original text returned unchanged.",
        alternatives: [],
      },
    });
    return reply(res, result.provider, { original: text, ...result.data }, started);
  }

  // POST /ai/webinar/email-series
  // Body: { title, scheduled_at, join_url? }
  static async webinarEmailSeries(req: Request, res: Response) {
    const started = Date.now();
    const { title, scheduled_at, join_url = "{{join_url}}" } = req.body || {};
    if (!title || !scheduled_at) {
      return res.status(400).json({ error: "title and scheduled_at are required" });
    }

    const result = await generate({
      system: "You write conversion-focused webinar emails. Short, no fluff. Return only JSON.",
      user: `Webinar title: ${title}
Scheduled at (ISO): ${scheduled_at}
Join URL placeholder: ${join_url}

Return JSON with 4 emails: {
  "confirmation":   { "subject": "<<...>>", "body": "<<plain text body>>" },
  "reminder_24hr":  { "subject": "<<...>>", "body": "<<...>>" },
  "reminder_6hr":   { "subject": "<<...>>", "body": "<<...>>" },
  "post_webinar":   { "subject": "<<...>>", "body": "<<...>>" }
}
Each body is under 120 words. Include the join URL exactly as given where it makes sense.`,
      jsonOnly: true,
      maxTokens: 1200,
      fallback: {
        confirmation: {
          subject: `You're in — "${title}"`,
          body: `Thanks for signing up for "${title}".\n\nYou'll get reminders before we go live. Save your seat link: ${join_url}\n\nSee you there.`,
        },
        reminder_24hr: {
          subject: `Tomorrow: "${title}"`,
          body: `Quick reminder — "${title}" starts in 24 hours.\n\nBlock 60 minutes in your calendar. Link: ${join_url}\n\nBring one specific question you want answered.`,
        },
        reminder_6hr: {
          subject: `Today at the scheduled time`,
          body: `"${title}" goes live in a few hours.\n\nJoin: ${join_url}\n\nGet here on time — the first 10 minutes set up the rest of the session and we won't recap.`,
        },
        post_webinar: {
          subject: `Recording + next steps`,
          body: `Thanks for joining "${title}".\n\nReplay link will land in your inbox within 24 hours. Reply to this email with one specific question — I read every reply.\n\nKeep building.`,
        },
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // POST /ai/webinar/social-posts
  // Body: { title, description?, scheduled_at?, register_url? }
  static async webinarSocialPosts(req: Request, res: Response) {
    const started = Date.now();
    const { title, description = "", scheduled_at = "", register_url = "{{register_url}}" } = req.body || {};
    if (!title) return res.status(400).json({ error: "title is required" });

    const result = await generate({
      system: "You write platform-native social posts to drive webinar signups. Return only JSON.",
      user: `Webinar: ${title}
Description: ${description || "(none)"}
Scheduled at: ${scheduled_at || "(soon)"}
Register URL: ${register_url}

Return JSON: {
  "twitter":   { "thread": ["<<tweet 1 under 270 chars>>", "<<tweet 2>>", "<<tweet 3>>"] },
  "linkedin":  { "post": "<<linkedin post, 800-1200 chars, line breaks ok>>" },
  "instagram": { "caption": "<<insta caption with 3-5 hashtags>>" },
  "whatsapp":  { "broadcast": "<<short whatsapp broadcast, under 400 chars, with the register link>>" }
}`,
      jsonOnly: true,
      maxTokens: 1000,
      fallback: {
        twitter: {
          thread: [
            `New webinar: ${title}.\n\nLive, free, and focused on the parts nobody else covers.\n\nThread on what we'll cover ↓`,
            `What you'll actually walk away with:\n• A clear mental model\n• One worked example\n• The 3 mistakes that waste months`,
            `Limited seats. Save yours: ${register_url}`,
          ],
        },
        linkedin: {
          post: `Hosting a live session: "${title}".\n\nMost content on this topic stays surface-level. This is the opposite — we go deep on one specific angle and you leave with something you can apply the same week.\n\nFree to attend. ${scheduled_at ? "Date: " + scheduled_at : ""}\n\nRegister: ${register_url}`,
        },
        instagram: {
          caption: `🎙 Going live with "${title}".\n\nIf you've been stuck on this — block the time and come with one question.\n\nLink in bio · ${register_url}\n\n#manchly #creatoreconomy #liveworkshop #learning #india`,
        },
        whatsapp: {
          broadcast: `Live session this week: "${title}". Free, real talk, no recordings. Save your seat → ${register_url}`,
        },
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // ════════════════════════════════════════════════════════════════
  // SESSION — extra endpoints
  // ════════════════════════════════════════════════════════════════

  // POST /ai/session/enhance
  // Body: { text, kind?: "headline"|"bio"|"product_title"|"product_blurb"|"message"|"general", tone? }
  static async sessionEnhance(req: Request, res: Response) {
    const started = Date.now();
    const { text, kind = "general", tone = "warm" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    if (text.trim().length < 3) {
      return res.status(400).json({ error: "text must be at least 3 characters" });
    }

    const kindHint = ({
      headline:      "an expert headline — under 80 chars, names the niche + the outcome",
      bio:           "an expert bio — first-person, 2-3 sentences, specific (no buzzwords)",
      product_title: "a consulting product title — 7-10 words, action-oriented, names the outcome",
      product_blurb: "a one-sentence product blurb that makes a buyer want to book",
      message:       "a message to a learner — direct, warm, no filler",
      general:       "session copy — specific, warm, no jargon",
    } as Record<string, string>)[kind] || "session copy";

    const result = await generate({
      system: "You are an expert copy editor for Manchly creators offering 1-on-1 sessions. You enhance the author's text WITHOUT changing their voice or meaning. Return ONLY JSON.",
      user: `Original text:
"""${text.slice(0, 4000)}"""

Goal: ${kindHint}
Tone: ${tone}

Make it more specific, cut buzzwords, replace generic claims with concrete details where possible. Preserve names, years of experience, and any numbers the author included.

Return JSON: {
  "enhanced": "<<the improved version>>",
  "changes_summary": "<<one short sentence>>",
  "alternatives": ["<<warmer variant>>", "<<more professional variant>>"]
}`,
      jsonOnly: true,
      maxTokens: 700,
      fallback: {
        enhanced: text,
        changes_summary: "No AI key configured on backend — original text returned unchanged.",
        alternatives: [],
      },
    });
    return reply(res, result.provider, { original: text, ...result.data }, started);
  }

  // POST /ai/session/product-suggestions
  // Body: { expert_headline, expert_bio?, category?, count? }
  static async sessionProductSuggestions(req: Request, res: Response) {
    const started = Date.now();
    const { expert_headline, expert_bio = "", category = "", count = 4 } = req.body || {};
    if (!expert_headline) return res.status(400).json({ error: "expert_headline is required" });
    const n = Math.min(Math.max(parseInt(count) || 4, 1), 6);

    const result = await generate({
      system: "You design productized consulting offers for expert creators on Manchly. Return only JSON.",
      user: `Expert headline: ${expert_headline}
Bio: ${expert_bio || "(none)"}
Category: ${category || "(unspecified)"}

Design ${n} distinct consulting products. Mix audio vs video, short vs long. Pricing should be realistic for the Indian creator market (₹).

Return JSON: {
  "products": [
    {
      "title": "<<7-10 word product title>>",
      "duration_min": <<integer: 15 | 30 | 45 | 60>>,
      "type": "<<audio | video>>",
      "suggested_price_inr": <<integer>>,
      "blurb": "<<one-sentence what's-in-it-for-the-buyer>>",
      "ideal_for": "<<one-sentence who this is for>>"
    }
  ]
}`,
      jsonOnly: true,
      maxTokens: 900,
      fallback: {
        products: [
          { title: "15-min Quick Audio Check-in",     duration_min: 15, type: "audio", suggested_price_inr: 499,  blurb: "One specific question, one direct answer. No fluff.",                     ideal_for: "You have a single blocker and need a fast second opinion." },
          { title: "30-min Strategy Review",          duration_min: 30, type: "video", suggested_price_inr: 1499, blurb: "Share your plan; leave with 3 prioritized next moves.",                   ideal_for: "You have a draft strategy and want it pressure-tested." },
          { title: "60-min Deep Dive",                duration_min: 60, type: "video", suggested_price_inr: 2799, blurb: "Full problem walk-through with a written summary after.",               ideal_for: "You're stuck on a multi-part problem that needs unblocking." },
          { title: "45-min Portfolio / Work Review",  duration_min: 45, type: "video", suggested_price_inr: 1999, blurb: "Live review of your actual work with line-by-line feedback.",            ideal_for: "You want senior eyes on the thing you're about to ship." },
        ].slice(0, n),
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // POST /ai/session/follow-up-message
  // Body: { session_id?, learner_name?, product_title?, action_items?, tone? }
  // session_id (if provided) overrides the other fields by DB lookup.
  static async sessionFollowUpMessage(req: Request, res: Response) {
    const started = Date.now();
    let { session_id, learner_name, product_title, action_items = [], tone = "warm" } = req.body || {};

    if (session_id) {
      const s = await prisma.sessions.findUnique({ where: { id: session_id } });
      if (s) {
        const caller = await prisma.users.findUnique({
          where: { id: s.caller_id }, select: { name: true },
        });
        learner_name = learner_name || caller?.name;
        product_title = product_title || `${s.mode} session`;
      }
    }

    if (!learner_name) return res.status(400).json({ error: "learner_name (or a valid session_id) is required" });

    const items = Array.isArray(action_items) ? action_items.filter(Boolean) : [];

    const result = await generate({
      system: "You write post-session follow-up messages for expert mentors. Specific, no boilerplate. Return only JSON.",
      user: `Learner name: ${learner_name}
Product: ${product_title || "1-on-1 session"}
Action items discussed: ${items.length ? items.map((x: string) => "- " + x).join("\n") : "(none provided)"}
Tone: ${tone}

Return JSON: {
  "subject": "<<email subject>>",
  "body": "<<message body, 80-150 words, conversational, references the action items if given>>",
  "signoff": "<<short signoff line>>",
  "next_step_cta": "<<one-line invite to book again or share work>>"
}`,
      jsonOnly: true,
      maxTokens: 700,
      fallback: {
        subject: `Following up on our call, ${learner_name}`,
        body: `Hey ${learner_name},\n\nQuick note after our session — here's what we landed on:${
          items.length
            ? "\n\n" + items.map((x: string) => "• " + x).join("\n")
            : "\n\n• The next step is to ship the smallest version of what we discussed and bring it back for review."
        }\n\nDon't overthink the next move. Pick the smallest one and ship it this week.\n\nReply to this and tell me what you ended up doing — I read every reply.`,
        signoff: "Cheering you on,",
        next_step_cta: "Book a follow-up once you've shipped — first review on that work is on me.",
      },
    });
    return reply(res, result.provider, result.data, started);
  }

  // ════════════════════════════════════════════════════════════════
  // LESSON SUMMARIZE — existing endpoint continues below
  // ════════════════════════════════════════════════════════════════

  // POST /ai/lesson/summarize
  // Body: { text }
  static async lessonSummarize(req: Request, res: Response) {
    const started = Date.now();
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    if (text.length < 80) {
      return res.status(400).json({ error: "text must be at least 80 characters" });
    }

    const result = await generate({
      system: "You summarize lesson transcripts for Manchly's mobile app. Return only JSON.",
      user: `Transcript / lesson text:
"""${text.slice(0, 12000)}"""

Return JSON: {
  "summary": "<<3-sentence overview>>",
  "key_points": ["<<5-7 bullet takeaways, each under 100 chars>>"],
  "duration_estimate_min": <<integer estimate based on word count ~ 150 wpm>>
}`,
      jsonOnly: true,
      fallback: {
        summary: "This lesson covers the core concept, walks through a worked example, and ends with practical next steps. The instructor focuses on real-world application over theory and highlights common mistakes to avoid.",
        key_points: [
          "Start with the underlying mental model before any tactics",
          "Worked example shows the end-to-end flow",
          "Common mistake #1 to avoid",
          "Common mistake #2 to avoid",
          "Concrete action you can take this week",
        ],
        duration_estimate_min: Math.max(2, Math.round(text.split(/\s+/).length / 150)),
      },
    });
    return reply(res, result.provider, result.data, started);
  }
}
