//#region src/adapters/sqlProviders.ts
/** The dialects Hot Updater's SQL core runs on. */
const sqlProviders = [
	"sqlite",
	"mysql",
	"postgresql"
];
/** The provider an adapter was given, when Hot Updater's SQL core runs on it. */
const checkSqlProvider = (adapter, provider) => {
	if (!sqlProviders.includes(provider)) throw new Error(`${adapter}: provider "${String(provider)}" is not supported. Use ${sqlProviders.map((name) => `"${name}"`).join(", ")}.`);
	return provider;
};
//#endregion
export { checkSqlProvider };
