import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { updateProfile } from '../../../../store/UserSlice';

const EditProfile: React.FC = () => {
  const Nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const { user } = useSelector((state: any) => state.userReducer);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const hasChanges = name !== (user?.name || '') || phone !== (user?.phone || '');

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name cannot be empty', position: 'top' });
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        updateProfile({ name: name.trim(), phone_number: phone.trim() }),
      ).unwrap();
      Toast.show({ type: 'success', text1: 'Profile updated', position: 'top' });
      Nav.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: err?.message || 'Something went wrong',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => Nav.goBack()} hitSlop={10}>
            <ArrowLeft size={wp(22)} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: wp(22) }} />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.user.subHeading}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Your phone number"
          placeholderTextColor={colors.user.subHeading}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <View style={[styles.input, styles.inputDisabled]}>
          <Text style={styles.disabledText}>{user?.email || ''}</Text>
        </View>
        <Text style={styles.helperText}>Email address cannot be changed</Text>

        <Pressable
          style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.user.bg },
  headerWrapper: { zIndex: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerTitle: { fontSize: fp(17), fontWeight: '700', color: colors.user.text },
  body: { flex: 1 },
  scrollContent: { padding: wp(16), paddingBottom: hp(40) },
  label: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.user.subHeading,
    marginBottom: hp(6),
    marginTop: hp(16),
  },
  input: {
    backgroundColor: colors.user.card,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    fontSize: fp(15),
    color: colors.user.text,
  },
  inputDisabled: { opacity: 0.6, justifyContent: 'center' },
  disabledText: { fontSize: fp(15), color: colors.user.subHeading },
  helperText: { fontSize: fp(11), color: colors.user.subHeading, marginTop: hp(4) },
  saveButton: {
    marginTop: hp(28),
    backgroundColor: colors.user.accent,
    borderRadius: wp(14),
    paddingVertical: hp(14),
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: fp(15), fontWeight: '700', color: colors.white },
});