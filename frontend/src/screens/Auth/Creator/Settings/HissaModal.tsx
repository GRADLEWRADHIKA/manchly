import React, { memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const CREATOR_PCT = 90;
const PLATFORM_PCT = 10;
const HISSA_MIN = 1000;
const HISSA_MAX = 100000;

interface HissaModalProps {
  visible: boolean;
  onClose: () => void;
}

const HissaModal: React.FC<HissaModalProps> = ({ visible, onClose }) => {
  const [hissaSale, setHissaSale] = useState(1000);

  const hissaCreatorAmount = Math.round((hissaSale * CREATOR_PCT) / 100);
  const hissaPlatformAmount = Math.round((hissaSale * PLATFORM_PCT) / 100);

  const progress = useSharedValue(1000);
  const minSale = useSharedValue(HISSA_MIN);
  const maxSale = useSharedValue(HISSA_MAX);

  const syncFromSlider = useCallback((value: number) => {
    const stepped = Math.round(value / 100) * 100;
    const clamped = Math.max(HISSA_MIN, Math.min(HISSA_MAX, stepped));
    setHissaSale(clamped);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Pressable style={styles.sheetOverlay} onPress={onClose}>
          <Pressable style={styles.sheetContainer} onPress={() => {}}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>💰 Aapki Kamaai ka Hissa</Text>
            <Text style={styles.sheetSubtitle}>
              Har sale pe paisa aisa baanta hai
            </Text>

            <View style={styles.splitBar}>
              <View style={[styles.splitCreator, { flex: CREATOR_PCT }]} />
              <View style={[styles.splitPlatform, { flex: PLATFORM_PCT }]} />
            </View>

            <View style={styles.splitLegendRow}>
              <View style={styles.splitLegendItem}>
                <View style={styles.splitLegendRowTop}>
                  <View
                    style={[
                      styles.splitDot,
                      { backgroundColor: colors.creatorGreen },
                    ]}
                  />
                  <Text style={styles.splitLegendLabel}>Aapka (Creator)</Text>
                </View>
                <Text
                  style={[
                    styles.splitLegendValue,
                    { color: colors.creatorGreenDark },
                  ]}
                >
                  {CREATOR_PCT}%
                </Text>
              </View>
              <View
                style={[styles.splitLegendItem, { alignItems: 'flex-end' }]}
              >
                <View style={styles.splitLegendRowTop}>
                  <Text style={styles.splitLegendLabel}>Manchly</Text>
                  <View
                    style={[
                      styles.splitDot,
                      { backgroundColor: colors.secondary },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.splitLegendValue,
                    { color: colors.secondary },
                  ]}
                >
                  {PLATFORM_PCT}%
                </Text>
              </View>
            </View>

            <View style={styles.sheetDivider} />

            <Text style={styles.calcLabel}>
              🧮 Apna amount daalo, result dekho
            </Text>

            <View style={styles.sliderWrapper}>
              <Slider
                progress={progress}
                minimumValue={minSale}
                maximumValue={maxSale}
                onValueChange={(v) => runOnJS(syncFromSlider)(v)}
                onSlidingComplete={syncFromSlider}
                bubble={(v) =>
                  `₹${Math.round(v).toLocaleString('en-IN')}`
                }
                theme={{
                  minimumTrackTintColor: colors.creatorGreen,
                  maximumTrackTintColor: colors.trackDark,
                  bubbleBackgroundColor: colors.creatorGreen,
                  bubbleTextColor: colors.white,
                }}
                sliderHeight={hp(10)}
                thumbWidth={wp(26)}
                bubbleTranslateY={-hp(10)}
                panHitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }}
                containerStyle={styles.sliderInner}
              />
            </View>

            <Text style={styles.saleAmountText}>
              ₹{hissaSale.toLocaleString('en-IN')} ki sale
            </Text>

            <View style={styles.resultRow}>
              <View style={[styles.resultBox, styles.resultCreator]}>
                <Text style={styles.resultLabel}>😋 Aapko milega</Text>
                <Text
                  style={[
                    styles.resultValue,
                    { color: colors.creatorGreenDark },
                  ]}
                >
                  ₹{hissaCreatorAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.resultBox, styles.resultPlatform]}>
                <Text style={styles.resultLabel}>🏢 Manchly ka</Text>
                <Text
                  style={[styles.resultValue, { color: colors.secondary }]}
                >
                  ₹{hissaPlatformAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default memo(HissaModal);

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.cCard,
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.cBorder,
    paddingHorizontal: wp(20),
    paddingTop: hp(10),
    paddingBottom: hp(28),
  },
  sheetHandle: {
    width: wp(40),
    height: hp(4),
    borderRadius: wp(2),
    backgroundColor: colors.cTextMuted,
    alignSelf: 'center',
    marginBottom: hp(16),
  },
  sheetTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.cText,
  },
  sheetSubtitle: {
    fontSize: fp(13),
    color: colors.cTextSecondary,
    marginTop: hp(4),
    marginBottom: hp(18),
  },
  splitBar: {
    flexDirection: 'row',
    height: hp(14),
    borderRadius: wp(20),
    overflow: 'hidden',
    backgroundColor: colors.splitBarBg,
  },
  splitCreator: {
    backgroundColor: colors.creatorGreen,
  },
  splitPlatform: {
    backgroundColor: colors.secondary,
  },
  splitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(12),
  },
  splitLegendItem: {
    flex: 1,
  },
  splitLegendRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  splitDot: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },
  splitLegendLabel: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },
  splitLegendValue: {
    fontSize: fp(22),
    fontWeight: '900',
    marginTop: hp(4),
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.cBorder,
    marginVertical: hp(18),
  },
  calcLabel: {
    fontSize: fp(13),
    color: colors.cTextSecondary,
    fontWeight: '500',
    marginBottom: hp(14),
  },
  sliderWrapper: {
    marginTop: hp(24),
    marginBottom: hp(8),
    paddingHorizontal: wp(4),
  },
  sliderInner: {
    borderRadius: hp(5),
  },
  saleAmountText: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.cText,
    textAlign: 'center',
    marginVertical: hp(10),
  },
  resultRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginTop: hp(8),
  },
  resultBox: {
    flex: 1,
    paddingVertical: hp(14),
    paddingHorizontal: wp(14),
    borderRadius: wp(14),
    alignItems: 'center',
  },
  resultCreator: {
    backgroundColor: colors.creatorGreenLight,
  },
  resultPlatform: {
    backgroundColor: colors.platformLight,
  },
  resultLabel: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
    marginBottom: hp(4),
  },
  resultValue: {
    fontSize: fp(22),
    fontWeight: '900',
  },
});
