//#region src/shared/ownEntry.ts
/**
* A record's own entry. Parameter keys and condition names come from users,
* so `constructor` or `__proto__` must name theirs, never Object.prototype's.
*/
const ownEntry = (record, key) => record !== void 0 && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : void 0;
//#endregion
exports.ownEntry = ownEntry;
