// Android-only: import this solely from OtaUpdateGate.android.tsx. The native
// module is not linked on iOS (see react-native.config.js).
import { HotUpdater, insights } from '@hot-updater/react-native';

// Supabase Edge Function deployed from hot-updater-infra/.
const HOT_UPDATER_BASE_URL =
  'https://ojrsftqiteeyxmbdyuoa.supabase.co/functions/v1/hot-updater-v1';
// Client API key registered by hot-updater-infra/app/provision-client-credential.mjs.
// This is the app-side key only; never put the Supabase service-role key here.
const HOT_UPDATER_API_KEY = '__HOT_UPDATER_API_KEY__';

// Must match updateStrategy in hot-updater.config.ts.
export const UPDATE_STRATEGY = 'appVersion' as const;

export const reportUpdateError = (error: unknown) => {
  console.error('Hot Updater:', error);
};

// init must run once at module scope so native launch verification
// (and automatic crash rollback) happens on every start.
export const hotUpdater = HotUpdater.init({
  baseURL: HOT_UPDATER_BASE_URL,
  requestHeaders: {
    'x-api-key': HOT_UPDATER_API_KEY,
  },
  onError: reportUpdateError,
  plugins: [insights()],
});
