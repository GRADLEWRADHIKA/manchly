const require_range_DvX_Y6iv = require("./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/range-DvX-Y6iv.cjs");
const require_version_CQ98ZBpL = require("./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/version-CQ98ZBpL.cjs");
//#region src/semverSatisfies.ts
const semverSatisfies = (targetAppVersion, currentVersion) => {
	const currentCoerce = require_version_CQ98ZBpL.n(currentVersion);
	if (!currentCoerce) return false;
	return require_range_DvX_Y6iv.f(currentCoerce, targetAppVersion);
};
//#endregion
exports.semverSatisfies = semverSatisfies;
