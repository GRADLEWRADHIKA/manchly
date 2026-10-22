//#region src/client/state.ts
const DAY_MS = 864e5;
/** The UTC day of a time, as `YYYY-MM-DD`. */
const utcDay = (time) => new Date(time).toISOString().slice(0, 10);
/** The start of a time's UTC day, in milliseconds. */
const utcDayStart = (time) => Math.floor(time / DAY_MS) * DAY_MS;
const sameReport = (left, right) => left.day === right.day && left.channel === right.channel && left.appVersion === right.appVersion && left.bundleId === right.bundleId && left.releaseId === right.releaseId && left.userId === right.userId;
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isNullableString = (value) => value === null || typeof value === "string";
const parseReport = (value) => {
	if (value === null) return null;
	try {
		const report = JSON.parse(value);
		if (isRecord(report) && typeof report.day === "string" && typeof report.channel === "string" && typeof report.appVersion === "string" && typeof report.bundleId === "string" && isNullableString(report.releaseId) && isNullableString(report.userId)) return {
			day: report.day,
			channel: report.channel,
			appVersion: report.appVersion,
			bundleId: report.bundleId,
			releaseId: report.releaseId,
			userId: report.userId
		};
	} catch {}
	return null;
};
const parseFailures = (value) => {
	if (value === null) return null;
	try {
		const failures = JSON.parse(value);
		if (isRecord(failures) && typeof failures.day === "string" && Array.isArray(failures.keys) && failures.keys.every((key) => typeof key === "string")) return {
			day: failures.day,
			keys: failures.keys
		};
	} catch {}
	return null;
};
/**
* The Insights plugin's memory across launches, in its plugin storage. Every
* read tolerates a missing or unreadable value, and a storage failure only
* costs a report that would otherwise have been skipped.
*/
const createInsightsState = (storage) => {
	/** The server said Insights is off during this runtime. */
	let pausedThisRuntime = false;
	const read = (key) => {
		try {
			return storage.get(key);
		} catch {
			return null;
		}
	};
	const write = (key, value) => {
		try {
			storage.set(key, value);
		} catch {}
	};
	return {
		/**
		* Whether reporting pauses: the server answered that Insights is off
		* during this runtime or in the 24 hours before `now`. A pause that
		* starts after `now`, from a clock that went back, has ended.
		*/
		isPaused(now) {
			if (pausedThisRuntime) return true;
			const pausedAt = Number(read("pausedAt"));
			return Number.isFinite(pausedAt) && pausedAt > 0 && pausedAt <= now && now < pausedAt + DAY_MS;
		},
		pause(now) {
			pausedThisRuntime = true;
			write("pausedAt", String(now));
		},
		/** The server stored a report, so Insights is on. */
		resume() {
			if (read("pausedAt") !== null) write("pausedAt", null);
		},
		/** Whether a launch report repeats what the installation reported that day. */
		repeatsReport(report) {
			const last = parseReport(read("report"));
			return last !== null && sameReport(last, report);
		},
		/** Records a delivered report that says what runs. */
		recordReport(report) {
			write("report", JSON.stringify(report));
		},
		/**
		* Forgets the last report after a delivered download or failure, so the
		* next launch reports again, as the server records it after one.
		*/
		forgetReport() {
			if (read("report") !== null) write("report", null);
		},
		/** Whether a failure was already reported that day. */
		hasFailure(day, key) {
			const failures = parseFailures(read("failures"));
			return failures?.day === day && failures.keys.includes(key);
		},
		recordFailure(day, key) {
			const failures = parseFailures(read("failures"));
			const keys = failures?.day === day ? failures.keys : [];
			if (keys.includes(key)) return;
			write("failures", JSON.stringify({
				day,
				keys: [...keys, key].slice(-32)
			}));
		},
		readHttpResponse(channel, appVersion) {
			try {
				const saved = JSON.parse(read("httpResponse") ?? "null");
				if (!isRecord(saved) || saved.channel !== channel || saved.appVersion !== appVersion || !isRecord(saved.response)) return void 0;
				const response = saved.response;
				if (response.resource !== "catalog" && response.resource !== "artifact" || typeof response.path !== "string" || response.path.length > 1024 || typeof response.status !== "number" || !Number.isInteger(response.status) || response.status < 100 || response.status > 599 || !isNullableString(response.body) || JSON.stringify(response.body).length > 4096 || typeof response.bodyTruncated !== "boolean" || typeof response.receivedAtMs !== "number" || !Number.isSafeInteger(response.receivedAtMs) || response.receivedAtMs < 0) return void 0;
				return response;
			} catch {
				return;
			}
		},
		recordHttpResponse(channel, appVersion, response) {
			write("httpResponse", JSON.stringify({
				channel,
				appVersion,
				response
			}));
		},
		readUserId() {
			try {
				const user = JSON.parse(read("user") ?? "null");
				return isRecord(user) && typeof user.userId === "string" ? user.userId : null;
			} catch {
				return null;
			}
		},
		writeUserId(userId) {
			write("user", userId === null ? null : JSON.stringify({ userId }));
		}
	};
};
//#endregion
export { createInsightsState, utcDay, utcDayStart };
