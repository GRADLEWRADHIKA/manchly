import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React from 'react';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
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

const settingsItems = [
  {
    title: 'Lock Direct Message',
    subtitle: 'Make your direct message locked',
    icon: <Lock size={wp(22)} color="#1A1A2E" />,
    onPress: () => {},
  },
  {
    title: 'FAQs',
    subtitle: 'Have a doubt about Manchly? Use our FAQ guide to solve them',
    icon: <HelpCircle size={wp(22)} color="#1A1A2E" />,
    onPress: () => {},
  },
  {
    title: 'Upload your Invoice Details',
    subtitle: 'Sign and enter GST details.',
    icon: <FileText size={wp(22)} color="#1A1A2E" />,
    onPress: () => {},
  },
  {
    title: 'Need help?',
    subtitle: 'Get in touch with team Manchly',
    icon: <MessageCircleQuestion size={wp(22)} color="#1A1A2E" />,
    onPress: () => {},
  }
];

const CreatorSettingsDetails = () => {
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Settings" />
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

export default CreatorSettingsDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    borderBottomColor: '#E2E8F0',
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
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: fp(13),
    color: '#94A3B8',
    marginTop: hp(2),
  },
});
