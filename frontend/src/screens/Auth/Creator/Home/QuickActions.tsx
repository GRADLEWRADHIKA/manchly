import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Video as VideoIcon, Phone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { wp, hp, fp } from '../../../../utils/responsive';
import colors from '../../../../utils/colors';

const QuickActions = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  const actions = [
    {
      key: 'go-live',
      label: 'Go live',
      Icon: VideoIcon,
      onPress: () => {
        if (user?.kyc_verified) {
          navigation.navigate('CreateWebinar');
        } else {
          navigation.navigate('KYCVerificationScreen');
        }
      },
    },
    {
      key: 'sessions',
      label: '1:1 Sessions',
      Icon: Phone,
      onPress: () =>
        navigation.navigate('ProductsScreen', { initialTab: 'Sessions' }),
    },
  ];

  return (
    <View style={styles.sectionPadding}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        {actions.map(({ key, label, Icon, onPress }) => (
          <TouchableOpacity
            key={key}
            activeOpacity={0.85}
            style={styles.quickActionCard}
            onPress={onPress}
          >
            <View style={styles.quickActionIconWrap}>
              <Icon size={wp(20)} color="#F2E4BC" />
            </View>
            <Text style={styles.quickActionText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  sectionTitle: {
    fontSize: fp(17),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(12),
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: wp(12),
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: wp(16),
    paddingVertical: hp(18),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickActionIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(214,156,64,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  quickActionText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: '#D5C4AB',
  },
});

export default QuickActions;
