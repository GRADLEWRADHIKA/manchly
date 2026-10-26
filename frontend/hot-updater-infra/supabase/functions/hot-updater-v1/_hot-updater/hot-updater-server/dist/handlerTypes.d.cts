import "./core/api.cjs";
//#region src/handlerTypes.d.ts
type HotUpdaterHandler = (request: Request) => Promise<Response>;
interface HotUpdaterHandlers {
  readonly client: HotUpdaterHandler;
  readonly admin: HotUpdaterHandler;
}
//#endregion
export { HotUpdaterHandler, HotUpdaterHandlers };