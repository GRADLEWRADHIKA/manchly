let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/uuidv7.ts
const extractTimestampFromUUIDv7 = (uuid) => {
	if (!(0, _hot_updater_protocol.isUUIDv7)(uuid)) throw new TypeError("Expected a canonical lowercase UUIDv7");
	const timestampHex = uuid.split("-").join("").slice(0, 12);
	return Number.parseInt(timestampHex, 16);
};
function createUUIDv7FromTimestampHex(timestampHex) {
	const randomBytes = /* @__PURE__ */ new Uint8Array(10);
	crypto.getRandomValues(randomBytes);
	const randomHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
	const randA = randomHex.slice(0, 3);
	const randBHex = randomHex.slice(3, 19);
	const versionAndRandA = `7${randA}`;
	const variantAndFirstRandB = (128 | parseInt(randBHex.slice(0, 2), 16) & 63).toString(16).padStart(2, "0");
	return [
		timestampHex.slice(0, 8),
		timestampHex.slice(8, 12),
		versionAndRandA,
		variantAndFirstRandB + randBHex.slice(2, 4),
		randBHex.slice(4, 16)
	].join("-");
}
const createUUIDv7 = () => createUUIDv7FromTimestampHex(Date.now().toString(16).padStart(12, "0"));
const createUUIDv7After = (floor, nowMs = Date.now()) => {
	const timestamp = Math.max(nowMs, floor === null ? 0 : extractTimestampFromUUIDv7(floor) + 1);
	if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp >= 2 ** 48) throw new RangeError("UUIDv7 timestamp is out of range");
	return createUUIDv7FromTimestampHex(timestamp.toString(16).padStart(12, "0"));
};
const createUUIDv7WithSameTimestamp = (originalUuid) => {
	return createUUIDv7FromTimestampHex(originalUuid.split("-").join("").slice(0, 12));
};
//#endregion
exports.createUUIDv7 = createUUIDv7;
exports.createUUIDv7After = createUUIDv7After;
exports.createUUIDv7WithSameTimestamp = createUUIDv7WithSameTimestamp;
exports.extractTimestampFromUUIDv7 = extractTimestampFromUUIDv7;
Object.defineProperty(exports, "isUUIDv7", {
	enumerable: true,
	get: function() {
		return _hot_updater_protocol.isUUIDv7;
	}
});
