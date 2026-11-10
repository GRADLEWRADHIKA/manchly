import { Request, Response } from "express";
import TelegramBot, { Message } from "node-telegram-bot-api";
import dotenv from "dotenv";
import prisma from "../prismaClient";
import { cashfreePG } from "../services/cashfreeService";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "ManchlyBot";
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || "";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const USE_WEBHOOK = process.env.NODE_ENV === "production" && !!WEBHOOK_URL;
const USE_MOCK_PAYMENT = process.env.TELEGRAM_USE_MOCK_PAYMENT === "true";
const PUBLIC_BASE_URL = process.env.APP_URL || "http://localhost:8080";

let bot: TelegramBot | null = null;
let botUserId: number | null = null;

type RegisterStep = "AWAITING_FORWARD" | "AWAITING_PRICE" | "AWAITING_DESCRIPTION" | "AWAITING_CONFIRM";

interface RegisterDraft {
  step: RegisterStep;
  channel_id?: string;
  channel_title?: string;
  price_inr?: number;
  description?: string;
}

const drafts = new Map<number, RegisterDraft>();

export function getBot(): TelegramBot {
  if (!bot) throw new Error("Telegram bot not initialized");
  return bot;
}

export async function initTelegramBot(): Promise<void> {
  if (!BOT_TOKEN) {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }

  bot = new TelegramBot(BOT_TOKEN, { polling: !USE_WEBHOOK });

  const me = await bot.getMe();
  botUserId = me.id;

  if (USE_WEBHOOK) {
    const hookUrl = `${WEBHOOK_URL.replace(/\/$/, "")}/telegram/webhook`;
    await bot.setWebHook(hookUrl, { secret_token: WEBHOOK_SECRET || undefined });
    console.log(`🤖 Telegram webhook registered → ${hookUrl}`);
  } else {
    console.log("🤖 Telegram bot started in polling mode");
  }

  registerHandlers(bot);
}

function registerHandlers(b: TelegramBot) {
  b.onText(/^\/start(?:\s+(.+))?$/, (msg, match) => handleStart(b, msg, match?.[1]?.trim()));
  b.onText(/^\/help$/, (msg) => handleHelp(b, msg));
  b.onText(/^\/channels$/, (msg) => handleChannelsList(b, msg));
  b.onText(/^\/register$/, (msg) => handleRegisterStart(b, msg));
  b.onText(/^\/cancel$/, (msg) => handleCancel(b, msg));

  b.on("message", (msg) => routeStateMessage(b, msg));
  b.on("callback_query", (query) => routeCallback(b, query));

  b.on("polling_error", (err) => console.error("Telegram polling error:", err.message));
  b.on("webhook_error", (err) => console.error("Telegram webhook error:", err.message));
}

async function routeCallback(b: TelegramBot, query: TelegramBot.CallbackQuery) {
  if (!query.data) {
    return b.answerCallbackQuery(query.id);
  }
  if (query.data.startsWith("pay_")) {
    return handlePayCallback(b, query);
  }
  return b.answerCallbackQuery(query.id, { text: "Unknown action" });
}

async function handlePayCallback(b: TelegramBot, query: TelegramBot.CallbackQuery) {
  const channelUuid = query.data!.slice("pay_".length);
  const buyerId = query.from.id;
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;

  if (!chatId || !messageId) {
    return b.answerCallbackQuery(query.id, { text: "Invalid message context" });
  }

  const channel = await prisma.telegram_channels.findUnique({ where: { id: channelUuid } });
  if (!channel || channel.status !== "ACTIVE") {
    return b.answerCallbackQuery(query.id, { text: "Channel unavailable.", show_alert: true });
  }

  if (String(buyerId) === channel.creator_telegram_id && process.env.NODE_ENV === "production") {
    return b.answerCallbackQuery(query.id, { text: "You can't buy your own channel.", show_alert: true });
  }

  if (USE_MOCK_PAYMENT) {
    return runMockPayment(b, query, channel, buyerId, chatId, messageId);
  }

  return startCashfreeCheckout(b, query, channel, buyerId, chatId, messageId);
}

async function startCashfreeCheckout(
  b: TelegramBot,
  query: TelegramBot.CallbackQuery,
  channel: any,
  buyerId: number,
  chatId: number,
  messageId: number,
) {
  await b.answerCallbackQuery(query.id, { text: "Creating order…" });

  const orderId = `tg_${channel.id.slice(0, 8)}_${buyerId}_${Date.now()}`;

  let pendingSub;
  try {
    pendingSub = await prisma.telegram_subscriptions.create({
      data: {
        channel_id: channel.id,
        buyer_telegram_id: String(buyerId),
        buyer_username: query.from.username || null,
        amount_inr: channel.price_inr,
        payment_method: "CASHFREE",
        payment_reference: orderId,
        status: "PENDING_PAYMENT",
      },
    });
  } catch (err: any) {
    console.error("create pending sub failed:", err);
    return b.editMessageText(`Couldn't start checkout: ${err.message}`, { chat_id: chatId, message_id: messageId });
  }

  try {
    const orderRequest = {
      order_id: orderId,
      order_amount: channel.price_inr,
      order_currency: "INR",
      customer_details: {
        customer_id: `tg_${buyerId}`,
        customer_phone: "9999999999",
        customer_name: (query.from.first_name || "Telegram User").slice(0, 100),
        customer_email: `telegram_${buyerId}@manchly.com`,
      },
      order_meta: {
        return_url: `${PUBLIC_BASE_URL}/pay.html?order_id={order_id}&return=1`,
        notify_url: `${PUBLIC_BASE_URL}/payments/webhook`,
      },
      order_note: `Telegram channel: ${channel.channel_title}`,
      order_tags: {
        type: "telegram_channel",
        channel_id: channel.id,
        buyer_telegram_id: String(buyerId),
        buyer_chat_id: String(chatId),
      },
    };

    const cashfreeOrder = await cashfreePG.PGCreateOrder(orderRequest as any);
    const sessionId = (cashfreeOrder.data as any)?.payment_session_id;
    if (!sessionId) throw new Error("No payment_session_id from Cashfree");

    const env = process.env.CASHFREE_PG_ENV === "PRODUCTION" ? "production" : "sandbox";
    const params = new URLSearchParams({
      session_id: sessionId,
      order_id: orderId,
      env,
      amount: String(channel.price_inr),
      title: `${channel.channel_title} (Telegram)`,
      return_to: `https://t.me/${BOT_USERNAME}`,
      verify_url: "/telegram/verify",
    });
    const checkoutUrl = `${PUBLIC_BASE_URL}/pay.html?${params.toString()}`;

    const text = [
      `💳 Payment for ${channel.channel_title}`,
      ``,
      `Amount: ₹${channel.price_inr}`,
      ``,
      `Tap the button below to pay securely via Cashfree. After payment you'll be DM'd a one-time invite link.`,
    ].join("\n");

    await b.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [[{ text: `💳 Pay ₹${channel.price_inr} via Cashfree`, url: checkoutUrl }]],
      },
    });
  } catch (err: any) {
    const detail = err?.response?.data?.message || err?.message || String(err);
    console.error("Cashfree order create failed:", detail);
    await prisma.telegram_subscriptions.update({
      where: { id: pendingSub.id },
      data: { status: "FAILED" },
    });
    return b.editMessageText(`Couldn't start checkout: ${detail}`, { chat_id: chatId, message_id: messageId });
  }
}

async function runMockPayment(
  b: TelegramBot,
  query: TelegramBot.CallbackQuery,
  channel: any,
  buyerId: number,
  chatId: number,
  messageId: number,
) {
  await b.answerCallbackQuery(query.id, { text: "Processing payment…" });

  let inviteLink: string;
  try {
    const result = await b.createChatInviteLink(channel.channel_id, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 86400,
    });
    inviteLink = result.invite_link;
  } catch (err: any) {
    console.error("createChatInviteLink failed:", err.message);
    return b.editMessageText(
      `Couldn't generate invite link: ${err.message}\n\nThe creator may have removed me as admin. Contact support.`,
      { chat_id: chatId, message_id: messageId },
    );
  }

  let sub;
  try {
    sub = await prisma.telegram_subscriptions.create({
      data: {
        channel_id: channel.id,
        buyer_telegram_id: String(buyerId),
        buyer_username: query.from.username || null,
        invite_link: inviteLink,
        amount_inr: channel.price_inr,
        payment_method: "MOCK",
        payment_reference: `mock_${Date.now()}`,
        expires_at: new Date(Date.now() + 30 * 86400 * 1000),
      },
    });
  } catch (err: any) {
    console.error("create telegram_subscription error:", err);
    return b.editMessageText(
      `Payment processed but DB save failed: ${err.message}\n\nYour invite link: ${inviteLink}`,
      { chat_id: chatId, message_id: messageId },
    );
  }

  const successText = [
    `✅ Payment successful (simulated)`,
    ``,
    `Channel: ${channel.channel_title}`,
    `Amount: ₹${channel.price_inr}`,
    `Subscription ID: ${sub.id}`,
    ``,
    `Your one-time invite link (expires in 24h, single use):`,
    inviteLink,
  ].join("\n");

  await b.editMessageText(successText, {
    chat_id: chatId,
    message_id: messageId,
    disable_web_page_preview: false,
    reply_markup: {
      inline_keyboard: [[{ text: "🔗 Join Channel", url: inviteLink }]],
    },
  });
}

export async function processTelegramPaymentSuccess(orderId: string, _data: any): Promise<void> {
  const sub = await prisma.telegram_subscriptions.findFirst({
    where: { payment_reference: orderId },
    include: { channel: true },
  });

  if (!sub) {
    console.error(`[telegram] subscription not found for order ${orderId}`);
    return;
  }

  if (sub.status === "ACTIVE" && sub.invite_link) {
    console.log(`[telegram] subscription already active: ${sub.id}`);
    return;
  }

  if (!bot) {
    console.error("[telegram] bot not initialized — cannot fulfill payment");
    return;
  }

  let inviteLink: string;
  try {
    const result = await bot.createChatInviteLink(sub.channel.channel_id, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 86400,
    });
    inviteLink = result.invite_link;
  } catch (err: any) {
    console.error(`[telegram] createChatInviteLink failed for sub ${sub.id}:`, err.message);
    return;
  }

  await prisma.telegram_subscriptions.update({
    where: { id: sub.id },
    data: {
      status: "ACTIVE",
      invite_link: inviteLink,
      expires_at: new Date(Date.now() + 30 * 86400 * 1000),
    },
  });

  try {
    await bot.sendMessage(
      Number(sub.buyer_telegram_id),
      [
        `✅ Payment successful!`,
        ``,
        `Channel: ${sub.channel.channel_title}`,
        `Amount: ₹${sub.amount_inr}`,
        ``,
        `Your one-time invite link (expires in 24h):`,
        inviteLink,
      ].join("\n"),
      {
        disable_web_page_preview: false,
        reply_markup: {
          inline_keyboard: [[{ text: "🔗 Join Channel", url: inviteLink }]],
        },
      },
    );
  } catch (err: any) {
    console.error(`[telegram] failed to DM buyer ${sub.buyer_telegram_id}:`, err.message);
  }
}

export async function processTelegramPaymentFailed(orderId: string, _data: any): Promise<void> {
  const sub = await prisma.telegram_subscriptions.findFirst({ where: { payment_reference: orderId } });
  if (!sub || sub.status !== "PENDING_PAYMENT") return;
  await prisma.telegram_subscriptions.update({ where: { id: sub.id }, data: { status: "FAILED" } });
  if (bot) {
    bot.sendMessage(Number(sub.buyer_telegram_id), `Payment for that channel didn't complete. Tap the sales link again to retry.`)
      .catch((err) => console.error(`[telegram] failed to notify buyer of failure:`, err.message));
  }
}

async function handleStart(b: TelegramBot, msg: Message, payload?: string) {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "there";

  if (payload?.startsWith("channel_")) {
    const channelUuid = payload.slice("channel_".length);
    const channel = await prisma.telegram_channels.findUnique({ where: { id: channelUuid } });

    if (!channel || channel.status !== "ACTIVE") {
      return b.sendMessage(chatId, "That channel link is invalid or no longer available.");
    }

    const card = [
      `🔥 *${escapeMd(channel.channel_title)}*`,
      "",
      channel.description ? escapeMd(channel.description) : "_No description yet._",
      "",
      `💰 Price: ₹${channel.price_inr}`,
      "",
      "_Payment integration coming in milestone 2._",
    ].join("\n");

    return b.sendMessage(chatId, card, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: `💳 Pay ₹${channel.price_inr} & Join`, callback_data: `pay_${channel.id}` }]],
      },
    });
  }

  await b.sendMessage(
    chatId,
    `Welcome to Manchly, ${firstName}!\n\nThis bot lets you pay to join premium Telegram channels run by creators.\n\nCommands:\n/channels — Browse paid channels\n/register — Register your channel (for creators)\n/help — Contact support`,
  );
}

async function handleHelp(b: TelegramBot, msg: Message) {
  await b.sendMessage(
    msg.chat.id,
    "Need help? Email support@manchly.com or visit https://manchly.com/support",
  );
}

async function handleChannelsList(b: TelegramBot, msg: Message) {
  const channels = await prisma.telegram_channels.findMany({
    where: { status: "ACTIVE" },
    orderBy: { created_at: "desc" },
    take: 10,
  });

  if (channels.length === 0) {
    return b.sendMessage(msg.chat.id, "No paid channels live yet. Be the first creator — send /register.");
  }

  const lines = channels.map((c, i) => `${i + 1}. *${escapeMd(c.channel_title)}* — ₹${c.price_inr}/month`);
  await b.sendMessage(
    msg.chat.id,
    `*Available channels:*\n\n${lines.join("\n")}\n\nTap a creator's sales link to subscribe.`,
    { parse_mode: "Markdown" },
  );
}

async function handleRegisterStart(b: TelegramBot, msg: Message) {
  const userId = msg.from?.id;
  if (!userId) return;

  drafts.set(userId, { step: "AWAITING_FORWARD" });

  await b.sendMessage(
    msg.chat.id,
    [
      "*Register your paid channel* (1 of 4)",
      "",
      "First — make sure @" + BOT_USERNAME + " is an *admin* of your private channel with the *\"Invite Users via Link\"* permission enabled.",
      "",
      "Then forward me any message from that channel.",
      "",
      "Send /cancel anytime to abort.",
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}

async function handleCancel(b: TelegramBot, msg: Message) {
  const userId = msg.from?.id;
  if (!userId) return;
  if (drafts.delete(userId)) {
    return b.sendMessage(msg.chat.id, "Registration cancelled.");
  }
  return b.sendMessage(msg.chat.id, "Nothing to cancel.");
}

async function routeStateMessage(b: TelegramBot, msg: Message) {
  const userId = msg.from?.id;
  if (!userId) return;

  const draft = drafts.get(userId);
  if (!draft) return;

  if (msg.text?.startsWith("/")) return;

  switch (draft.step) {
    case "AWAITING_FORWARD":
      return handleForward(b, msg, draft);
    case "AWAITING_PRICE":
      return handlePriceInput(b, msg, draft);
    case "AWAITING_DESCRIPTION":
      return handleDescriptionInput(b, msg, draft);
    case "AWAITING_CONFIRM":
      return handleConfirm(b, msg, draft);
  }
}

async function handleForward(b: TelegramBot, msg: Message, draft: RegisterDraft) {
  const fwd = (msg as any).forward_from_chat as { id: number; type: string; title?: string; username?: string } | undefined;

  if (!fwd) {
    return b.sendMessage(msg.chat.id, "That wasn't a forwarded channel message. Open your channel, long-press a message, tap Forward, and pick this bot.");
  }

  if (fwd.type !== "channel") {
    return b.sendMessage(msg.chat.id, `Only channels can be registered — you forwarded from a ${fwd.type}. Forward from a channel instead.`);
  }

  const channelId = String(fwd.id);
  const title = fwd.title || "Untitled";

  const existing = await prisma.telegram_channels.findUnique({ where: { channel_id: channelId } });
  if (existing) {
    drafts.delete(msg.from!.id);
    return b.sendMessage(msg.chat.id, `Channel "${title}" is already registered.`);
  }

  try {
    if (!botUserId) throw new Error("Bot not initialized");
    const member = await b.getChatMember(channelId, botUserId);
    if (member.status !== "administrator") {
      return b.sendMessage(msg.chat.id, "I'm not an admin in that channel. Add @" + BOT_USERNAME + " as admin (with \"Invite Users via Link\" enabled) and forward another message.");
    }
    if (!(member as any).can_invite_users) {
      return b.sendMessage(msg.chat.id, "I'm an admin but I don't have the \"Invite Users via Link\" permission. Enable it in channel settings → Administrators → @" + BOT_USERNAME + ", then forward another message.");
    }
  } catch (err: any) {
    console.error("getChatMember failed:", err.message);
    return b.sendMessage(msg.chat.id, `Couldn't verify admin status: ${err.message}. Make sure @${BOT_USERNAME} is an admin and try again.`);
  }

  draft.channel_id = channelId;
  draft.channel_title = title;
  draft.step = "AWAITING_PRICE";
  drafts.set(msg.from!.id, draft);

  await b.sendMessage(
    msg.chat.id,
    `✅ Channel verified: *${escapeMd(title)}*\n\n*Step 2 of 4* — Send the price in ₹ (just the number, e.g. \`299\`).`,
    { parse_mode: "Markdown" },
  );
}

async function handlePriceInput(b: TelegramBot, msg: Message, draft: RegisterDraft) {
  const raw = msg.text?.trim() || "";
  const price = Number(raw.replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(price) || price <= 0 || price > 100000) {
    return b.sendMessage(msg.chat.id, "That doesn't look right. Send a price between ₹1 and ₹100,000 (just the number).");
  }

  draft.price_inr = price;
  draft.step = "AWAITING_DESCRIPTION";
  drafts.set(msg.from!.id, draft);

  await b.sendMessage(
    msg.chat.id,
    `*Step 3 of 4* — Send a short description (1–2 sentences) that buyers will see.`,
    { parse_mode: "Markdown" },
  );
}

async function handleDescriptionInput(b: TelegramBot, msg: Message, draft: RegisterDraft) {
  const desc = msg.text?.trim() || "";
  if (desc.length < 10 || desc.length > 500) {
    return b.sendMessage(msg.chat.id, "Description must be between 10 and 500 characters. Try again.");
  }

  draft.description = desc;
  draft.step = "AWAITING_CONFIRM";
  drafts.set(msg.from!.id, draft);

  const preview = [
    "*Step 4 of 4 — Confirm*",
    "",
    `*Channel:* ${escapeMd(draft.channel_title!)}`,
    `*Price:* ₹${draft.price_inr}`,
    `*Description:* ${escapeMd(desc)}`,
    "",
    "Reply *YES* to save, or /cancel to abort.",
  ].join("\n");

  await b.sendMessage(msg.chat.id, preview, { parse_mode: "Markdown" });
}

async function handleConfirm(b: TelegramBot, msg: Message, draft: RegisterDraft) {
  const text = msg.text?.trim().toUpperCase() || "";
  if (text !== "YES") {
    return b.sendMessage(msg.chat.id, "Reply YES to save, or /cancel to abort.");
  }

  let row;
  try {
    row = await prisma.telegram_channels.create({
      data: {
        channel_id: draft.channel_id!,
        channel_title: draft.channel_title!,
        creator_telegram_id: String(msg.from!.id),
        creator_username: msg.from?.username || null,
        price_inr: draft.price_inr!,
        description: draft.description!,
      },
    });
  } catch (err: any) {
    console.error("create telegram_channel error:", err);
    return b.sendMessage(msg.chat.id, `Couldn't save: ${err.message}. Try /register again.`);
  }

  drafts.delete(msg.from!.id);
  const salesUrl = `https://t.me/${BOT_USERNAME}?start=channel_${row.id}`;

  try {
    await b.sendMessage(
      msg.chat.id,
      [
        `✅ Channel registered: ${row.channel_title}`,
        ``,
        `Your sales URL:`,
        salesUrl,
        ``,
        `Share this anywhere — Instagram bio, YouTube, WhatsApp. Buyers tapping it land directly on your channel's purchase card.`,
      ].join("\n"),
      { disable_web_page_preview: true },
    );
  } catch (err: any) {
    console.error("confirm reply send failed:", err.message);
    await b.sendMessage(msg.chat.id, `Channel saved. Sales URL: ${salesUrl}`);
  }
}

function escapeMd(s: string): string {
  return s.replace(/([_*`\[])/g, "\\$1");
}

export class TelegramController {
  static async receiveUpdate(req: Request, res: Response) {
    if (WEBHOOK_SECRET) {
      const provided = req.header("X-Telegram-Bot-Api-Secret-Token");
      if (provided !== WEBHOOK_SECRET) {
        return res.status(401).json({ error: "Invalid webhook secret" });
      }
    }

    if (!bot) {
      return res.status(503).json({ error: "Bot not initialized" });
    }

    bot.processUpdate(req.body);
    return res.status(200).json({ ok: true });
  }

  static async health(_req: Request, res: Response) {
    return res.json({
      ok: true,
      configured: !!BOT_TOKEN,
      mode: USE_WEBHOOK ? "webhook" : "polling",
      username: BOT_USERNAME,
      bot_user_id: botUserId,
      active_drafts: drafts.size,
    });
  }

  static async getChannel(req: Request, res: Response) {
    const { id } = req.params;
    const channel = await prisma.telegram_channels.findUnique({ where: { id } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });
    return res.json({ data: channel });
  }

  static async listChannels(_req: Request, res: Response) {
    const channels = await prisma.telegram_channels.findMany({
      where: { status: "ACTIVE" },
      orderBy: { created_at: "desc" },
    });
    return res.json({ data: channels });
  }

  static async listSubscriptions(req: Request, res: Response) {
    const { channelId } = req.query;
    const where = channelId ? { channel_id: String(channelId) } : {};
    const subs = await prisma.telegram_subscriptions.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: { channel: { select: { channel_title: true, channel_id: true } } },
    });
    return res.json({ data: subs });
  }

  static async verifyOrder(req: Request, res: Response) {
    const { order_id } = req.body || {};
    if (!order_id || typeof order_id !== "string" || !order_id.startsWith("tg_")) {
      return res.status(400).json({ error: "Invalid order_id" });
    }

    try {
      const response = await cashfreePG.PGFetchOrder(order_id);
      const orderData = response.data as any;
      const status = orderData?.order_status;

      if (status === "PAID") {
        await processTelegramPaymentSuccess(order_id, { order: orderData });
        return res.json({ ok: true, status });
      }

      if (status === "EXPIRED" || status === "FAILED") {
        await processTelegramPaymentFailed(order_id, { order: orderData });
        return res.json({ ok: false, status });
      }

      return res.json({ ok: false, status });
    } catch (err: any) {
      const detail = err?.response?.data?.message || err?.message || String(err);
      console.error("verifyOrder error:", detail);
      return res.status(500).json({ error: detail });
    }
  }
}
