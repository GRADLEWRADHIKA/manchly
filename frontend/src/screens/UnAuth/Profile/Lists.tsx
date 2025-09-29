import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import {
  Lock,
  Volume2,
  Users,
  MessageCircle,
  GraduationCap,
  Video,
  Gift,
  MessageSquareText,
  Unlock,
  ArrowLeft,
} from 'lucide-react-native';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';

const ListItem = ({ icon: Icon, title, subtitle, onPress, color }: any) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color?.bg }]}>
      <Icon size={22} color={color?.icon || '#fff'} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const Lists = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
        
      <AppHeaderWithBack title="Lists" />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}>
        <ListItem
          icon={Lock}
          title="Locked Messages"
          subtitle="List of created or purchased locked messages"
          color={{ bg: '#FFE0CC', icon: '#FF6B00' }}
        />
        <ListItem
          icon={Volume2}
          title="Channels on Manchly"
          subtitle="List of created and joined channels on Manchly"
          color={{ bg: '#E0F3FF', icon: '#0096FF' }}
        />
        <ListItem
          icon={Users}
          title="Groups on Manchly"
          subtitle="List of created and joined groups on Manchly"
          color={{ bg: '#F1E8FF', icon: '#7A42FF' }}
        />
        <ListItem
          icon={MessageCircle}
          title="Groups on WhatsApp"
          subtitle="List of created and joined groups on WhatsApp"
          color={{ bg: '#E6F9ED', icon: '#25D366' }}
        />
        <ListItem
          icon={MessageCircle}
          title="Groups on Telegram"
          subtitle="List of created and joined groups on Telegram"
          color={{ bg: '#E8F6FF', icon: '#229ED9' }}
        />
        <ListItem
          icon={Volume2}
          title="Channels on Telegram"
          subtitle="List of created and joined channels on Telegram"
          color={{ bg: '#E8F6FF', icon: '#229ED9' }}
        />
        <ListItem
          icon={GraduationCap}
          title="Courses"
          subtitle="List of created and purchased courses"
          color={{ bg: '#E8F9E6', icon: '#2E8B57' }}
        />
        <ListItem
          icon={Video}
          title="Webinar & Workshops"
          subtitle="List of created and purchased webinar & workshops"
          color={{ bg: '#EAF2FF', icon: '#3A6BFF' }}
        />
        <ListItem
          icon={Gift}
          title="Gifts"
          subtitle="List of sent or received gifts"
          color={{ bg: '#FFEAF1', icon: '#FF3B6A' }}
        />
        <ListItem
          icon={MessageSquareText}
          title="Direct Messages"
          subtitle="List of purchased or subscribed direct messages"
          color={{ bg: '#F2E8FF', icon: '#7A42FF' }}
        />
        <ListItem
          icon={Unlock}
          title="Free Products"
          subtitle="List of redeemed or created free products"
          color={{ bg: '#FFF5E0', icon: '#FFA500' }}
        />
      </ScrollView>
    </View>
  );
};

export default Lists;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
});
