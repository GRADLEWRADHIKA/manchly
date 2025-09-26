import AsyncStorage from '@react-native-async-storage/async-storage';

export const OTP_STORAGE_KEY = 'demo_otp_code';

export const saveOtp = async (otp: string) => {
  try {
    await AsyncStorage.setItem(OTP_STORAGE_KEY, otp);
    return true;
  } catch (e) {
    console.log('Failed to save OTP:', e);
    return false;
  }
};

export const getOtp = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(OTP_STORAGE_KEY);
  } catch (e) {
    console.log('Failed to get OTP:', e);
    return null;
  }
};

export const clearOtp = async () => {
  try {
    await AsyncStorage.removeItem(OTP_STORAGE_KEY);
    return true;
  } catch (e) {
    console.log('Failed to clear OTP:', e);
    return false;
  }
};
