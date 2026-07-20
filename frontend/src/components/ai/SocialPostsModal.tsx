import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { X, Copy } from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  scheduledAt?: string;
  registerUrl?: string;
};

const PLATFORMS = [
  { key: 'twitter', label: 'Twitter' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

const SocialPostsModal: React.FC<Props> = ({
  visible, onClose, title, description, scheduledAt, registerUrl,
}) => {
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('twitter');

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiCall('/ai/webinar/social-posts', {
        title,
        ...(description ? { description } : {}),
        ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
        ...(registerUrl ? { register_url: registerUrl } : {}),
      });
      setPosts(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate posts', position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  const getContent = (): string => {
    if (!posts) return '';
    const platform = posts[activeTab];
    if (!platform) return '';
    if (activeTab === 'twitter' && platform.thread) return platform.thread.join('\n\n---\n\n');
    return platform.post || platform.caption || platform.broadcast || '';
  };

  const copyContent = () => {
    const text = getContent();
    if (text) {
      Clipboard.setString(text);
      Toast.show({ type: 'success', text1: 'Copied!', position: 'top' });
    }
  };

  const handleClose = () => { setPosts(null); setActiveTab('twitter'); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Social Posts</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {!posts ? (
          <View style={styles.center}>
            <Text style={styles.subtitle}>Generate social media posts for your webinar</Text>
            <AiButton label="Generate Posts" onPress={generate} loading={loading} />
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
              {PLATFORMS.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.tab, activeTab === p.key && styles.tabActive]}
                  onPress={() => setActiveTab(p.key)}
                >
                  <Text style={[styles.tabText, activeTab === p.key && styles.tabTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.postCard}>
                <Text style={styles.body}>{getContent()}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyContent}>
                  <Copy size={wp(14)} color={colors.white} />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <AiButton label="Regenerate" onPress={generate} loading={loading} />
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
};

export default SocialPostsModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  title: { fontSize: fp(18), fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(12) },
  subtitle: { fontSize: fp(14), color: colors.textSecondary, textAlign: 'center' },
  tabBar: { flexGrow: 0, backgroundColor: colors.white, paddingHorizontal: wp(12), paddingVertical: hp(8) },
  tab: {
    paddingHorizontal: wp(14), paddingVertical: hp(8), borderRadius: wp(20),
    backgroundColor: colors.surface, marginRight: wp(8), borderWidth: 1, borderColor: colors.borderLight,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fp(12), fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  scroll: { padding: wp(16), paddingBottom: hp(40) },
  postCard: {
    backgroundColor: colors.white, borderRadius: wp(12), padding: wp(16),
    marginBottom: hp(16), borderWidth: 1, borderColor: colors.borderLight,
  },
  body: { fontSize: fp(14), color: colors.text, lineHeight: fp(22) },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: wp(6), alignSelf: 'flex-end',
    backgroundColor: colors.primary, paddingHorizontal: wp(14), paddingVertical: hp(8),
    borderRadius: wp(8), marginTop: hp(14),
  },
  copyText: { fontSize: fp(12), fontWeight: '600', color: colors.white },
});
