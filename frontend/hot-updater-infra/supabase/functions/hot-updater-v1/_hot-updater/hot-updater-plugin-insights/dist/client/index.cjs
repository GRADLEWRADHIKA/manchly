Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_errorDetails = require("./errorDetails.cjs");
const require_eventId = require("./eventId.cjs");
const require_sender = require("./sender.cjs");
const require_state = require("./state.cjs");
let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/client/index.ts
const normalizeUserId = (user) => {
	if (user === null) return null;
	const userId = String(user.userId).trim();
	return userId.length === 0 ? null : userId;
};
/**
* Reports update adoption to a server that runs the `insights()` server
* plugin: launches (at most once a UTC day while nothing changes), downloads,
* applies, recoveries, and update failures. After the server answers that
* Insights is off, the plugin sends nothing for 24 hours, and for the rest
* of that runtime.
*
* @example
* ```ts
* import { HotUpdater, insights } from "@hot-updater/react-native";
*
* export const hotUpdater = HotUpdater.init({ baseURL, plugins: [insights()] });
* hotUpdater.insights.setUser({ userId: "user-123" });
* ```
*/
const insights = (options = {}) => (0, _hot_updater_protocol.defineClientPlugin)({
	id: "insights",
	setup: (pluginContext) => setUpInsights(options, pluginContext)
});
/**
* One instance's Insights: its context, device state, and delivery queue,
* created by each `setup`, so a plugin object set up by two instances keeps
* their reports apart.
*/
const setUpInsights = (options, pluginContext) => {
	let context = null;
	let state = null;
	/** A download in this runtime: a later no-change report would hide it. */
	let didDownload = false;
	let lastDownloadedSelection = null;
	const pending = /* @__PURE__ */ new Map();
	let send = null;
	/**
	* `occurredAt` dates an event native code recorded before this runtime
	* started, such as a download a native `HotUpdaterInstance` finished.
	*/
	const createEvent = (movement, eventId, occurredAt) => {
		if (context === null || state === null) return null;
		const appVersion = context.appVersion;
		if (appVersion === null) {
			console.warn(`[HotUpdater] Insights needs the native app version; the ${movement.type} event was not sent.`);
			return null;
		}
		const now = occurredAt ?? context.now();
		const installId = context.installId;
		const userId = state.readUserId();
		const response = state.readHttpResponse(movement.channel, appVersion);
		const body = {
			...movement,
			...response ? { metadata: {
				...movement.metadata,
				httpResponse: response
			} } : {},
			eventId: eventId?.(now, installId) ?? require_eventId.createUUIDv7(now),
			installId,
			...userId === null ? {} : { userId },
			platform: context.platform,
			appVersion,
			cohort: context.getCohort(),
			fingerprintHash: context.getFingerprintHash(),
			sdkVersion: context.sdkVersion,
			minBundleId: context.minBundleId
		};
		const day = require_state.utcDay(now);
		return {
			body,
			day,
			report: movement.type === "UNCHANGED" || movement.type === "UPDATE_APPLIED" || movement.type === "RECOVERED" ? {
				day,
				channel: movement.channel,
				appVersion,
				bundleId: movement.toBundleId,
				releaseId: movement.toReleaseId,
				userId
			} : null,
			failureKey: null
		};
	};
	const enqueue = (event) => {
		if (event === null || send === null) return;
		const { type, toBundleId } = event.body;
		if (type === "UPDATE_DOWNLOADED" || type === "UPDATE_APPLIED") {
			for (const queued of pending.values()) if (queued.body.type === "UPDATE_FAILED" && queued.body.toBundleId === toBundleId) queued.superseded = true;
		}
		pending.set(event.body, event);
		send(event.body).catch((error) => {
			console.warn(`[HotUpdater] Insights ${event.body.type} event was not delivered:`, error);
		});
	};
	const reportLaunch = (channel, bundleId, releaseId, fromReleaseId, occurredAt) => {
		if (didDownload) return;
		enqueue(createEvent({
			type: "UNCHANGED",
			channel,
			fromBundleId: null,
			fromReleaseId,
			toBundleId: bundleId,
			toReleaseId: releaseId,
			updateStrategy: null
		}, void 0, occurredAt));
	};
	const onAppReady = (result) => {
		if (result.status === "UNCHANGED") {
			reportLaunch(result.channel, result.bundleId, result.releaseId, null);
			return;
		}
		enqueue(createEvent({
			type: result.status,
			channel: result.channel,
			fromBundleId: result.fromBundleId,
			fromReleaseId: result.fromReleaseId,
			toBundleId: result.toBundleId,
			toReleaseId: result.toReleaseId,
			updateStrategy: result.updateStrategy
		}));
	};
	const onUpdateCheck = (result) => {
		if (result.status !== "UNCHANGED") return;
		reportLaunch(result.channel, result.bundleId, result.releaseId, result.previousReleaseId === result.releaseId ? null : result.previousReleaseId, result.occurredAt);
	};
	const onBundleDownloaded = (info) => {
		const selection = JSON.stringify([
			info.channel,
			info.toReleaseId,
			info.toBundleId
		]);
		if (lastDownloadedSelection === selection) return;
		lastDownloadedSelection = selection;
		didDownload = true;
		enqueue(createEvent({
			type: "UPDATE_DOWNLOADED",
			channel: info.channel,
			fromBundleId: info.fromBundleId,
			fromReleaseId: info.fromReleaseId,
			toBundleId: info.toBundleId,
			toReleaseId: info.toReleaseId,
			updateStrategy: info.updateStrategy,
			metadata: {
				delivery: info.delivery,
				...info.patchFallback ? { patchFallback: true } : {}
			}
		}, void 0, info.occurredAt));
	};
	const onUpdateError = (error) => {
		if (error.stage === "check" && error.reason === "network") return;
		const targetBundleId = error.targetBundleId ?? error.bundleId;
		const details = require_errorDetails.readErrorDetails(error.cause);
		const failureKey = JSON.stringify([
			error.stage,
			error.reason,
			targetBundleId,
			details.errorMessage ?? null
		]);
		const event = createEvent({
			type: "UPDATE_FAILED",
			channel: error.channel,
			fromBundleId: error.bundleId,
			fromReleaseId: error.releaseId,
			toBundleId: targetBundleId,
			toReleaseId: error.targetReleaseId ?? null,
			updateStrategy: error.updateStrategy,
			metadata: { failure: {
				stage: error.stage,
				reason: error.reason,
				...details,
				...error.resource === void 0 ? {} : { resource: error.resource },
				...error.httpStatus === void 0 ? {} : { httpStatus: error.httpStatus },
				...error.transport === void 0 ? {} : { transport: error.transport },
				...error.originCode === void 0 ? {} : { originCode: error.originCode }
			} }
		}, (now, installId) => require_eventId.createKeyedUUIDv7([
			installId,
			require_state.utcDay(now),
			failureKey
		].join("\n"), require_state.utcDayStart(now)), error.occurredAt);
		enqueue(event === null ? null : {
			...event,
			failureKey
		});
	};
	const onHttpResponse = (response) => {
		if (context === null || state === null || context.appVersion === null) return;
		const body = response.body === null ? null : require_errorDetails.boundedText(response.body, 4096);
		const channel = response.channel ?? context.getChannel();
		state.recordHttpResponse(channel, context.appVersion, {
			resource: response.resource,
			status: response.status,
			path: require_errorDetails.boundedText(response.path, 1024),
			body,
			bodyTruncated: response.bodyTruncated || body !== response.body,
			receivedAtMs: response.occurredAt ?? context.now()
		});
	};
	const admit = (body) => {
		const event = pending.get(body);
		if (event === void 0 || state === null || context === null) return false;
		if (event.superseded === true || state.isPaused(context.now())) {
			pending.delete(body);
			return false;
		}
		const admitted = body.type === "UNCHANGED" ? event.report === null || !state.repeatsReport(event.report) : body.type === "UPDATE_FAILED" ? event.failureKey === null || !state.hasFailure(event.day, event.failureKey) : true;
		if (!admitted) pending.delete(body);
		return admitted;
	};
	const settle = (body, delivery) => {
		const event = pending.get(body);
		pending.delete(body);
		if (event === void 0 || state === null || context === null) return;
		if (delivery === "failed") return;
		if (delivery === "disabled") {
			state.pause(context.now());
			return;
		}
		if (event.failureKey !== null) state.recordFailure(event.day, event.failureKey);
		state.resume();
		if (event.report !== null) state.recordReport(event.report);
		else state.forgetReport();
	};
	context = pluginContext;
	const pluginState = require_state.createInsightsState(pluginContext.storage);
	state = pluginState;
	const api = Object.freeze({ setUser: (user) => {
		pluginState.writeUserId(normalizeUserId(user));
	} });
	if (pluginContext.isDebugBuild && options.debug !== true) return { api };
	send = require_sender.createInsightsEventSender(pluginContext.fetch, {
		admit,
		settle
	});
	return {
		api,
		hooks: {
			onAppReady,
			onUpdateCheck,
			onBundleDownloaded,
			onUpdateError,
			onHttpResponse
		}
	};
};
//#endregion
exports.insights = insights;
