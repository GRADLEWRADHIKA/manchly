//#region src/client/eventId.ts
const formatUUIDv7 = (bytes, timestamp) => {
	let time = timestamp;
	for (let index = 5; index >= 0; index -= 1) {
		bytes[index] = time % 256;
		time = Math.floor(time / 256);
	}
	bytes[6] = 112 | bytes[6] & 15;
	bytes[8] = 128 | bytes[8] & 63;
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
/**
* Creates an RFC 9562 UUIDv7: a 48-bit millisecond timestamp, then random bits.
* `timestamp` is when the event happened, now unless native code recorded it
* earlier.
*
* `createUUIDv7` from `@hot-updater/plugin-core` calls `crypto.getRandomValues`
* unconditionally, but React Native has no Web Crypto unless the app installs a
* polyfill. An Insights event ID only has to tell one event from another so a
* retried POST is counted once, so `Math.random` is enough without one.
*/
const createUUIDv7 = (timestamp = Date.now()) => {
	const bytes = /* @__PURE__ */ new Uint8Array(16);
	const { crypto } = globalThis;
	if (typeof crypto?.getRandomValues === "function") crypto.getRandomValues(bytes);
	else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
	return formatUUIDv7(bytes, timestamp);
};
const SHA256_K = [
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
];
const encodeUtf8 = (value) => {
	const bytes = [];
	for (const character of value) {
		const code = character.codePointAt(0);
		if (code < 128) bytes.push(code);
		else if (code < 2048) bytes.push(192 | code >> 6, 128 | code & 63);
		else if (code < 65536) bytes.push(224 | code >> 12, 128 | code >> 6 & 63, 128 | code & 63);
		else bytes.push(240 | code >> 18, 128 | code >> 12 & 63, 128 | code >> 6 & 63, 128 | code & 63);
	}
	return bytes;
};
/** SHA-256 of a string's UTF-8 bytes, since React Native has no Web Crypto. */
const sha256 = (value) => {
	const bytes = encodeUtf8(value);
	const bitLength = bytes.length * 8;
	bytes.push(128);
	while (bytes.length % 64 !== 56) bytes.push(0);
	for (let shift = 56; shift >= 0; shift -= 8) bytes.push(shift >= 32 ? Math.floor(bitLength / 2 ** shift) & 255 : bitLength >>> shift & 255);
	const hash = [
		1779033703,
		3144134277,
		1013904242,
		2773480762,
		1359893119,
		2600822924,
		528734635,
		1541459225
	];
	const words = Array.from({ length: 64 }, () => 0);
	const rotate = (word, bits) => word >>> bits | word << 32 - bits;
	for (let offset = 0; offset < bytes.length; offset += 64) {
		for (let index = 0; index < 16; index += 1) {
			const at = offset + index * 4;
			words[index] = bytes[at] << 24 | bytes[at + 1] << 16 | bytes[at + 2] << 8 | bytes[at + 3];
		}
		for (let index = 16; index < 64; index += 1) {
			const low = words[index - 15];
			const high = words[index - 2];
			const s0 = rotate(low, 7) ^ rotate(low, 18) ^ low >>> 3;
			const s1 = rotate(high, 17) ^ rotate(high, 19) ^ high >>> 10;
			words[index] = words[index - 16] + s0 + words[index - 7] + s1 | 0;
		}
		let [a, b, c, d, e, f, g, h] = hash;
		for (let index = 0; index < 64; index += 1) {
			const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
			const choose = e & f ^ ~e & g;
			const temp1 = h + s1 + choose + SHA256_K[index] + words[index] | 0;
			const temp2 = (rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + (a & b ^ a & c ^ b & c) | 0;
			h = g;
			g = f;
			f = e;
			e = d + temp1 | 0;
			d = c;
			c = b;
			b = a;
			a = temp1 + temp2 | 0;
		}
		const results = [
			a,
			b,
			c,
			d,
			e,
			f,
			g,
			h
		];
		for (let index = 0; index < 8; index += 1) hash[index] = hash[index] + results[index] | 0;
	}
	const digest = /* @__PURE__ */ new Uint8Array(32);
	hash.forEach((word, index) => {
		digest[index * 4] = word >>> 24 & 255;
		digest[index * 4 + 1] = word >>> 16 & 255;
		digest[index * 4 + 2] = word >>> 8 & 255;
		digest[index * 4 + 3] = word & 255;
	});
	return digest;
};
/**
* A UUIDv7 derived from a key: its time field is `timestamp` and its random
* bits are the key's SHA-256, so the same key and time always give the same
* id, and a server that stores reports by id counts it once.
*/
const createKeyedUUIDv7 = (key, timestamp) => formatUUIDv7(sha256(key).slice(0, 16), timestamp);
//#endregion
exports.createKeyedUUIDv7 = createKeyedUUIDv7;
exports.createUUIDv7 = createUUIDv7;
exports.sha256 = sha256;
