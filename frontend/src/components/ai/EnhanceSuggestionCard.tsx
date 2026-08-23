import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Sparkles, X, ArrowRight } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';

type EnhanceResponse = {
  original: string;
  enhanced: string;
  changes_summary: string;
  alternatives: string[];
};

type Props = {
  value: string;
  onAccept: (text: string) => void;
  endpoint: string;
  kind?: string;
  tone?: string;
  inline?: boolean;
};

const EnhanceSuggestionCard: React.FC<Props> = ({
  value, onAccept, endpoint, kind = 'general', tone, inline = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<EnhanceResponse | null>(null);

  const enhance = async () => {
    if (!value || value.trim().length < 3) {
      Toast.show({ type: 'error', text1: 'Type at least 3 characters first', position: 'top' });
      return;
    }
    setLoading(true);
    try {
      const payload: any = { text: value, kind };
      if (tone) payload.tone = tone;
      const res = await aiCall<{ provider: string; data: EnhanceResponse }>(endpoint, payload);
      const data = res.data ?? (res as any);
      if ((res as any).provider === 'mock') {
        console.warn('[AI] mock response — HF_TOKEN not set');
      }
      setSuggestion(data);
    } catch (err: any) {
      console.log('[AI Enhance] endpoint:', endpoint);
      console.log('[AI Enhance] payload:', { text: value, kind, tone });
      console.log('[AI Enhance] error:', err?.response?.status, err?.response?.data || err?.message);
      Toast.show({ type: 'error', text1: 'Failed to enhance', position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  const accept = (text: string) => {
    onAccept(text);
    setSuggestion(null);
  };

  const dismiss = () => setSuggestion(null);

  const renderSuggestionContent = () => {
    if (!suggestion) return null;
    return (
      <>
        <View style={styles.originalBlock}>
          <Text style={styles.sectionLabel}>Original</Text>
          <Text style={styles.originalText}>{suggestion.original}</Text>
        </View>

        <View style={styles.enhancedBlock}>
          <Text style={styles.enhancedLabel}>Enhanced</Text>
          <Text style={styles.enhancedText}>{suggestion.enhanced}</Text>
          <TouchableOpacity style={styles.useBtn} onPress={() => accept(suggestion.enhanced)}>
            <Text style={styles.useBtnText}>Use this</Text>
            <ArrowRight size={wp(14)} color={colors.white} />
          </TouchableOpacity>
        </View>

        {suggestion.changes_summary ? (
          <Text style={styles.summary}>{suggestion.changes_summary}</Text>
        ) : null}

        {suggestion.alternatives?.length > 0 && (
          <>
            <Text style={styles.altLabel}>Alternatives</Text>
            <View style={styles.altRow}>
              {suggestion.alternatives.map((alt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.altChip}
                  onPress={() => accept(alt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.altText}>{alt}</Text>
                  <ArrowRight size={wp(12)} color={colors.faaAiPrimary} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.keepBtn} onPress={dismiss}>
          <Text style={styles.keepBtnText}>Keep original</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={enhance}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.faaAiPrimary} />
        ) : (
          <Sparkles size={wp(12)} color={colors.faaAiPrimary} />
        )}
        <Text style={styles.triggerText}>
          {loading ? 'Enhancing...' : 'Enhance'}
        </Text>
      </TouchableOpacity>

      {inline && suggestion ? (
        <View style={styles.inlineCard}>
          {renderSuggestionContent()}
        </View>
      ) : (
        <Modal
          visible={!!suggestion}
          animationType="slide"
          transparent
          onRequestClose={dismiss}
        >
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={dismiss} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHandle} />
                <TouchableOpacity style={styles.dismissBtn} onPress={dismiss}>
                  <X size={wp(18)} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
              >
                {renderSuggestionContent()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </>
  );
};

export default EnhanceSuggestionCard;

const styles = StyleSheet.create({
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.faaAiPrimary + '15',
    paddingHorizontal: wp(8),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  triggerText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.faaAiPrimary,
  },

  // Inline mode
  inlineCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    padding: wp(14),
    marginTop: hp(10),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Modal overlay
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // Bottom sheet
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
    maxHeight: '75%',
    paddingBottom: hp(30),
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: hp(10),
    paddingBottom: hp(6),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandle: {
    width: wp(36),
    height: hp(4),
    borderRadius: wp(2),
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: hp(6),
  },
  dismissBtn: {
    position: 'absolute',
    top: hp(10),
    right: wp(16),
    padding: wp(4),
  },
  sheetContent: {
    padding: wp(16),
    paddingBottom: hp(20),
  },

  // Original
  originalBlock: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: wp(10),
    padding: wp(12),
    marginBottom: hp(12),
  },
  sectionLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: hp(4),
  },
  originalText: {
    fontSize: fp(14),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(21),
  },

  // Enhanced
  enhancedBlock: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderRadius: wp(10),
    padding: wp(12),
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
    marginBottom: hp(10),
  },
  enhancedLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
    marginBottom: hp(4),
  },
  enhancedText: {
    fontSize: fp(14),
    color: '#FFFFFF',
    lineHeight: fp(21),
    marginBottom: hp(10),
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: wp(6),
    backgroundColor: '#60A5FA',
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: wp(10),
  },
  useBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
  },

  // Summary
  summary: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    marginBottom: hp(12),
    lineHeight: fp(18),
  },

  // Alternatives
  altLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: hp(6),
  },
  altRow: {
    gap: hp(8),
    marginBottom: hp(16),
  },
  altChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  altText: {
    flex: 1,
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.7)',
    lineHeight: fp(19),
    marginRight: wp(8),
  },

  // Keep original
  keepBtn: {
    alignItems: 'center',
    paddingVertical: hp(12),
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  keepBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
});
