import { f as satisfies } from "./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/range-DvX-Y6iv.mjs";
import { n as coerce } from "./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/version-CQ98ZBpL.mjs";
//#region src/semverSatisfies.ts
const semverSatisfies = (targetAppVersion, currentVersion) => {
	const currentCoerce = coerce(currentVersion);
	if (!currentCoerce) return false;
	return satisfies(currentCoerce, targetAppVersion);
};
//#endregion
export { semverSatisfies };
