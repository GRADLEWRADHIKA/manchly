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
  fallback: any;
}): Promise<{ provider: string; data: any }> {
  try {
    const r = await chat({ system: opts.system, user: opts.user, jsonOnly: opts.jsonOnly });
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
        "POST /ai/course/generate-meta",
        "POST /ai/webinar/describe",
        "POST /ai/expert/bio",
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
