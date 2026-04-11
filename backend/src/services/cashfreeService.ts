import dotenv from "dotenv";
dotenv.config();

// Cashfree Payment Gateway SDK
import { Cashfree as CashfreePG, CFEnvironment as PGEnv } from "cashfree-pg";

// Cashfree Payouts SDK
import { Cashfree as CashfreePayout, CFEnvironment as PayoutEnv } from "cashfree-payout";

// Initialize PG SDK (instance-based)
const pgEnvironment =
  process.env.CASHFREE_PG_ENV === "PRODUCTION" ? PGEnv.PRODUCTION : PGEnv.SANDBOX;

export const cashfreePG = new CashfreePG(
  pgEnvironment,
  process.env.CASHFREE_PG_APP_ID!,
  process.env.CASHFREE_PG_SECRET_KEY!
);

// Initialize Payouts SDK (static config)
CashfreePayout.XApiVersion = "2024-01-01";
const payoutEnv =
  process.env.CASHFREE_PAYOUT_ENV === "PRODUCTION"
    ? PayoutEnv.PRODUCTION
    : PayoutEnv.SANDBOX;

// Configure Payout SDK static properties
(CashfreePayout as any).XClientId = process.env.CASHFREE_PAYOUT_CLIENT_ID;
(CashfreePayout as any).XClientSecret = process.env.CASHFREE_PAYOUT_CLIENT_SECRET;
(CashfreePayout as any).XEnvironment = payoutEnv;

export { CashfreePayout, PayoutEnv };
