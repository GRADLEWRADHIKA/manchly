import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

type Props = {
  whatsappUrl: string;
  onChangeWhatsapp: (v: string) => void;
  message: string;
  onChangeMessage: (v: string) => void;
};

const CommunityLinkField: React.FC<Props> = ({
  whatsappUrl,
  onChangeWhatsapp,
  message,
  onChangeMessage,
}) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <MessageCircle size={wp(15)} color={colors.gold} />
        <Text style={styles.label}>Community & thank-you</Text>
      </View>
      <Text style={styles.help}>
        Shown to buyers on the thank-you screen after purchase.
      </Text>

      <Text style={styles.fieldLabel}>WhatsApp community link</Text>
      <TextInput
        style={styles.input}
        placeholder="https://chat.whatsapp.com/..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="url"
        value={whatsappUrl}
        onChangeText={onChangeWhatsapp}
      />

      <Text style={[styles.fieldLabel, { marginTop: hp(14) }]}>
        Thank-you message (optional)
      </Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="A short note buyers see after purchase"
        placeholderTextColor={colors.textMuted}
        value={message}
        onChangeText={onChangeMessage}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
};

export default CommunityLinkField;

const styles = StyleSheet.create({
  wrap: {
    marginTop: hp(20),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(7),
  },
  label: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white,
  },
  help: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(4),
    marginBottom: hp(12),
  },
  fieldLabel: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(8),
  },
  input: {
    backgroundColor: colors.cBg,
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: colors.cBorder,
    paddingHorizontal: wp(14),
    paddingVertical: hp(11),
    fontSize: fp(14),
    color: colors.white,
  },
  textArea: {
    minHeight: hp(72),
  },
});
