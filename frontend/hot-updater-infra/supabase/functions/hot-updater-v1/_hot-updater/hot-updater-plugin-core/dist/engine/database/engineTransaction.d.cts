//#region src/engine/database/engineTransaction.d.ts
/**
 * How a transaction that conflicts with another write runs again: a
 * database's `retry`, for stores under write contention, with `onRetry` to
 * observe each rerun.
 */
interface RetryOptions {
  /** How many times a transaction runs before it fails; 8 by default. */
  readonly attempts?: number;
  /** The wait before the second attempt, doubling after each; 5 ms by default. */
  readonly baseDelayMs?: number;
  /** The longest wait between attempts; 250 ms by default. */
  readonly maxDelayMs?: number;
  /** Called before each rerun of `fn` and each resend of the same write, with the attempt that failed (from 1). */
  readonly onRetry?: (kind: "rerun" | "resend", attempt: number) => void;
}
//#endregion
export { RetryOptions };