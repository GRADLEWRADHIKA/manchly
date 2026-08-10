import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import uuid from 'react-native-uuid';

const DEVICE_ID_KEY = 'manchly_device_id';

/**
 * Returns a stable per-install device id, generating and persisting one on first
 * use. Used for device-limited login (Feature #2).
 */
export async function getDeviceId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = String(uuid.v4());
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // Fall back to an ephemeral id if storage is unavailable
    return String(uuid.v4());
  }
}

/** Device info sent to the backend on login. */
export async function getDeviceInfo(): Promise<{
  device_id: string;
  device_name: string;
  platform: string;
}> {
  const device_id = await getDeviceId();
  return {
    device_id,
    device_name: Platform.OS === 'ios' ? 'iOS device' : 'Android device',
    platform: Platform.OS,
  };
}
