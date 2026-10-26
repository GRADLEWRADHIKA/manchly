import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useHotUpdaterStore } from '@hot-updater/react-native';
import SplashScreen from 'react-native-splash-screen';
import colors from '../utils/colors';
import {
  hotUpdater,
  reportUpdateError,
  UPDATE_STRATEGY,
} from '../services/HotUpdaterService';

type GateState = 'checking' | 'updating' | 'ready';

// Resolves true when the app is restarting into a new bundle.
const applyPendingUpdate = async (onUpdating: () => void): Promise<boolean> => {
  // Returns null in debug builds, when up to date, or after a failed check.
  const update = await hotUpdater.checkForUpdate({
    updateStrategy: UPDATE_STRATEGY,
  });
  if (!update) {
    return false;
  }

  onUpdating();
  const downloaded = await update.updateBundle();
  if (!downloaded) {
    throw new Error('Could not prepare the update');
  }

  await hotUpdater.reload();
  return true;
};

const UpdateProgress = () => {
  const progress = useHotUpdaterStore(state => state.progress);
  const percent = Math.round(progress * 100);

  return (
    <>
      <Text style={styles.title}>Updating Manchly</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.percent}>{percent}%</Text>
    </>
  );
};

// Blocks the app on launch while an OTA update is checked, downloaded and applied.
const OtaUpdateGate = ({ children }: { children: React.ReactNode }) => {
  const [gateState, setGateState] = useState<GateState>('checking');

  useEffect(() => {
    applyPendingUpdate(() => {
      SplashScreen.hide();
      setGateState('updating');
    })
      .catch(error => {
        reportUpdateError(error);
        return false;
      })
      .then(isReloading => {
        if (!isReloading) {
          setGateState('ready');
        }
      });
  }, []);

  if (gateState === 'ready') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Image source={require('../image/Logo.jpg')} style={styles.logo} />
      {gateState === 'updating' && <UpdateProgress />}
    </View>
  );
};

export default OtaUpdateGate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
  },
  track: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.inputBg,
    marginTop: 16,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.gold,
  },
  percent: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
