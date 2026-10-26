//#region src/client/sender.ts
/** Attempts per Insights event, the first one included. */
const INSIGHTS_MAX_ATTEMPTS = 3;
/** Wait before the second attempt; it doubles for each later attempt. */
const INSIGHTS_RETRY_BASE_DELAY_MS = 1e3;
/** Longest wait between attempts, a server's `Retry-After` included. */
const INSIGHTS_RETRY_MAX_DELAY_MS = 3e4;
/**
* Reads `Retry-After` as delay-seconds, the form a server under load sends;
* an HTTP-date falls back to the backoff.
*/
const parseRetryAfterMs = (value) => {
	const seconds = value?.trim();
	return seconds && /^\d+$/.test(seconds) ? Number(seconds) * 1e3 : null;
};
const getRetryDelayMs = (failedAttempt, retryAfterMs) => Math.min(retryAfterMs ?? INSIGHTS_RETRY_BASE_DELAY_MS * 2 ** (failedAttempt - 1) * (.5 + Math.random()), INSIGHTS_RETRY_MAX_DELAY_MS);
const wait = (ms) => new Promise((resolve) => {
	setTimeout(resolve, ms);
});
/** Makes one POST, with the context's timeout, and settles with its outcome. */
const postInsightsEvent = async (fetch, event) => {
	try {
		const response = await fetch("events", {
			body: JSON.stringify(event),
			headers: { "Content-Type": "application/json" },
			method: "POST"
		});
		if (response.status === 204) return "delivered";
		if (response.status === 404) return "disabled";
		return {
			error: /* @__PURE__ */ new Error(`Expected HTTP 204 from /events, received ${response.status}`),
			retryable: response.status === 429 || response.status >= 500,
			retryAfterMs: parseRetryAfterMs(response.headers.get("Retry-After"))
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error : new Error(String(error)),
			retryable: true,
			retryAfterMs: null
		};
	}
};
/**
* Sends Insights events one at a time and retries each in the background.
*
* The server keeps an installation's latest report by arrival, so a later
* event waits behind an earlier one's retries; otherwise a retried
* UPDATE_APPLIED could land after the UPDATE_DOWNLOADED that followed it.
* Callers wait only for first attempts, so a report never waits out a
* backoff: once an event backs off, every waiting caller is released, and a
* failure after that only warns. The gate sees each event before each
* attempt, after every earlier event settled, so it decides with what the
* server already answered.
*/
const createInsightsEventSender = (fetch, gate) => {
	let queue = Promise.resolve();
	let retrying = false;
	const waiting = /* @__PURE__ */ new Set();
	return (event) => new Promise((resolve, reject) => {
		let released = false;
		const release = () => {
			released = true;
			waiting.delete(release);
			resolve();
		};
		if (retrying) release();
		else waiting.add(release);
		queue = queue.then(async () => {
			try {
				for (let attempt = 1;; attempt += 1) {
					if (!gate.admit(event)) {
						release();
						break;
					}
					const outcome = await postInsightsEvent(fetch, event);
					if (typeof outcome === "string") {
						gate.settle(event, outcome);
						release();
						break;
					}
					if (!outcome.retryable || attempt === INSIGHTS_MAX_ATTEMPTS) {
						gate.settle(event, "failed");
						waiting.delete(release);
						if (released) console.warn(`[HotUpdater] Insights ${event.type} event was not delivered:`, outcome.error);
						else reject(outcome.error);
						break;
					}
					retrying = true;
					for (const releaseWaiting of waiting) releaseWaiting();
					await wait(getRetryDelayMs(attempt, outcome.retryAfterMs));
				}
			} catch (error) {
				waiting.delete(release);
				if (!released) reject(error);
			} finally {
				retrying = false;
			}
		});
	});
};
//#endregion
exports.createInsightsEventSender = createInsightsEventSender;
