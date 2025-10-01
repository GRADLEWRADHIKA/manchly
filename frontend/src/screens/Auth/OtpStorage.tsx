import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_STORAGE_KEY = 'demo_auth';

export type StoredAuth = {
  otp: string | null;
  userType: string | null;
};

const defaultStored: StoredAuth = { otp: null, userType: null };

export const saveAuth = async (otp: string, userType: string | null) => {
  try {
    const payload: StoredAuth = { otp, userType };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.log('Failed to save auth:', e);
    return false;
  }
};

export const getAuth = async (): Promise<StoredAuth> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return defaultStored;
    const parsed = JSON.parse(raw) as StoredAuth;
    return {
      otp: parsed.otp ?? null,
      userType: parsed.userType ?? null,
    };
  } catch (e) {
    console.log('Failed to get auth:', e);
    return defaultStored;
  }
};

export const clearAuth = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    return true;
  } catch (e) {
    console.log('Failed to clear auth:', e);
    return false;
  }
};
