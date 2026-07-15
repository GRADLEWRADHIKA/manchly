import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type UserType = 'USER' | 'CREATOR' | null;

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (type: UserType) => void;
}

const ChooseUserType: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
  const [selectedType, setSelectedType] = useState<UserType>(null);

  const handleConfirm = () => {
    if (!selectedType) return;
    onConfirm(selectedType);
    onClose();
  };

 return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Half - Image */}
          <View style={styles.topHalf}>
            <Image
              source={require('../../image/boarding.jpg')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Sheet */}
          <View style={styles.bottomSheet}>
            <Text style={styles.title}>Welcome</Text>

            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedType('CREATOR');
                onConfirm('CREATOR');
                onClose();
              }}
            >
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Creator</Text>
                <Text style={styles.optionDesc}>Create & Publish content</Text>
              </View>
              <ChevronRight size={wp(22)} color={colors.black} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedType('USER');
                onConfirm('USER');
                onClose();
              }}
            >
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>User</Text>
                <Text style={styles.optionDesc}>Browse & consume content</Text>
              </View>
              <ChevronRight size={wp(22)} color={colors.black} />
            </TouchableOpacity>

            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service, Privacy Policy & Refund Policy
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChooseUserType;

const styles = StyleSheet.create({
  overlay: {
    height: hp(812),
    width: wp(375),
    backgroundColor: colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  topHalf: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: wp(260),
    height: wp(260),
  },
  bottomSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: wp(28),
    borderTopRightRadius: wp(28),
    paddingHorizontal: wp(24),
    paddingTop: hp(32),
    paddingBottom: hp(30),
  },
  title: {
    fontSize: fp(28),
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: hp(28),
    letterSpacing: 0.2,
  },
  optionCard: {
    marginTop: hp(14),
    backgroundColor: colors.golden,
    paddingVertical: hp(18),
    paddingHorizontal: wp(20),
    borderRadius: wp(18),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fp(16.5),
    fontWeight: '700',
    color: colors.black,
    marginBottom: hp(2),
  },
  optionDesc: {
    fontSize: fp(12),
    fontWeight: '500',
    color: 'rgba(0,0,0,0.65)',
  },
  footerText: {
    fontSize: fp(11),
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fp(17),
    marginTop: hp(20),
    marginBottom: hp(8),
  },
});