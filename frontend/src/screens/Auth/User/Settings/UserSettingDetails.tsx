import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React from 'react';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {
  User,
  Lock,
  MonitorPlay,
  Key,
  HelpCircle,
  FileText,
  MessageCircleQuestion,
  LogOut,
} from 'lucide-react-native';
import { wp, hp, fp } from '../../../../utils/responsive';

const settingsItems = [
  {
    title: 'Lock Direct Message',
    subtitle: 'Make your direct message locked',
    icon: <Lock size={wp(22)} color={colors.black} />,
    onPress: () => {},
  },
  {
    title: 'FAQs',
    subtitle: 'Have a doubt about Manchly? Use our FAQ guide to solve them',
    icon: <HelpCircle size={wp(22)} color={colors.black} />,
    onPress: () => {},
  },
  {
    title: 'Upload your Invoice Details',
    subtitle: 'Sign and enter GST details.',
    icon: <FileText size={wp(22)} color={colors.black} />,
    onPress: () => {},
  },
  {
    title: 'Need help?',
    subtitle: 'Get in touch with team Manchly',
    icon: <MessageCircleQuestion size={wp(22)} color={colors.black} />,
    onPress: () => {},
  }
];

const UserSettingsDetails = () => {
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Settings" bgColor={colors.uBg} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {settingsItems?.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={item.onPress}
          >
            <View style={styles.icon}>{item.icon}</View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default UserSettingsDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.uBg,
  },
  scrollContainer: {
    paddingVertical: hp(8),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(16),
    paddingHorizontal: wp(20),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: wp(16),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.black,
  },
  subtitle: {
    fontSize: fp(13),
    color: colors.muted,
    marginTop: hp(2),
  },
});
