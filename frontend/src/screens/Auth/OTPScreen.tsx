import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield } from 'lucide-react-native';
import colors from '../../theme/colors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyOtp, clearStoredOtp } from '../../store/authSlice';

const OTPScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { error, otp } = useAppSelector(s => s.auth);

  const [code, setCode] = useState('1234');

  const onBack = () => navigation.goBack();

  const onVerifyPress = async () => {
    if (code.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter the 4-digit code.');
      return;
    }
    const action = await dispatch(verifyOtp(code));
    if (verifyOtp.rejected.match(action)) {
      Alert.alert('Error', (action.payload as string) || 'Verification failed.');
    } else {
      // success — navigation will switch to MainStack automatically via Redux in App
    }
  };

  const onClearPress = async () => {
    const action = await dispatch(clearStoredOtp());
    if (clearStoredOtp.rejected.match(action)) {
      Alert.alert('Error', (action.payload as string) || 'Could not clear the saved code.');
    } else {
      Alert.alert('Cleared', 'Saved code removed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Phone</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 4-digit code to{'\n'}
          {/* <Text style={styles.phoneNumber}>{phone}</Text> */}
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            style={styles.otpInput}
            value={code}
            onChangeText={text => setCode(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="1234"
            placeholderTextColor={colors.muted}
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, code.length === 4 && styles.verifyButtonActive]}
          onPress={onVerifyPress}
          disabled={code.length !== 4}
          activeOpacity={0.8}
        >
          <Text style={[styles.verifyButtonText, code.length === 4 && styles.verifyButtonTextActive]}>
            Verify & Continue
          </Text>
        </TouchableOpacity>

        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            For demo purposes, use <Text style={styles.demoCode}>1234</Text>
          </Text>

          <TouchableOpacity style={styles.resendButton} onPress={() => console.log('Resend OTP (placeholder)')}>
            <Text style={styles.resendText}>Didn't receive code? Resend</Text>
          </TouchableOpacity>

          {otp ? (
            <>
              <View style={{ height: 16 }} />
              <TouchableOpacity style={styles.utilButton} onPress={onClearPress}>
                <Text style={styles.utilButtonText}>Clear Saved OTP</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {error ? (
            <>
              <View style={{ height: 8 }} />
              <Text style={styles.savedNote}>{error}</Text>
            </>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  placeholder: { width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  phoneNumber: { fontWeight: '600', color: colors.text },
  otpContainer: { width: '100%', marginBottom: 32 },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: colors.text,
    fontWeight: '600',
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonActive: { backgroundColor: colors.primary },
  verifyButtonText: { fontSize: 16, fontWeight: '600', color: colors.muted },
  verifyButtonTextActive: { color: '#ffffff' },
  helpSection: { alignItems: 'center', marginTop: 8, width: '100%' },
  helpText: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  demoCode: { fontWeight: '700', color: colors.primary },
  resendButton: { padding: 8 },
  resendText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  savedNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  utilButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  utilButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default OTPScreen;
