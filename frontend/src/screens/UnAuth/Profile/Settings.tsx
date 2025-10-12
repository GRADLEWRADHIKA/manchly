import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import colors from '../../../utils/colors'
import AppHeaderWithBack from '../../../components/AppHeaderWithBack'
import {
  User,
  Lock,
  MonitorPlay,
  Key,
  HelpCircle,
  FileText,
  MessageCircleQuestion,
  LogOut,
} from 'lucide-react-native'

const settingsItems = [
  {
    title: 'Profile',
    subtitle: 'Update profile pic, name, city and social profile links',
    icon: <User size={22} color={colors.black} />,
    onPress: () => console.log('Profile'),
  },
  {
    title: 'Lock Direct Message',
    subtitle: 'Make your direct message locked',
    icon: <Lock size={22} color={colors.black} />,
    onPress: () => console.log('Lock Direct Message'),
  },
  {
    title: 'Add Profile Intro',
    subtitle: 'Add images or video to show up on your profile page',
    icon: <MonitorPlay size={22} color={colors.black} />,
    onPress: () => console.log('Add Profile Intro'),
  },
  {
    title: 'Account & Privacy',
    subtitle: 'Update account & privacy settings',
    icon: <Key size={22} color={colors.black} />,
    onPress: () => console.log('Account & Privacy'),
  },
  {
    title: 'FAQs',
    subtitle: 'Have a doubt about Manchly? Use our FAQ guide to solve them',
    icon: <HelpCircle size={22} color={colors.black} />,
    onPress: () => console.log('FAQs'),
  },
  {
    title: 'Upload your Invoice Details',
    subtitle: 'Sign and enter GST details.',
    icon: <FileText size={22} color={colors.black} />,
    onPress: () => console.log('Upload Invoice Details'),
  },
  {
    title: 'Need help?',
    subtitle: 'Get in touch with team Manchly',
    icon: <MessageCircleQuestion size={22} color={colors.black} />,
    onPress: () => console.log('Need Help'),
  },
  // {
  //   title: 'Sign out',
  //   subtitle: 'Sign out from this device',
  //   icon: <LogOut size={22} color={colors.black} />,
  //   onPress: () => console.log('Sign Out'),
  // },
]

const Settings = () => {
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Settings" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {settingsItems?.map((item, index) => (
          <TouchableOpacity key={index} style={styles.item} onPress={item.onPress}>
            <View style={styles.icon}>{item.icon}</View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

export default Settings

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
})