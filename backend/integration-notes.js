/*
 * ============================================================================
 * FRONTEND INTEGRATION NOTES — CreatorCenter & BrandMarketplace
 * Stack: React Native + Redux + Supabase Auth
 * Backend base URL: process.env.EXPO_PUBLIC_API_URL  (e.g. https://server.manchly.com)
 * ============================================================================
 *
 * ─── HOW TO GET THE SUPABASE AUTH TOKEN ─────────────────────────────────────
 *
 * Every API call must include the Supabase session access_token as a Bearer
 * token in the Authorization header.
 *
 *   import { supabase } from './supabaseClient';  // your existing Supabase client
 *
 *   const { data: { session } } = await supabase.auth.getSession();
 *   const token = session?.access_token;
 *
 * Recommendation — create a shared apiClient helper (e.g. with axios) that
 * attaches the token automatically:
 *
 *   import axios from 'axios';
 *   import { supabase } from './supabaseClient';
 *
 *   const apiClient = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });
 *
 *   apiClient.interceptors.request.use(async (config) => {
 *     const { data: { session } } = await supabase.auth.getSession();
 *     if (session?.access_token) {
 *       config.headers.Authorization = `Bearer ${session.access_token}`;
 *     }
 *     return config;
 *   });
 *
 *   export default apiClient;
 *
 * ─── CREATORCENTER — ON MOUNT ────────────────────────────────────────────────
 *
 *   Call:   GET /api/creator/profile
 *   Auth:   Authorization: Bearer <session.access_token>
 *
 *   If `data` is non-null, pre-fill all useState hooks:
 *     setLinks(data.links)          // { education, collabs, consulting, ugc }
 *     setName(data.name)
 *     setBio(data.bio)
 *     setNiche(data.niche)
 *     setCity(data.city)
 *     setPhone(data.phone)
 *     setInstagram(data.instagram)
 *     setSebiRegistered(data.sebiRegistered)
 *     setFollowers(data.followers)
 *     setEngagementRate(data.engagementRate)
 *     setAvgViews(data.avgViews)
 *     setAudience(data.audience)
 *     setPackages(data.packages)
 *     setIsPublished(data.isPublished)
 *
 *   If `data` is null, leave existing placeholder/default state values.
 *
 * ─── CREATORCENTER — SAVE (form submit) ─────────────────────────────────────
 *
 *   Call:   PUT /api/creator/profile
 *   Body shape:
 *     {
 *       name, bio, niche, city, phone, instagram,
 *       sebiRegistered, followers, engagementRate, avgViews,
 *       links: { education, collabs, consulting, ugc },
 *       audience: [{ label: string, value: string }],
 *       packages: [{ label: string, value: string }]
 *     }
 *
 *   On 422 VALIDATION_FAILED:
 *     - response.data.fields is an object: { fieldName: "reason" }
 *     - surface these as inline validation messages per field
 *
 *   On success (200):
 *     - show a toast "Profile saved"
 *
 * ─── CREATORCENTER — PUBLISH TOGGLE ─────────────────────────────────────────
 *
 *   Call:   POST /api/creator/profile/publish
 *   Body:   {} (no body needed — server toggles based on current state)
 *
 *   On 400 INCOMPLETE_PROFILE:
 *     - response.data.missingFields = ["name", "niche", ...]
 *     - alert creator: "Please complete: " + missingFields.join(", ")
 *
 *   On success (200):
 *     - update local isPublished state: setIsPublished(data.isPublished)
 *
 * ─── CREATORCENTER — WEBHOOK TEST (runHook) ──────────────────────────────────
 *
 *   Replace the local setTerminalLines() logic with a fetch:
 *
 *   Call:   POST /api/creator/webhook-test
 *   Body:   { comment: string }   // the text typed by the user in the terminal input
 *
 *   On success (200):
 *     - setTerminalLines(data.lines)   // string[]
 *
 * ─── BRANDMARKETPLACE — REPLACING HARDCODED CREATORS ────────────────────────
 *
 *   1. Remove the `const CREATORS = [...]` array.
 *   2. Add state:
 *        const [creators, setCreators] = useState([]);
 *        const [loading, setLoading] = useState(false);
 *   3. Add a debounced query ref:
 *        const debounceRef = useRef(null);
 *   4. useEffect with deps [activeNiche, sebiOnly, debouncedQuery]:
 *        clearTimeout(debounceRef.current);
 *        debounceRef.current = setTimeout(async () => {
 *          setLoading(true);
 *          const params = new URLSearchParams();
 *          if (activeNiche) params.set('niche', activeNiche);
 *          if (sebiOnly)    params.set('sebiOnly', 'true');
 *          if (query)       params.set('q', query);
 *          const res = await apiClient.get(`/api/marketplace/creators?${params}`);
 *          setCreators(res.data.data);
 *          setLoading(false);
 *        }, 300);
 *   5. Map response fields if needed:
 *        - API returns `engagementRate` and `avgViews`
 *        - If your Creator type uses `er` and `views`, either rename in the
 *          type definition or map: creators.map(c => ({ ...c, er: c.engagementRate, views: c.avgViews }))
 *   6. Pass `creators` (or the mapped array) to FlatList data instead of the
 *      filtered CREATORS constant.
 *
 * ─── BRANDMARKETPLACE — handleInspect UPDATE ─────────────────────────────────
 *
 *   After passing existing Redux paywall checks, call:
 *
 *     const res = await apiClient.post(`/api/marketplace/creators/${creator.id}/view`);
 *     const { alreadyViewed, totalViews, limitReached } = res.data.data;
 *
 *     if (limitReached && !alreadyViewed) {
 *       handleShowPaywall();
 *       return;
 *     }
 *
 *     // Proceed normally
 *     setSelectedCreator(creator);
 *     openDrawer();
 *
 * ─── BRANDMARKETPLACE — CONTACT BUTTONS ─────────────────────────────────────
 *
 *   Both openWhatsApp() and openInstagram() should call the contact endpoint
 *   first to retrieve real values, rather than using data already in state:
 *
 *     try {
 *       const res = await apiClient.get(`/api/marketplace/creators/${creator.id}/contact`);
 *       const { phone, instagram } = res.data.data;
 *
 *       // WhatsApp deep link
 *       Linking.openURL(`https://wa.me/${phone}`);
 *
 *       // Instagram deep link
 *       Linking.openURL(`https://instagram.com/${instagram}`);
 *     } catch (err) {
 *       if (err.response?.status === 403) {
 *         handleShowPaywall();
 *       }
 *     }
 *
 * ─── REDUX — incrementProfileView DEPRECATION ────────────────────────────────
 *
 *   - Keep the `incrementProfileView` Redux action for optimistic UI updates
 *     only (e.g. decrementing a local "views remaining" counter instantly).
 *   - Remove `hasReachedProfileViewLimit` from marketplaceUtils.js —
 *     the authoritative limit check is now the `limitReached` boolean
 *     returned by POST /api/marketplace/creators/:profileId/view.
 *   - Source of truth for limit enforcement = backend response, not Redux.
 *
 * ─── BASE URL SETUP ──────────────────────────────────────────────────────────
 *
 *   In your .env / app.config.js:
 *     EXPO_PUBLIC_API_URL=https://server.manchly.com
 *
 *   Or in development:
 *     EXPO_PUBLIC_API_URL=http://localhost:3000
 *
 * ============================================================================
 */
