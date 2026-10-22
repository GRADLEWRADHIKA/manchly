//#region src/database/distinct.ts
/**
* HyperLogLog sketches, the storage engine's `distinct` aggregate metric: a
* sketch is 1,024 registers stored as a 1,024-character string, so adding a
* value, merging sketches, and counting one never need the values back.
*/
const PRECISION = 10;
const REGISTER_COUNT = 1024;
const MAX_RANK = 55;
const hash = (value) => {
	let result = 14695981039346656037n;
	for (const byte of new TextEncoder().encode(value)) {
		result ^= BigInt(byte);
		result = BigInt.asUintN(64, result * 1099511628211n);
	}
	return result;
};
const OFFSET = 33;
const decode = (summary) => {
	if (!summary) return new Uint8Array(REGISTER_COUNT);
	if (summary.length !== REGISTER_COUNT) throw new Error("Invalid distinct sketch");
	const registers = new Uint8Array(REGISTER_COUNT);
	for (let index = 0; index < REGISTER_COUNT; index += 1) {
		const value = summary.charCodeAt(index) - OFFSET;
		if (!Number.isInteger(value) || value < 0 || value > MAX_RANK) throw new Error("Invalid distinct sketch");
		registers[index] = value;
	}
	return registers;
};
const encode = (registers) => Array.from(registers, (value) => String.fromCharCode(value + OFFSET)).join("");
const distinctRegister = (identity) => {
	const value = hash(identity);
	const index = Number(value & BigInt(1023));
	let remainder = value >> BigInt(PRECISION);
	let rank = 1;
	while ((remainder & 1n) === 0n && rank < MAX_RANK) {
		rank += 1;
		remainder >>= 1n;
	}
	return {
		index,
		rank,
		character: String.fromCharCode(rank + OFFSET)
	};
};
/**
* The sketch with `identity` added; a missing sketch is the empty one. A
* plugin passes it as a `distinct` column's change to `tx.aggregate`.
*/
const addDistinct = (summary, identity) => {
	const registers = decode(summary);
	const { index, rank } = distinctRegister(identity);
	registers[index] = Math.max(registers[index], rank);
	return encode(registers);
};
/**
* The union of sketches, register by register: how a plugin combines a
* `distinct` column across the aggregate rows it reads.
*/
const mergeDistinct = (summaries) => {
	const merged = new Uint8Array(REGISTER_COUNT);
	for (const summary of summaries) {
		const registers = decode(summary);
		for (let index = 0; index < REGISTER_COUNT; index += 1) merged[index] = Math.max(merged[index], registers[index]);
	}
	return encode(merged);
};
/**
* The estimated number of distinct values a sketch holds: how a plugin
* reads a `distinct` column.
*/
const countDistinct = (summary) => {
	const registers = decode(summary);
	let inverseSum = 0;
	let empty = 0;
	for (const register of registers) {
		inverseSum += 2 ** -register;
		if (register === 0) empty += 1;
	}
	const raw = .7213 / 1.0010537109375 * REGISTER_COUNT ** 2 / inverseSum;
	const estimate = raw <= 2.5 * REGISTER_COUNT && empty > 0 ? REGISTER_COUNT * Math.log(REGISTER_COUNT / empty) : raw;
	return Math.max(0, Math.round(estimate));
};
//#endregion
exports.addDistinct = addDistinct;
exports.countDistinct = countDistinct;
exports.distinctRegister = distinctRegister;
exports.mergeDistinct = mergeDistinct;
