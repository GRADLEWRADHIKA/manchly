import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Lock } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { FormField } from '../../../../components/FormField';

interface FormState {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
}

const BankDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState<FormState>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
  });

  const fields = [
    {
      key: 'accountHolderName' as keyof FormState,
      label: 'ACCOUNT HOLDER NAME',
      placeholder: 'Aaj Shyam Sharma',
    },
    {
      key: 'bankName' as keyof FormState,
      label: 'BANK NAME',
      placeholder: 'e.g. State Bank of India',
    },
    {
      key: 'accountNumber' as keyof FormState,
      label: 'ACCOUNT NUMBER',
      placeholder: '••••••••••',
      keyboardType: 'numeric' as const,
      secureTextEntry: true,
    },
    {
      key: 'confirmAccountNumber' as keyof FormState,
      label: 'CONFIRM ACCOUNT NUMBER',
      placeholder: '•••••••••••••••',
      secureTextEntry: true,
    },
    {
      key: 'ifscCode' as keyof FormState,
      label: 'IFSC CODE',
      placeholder: 'e.g. SBIN0012345',
    },
  ];

  const handleInputChange = (key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const { accountHolderName, bankName, accountNumber, confirmAccountNumber, ifscCode } = form;

    if (!accountHolderName || !bankName || !accountNumber || !confirmAccountNumber || !ifscCode) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields',
        text2: 'Please fill in all bank details.',
        position: 'bottom',
      });
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Account numbers do not match.',
        position: 'bottom',
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Verification Successful',
      text2: 'Your bank details have been securely saved.',
      position: 'bottom',
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg || '#0F0F0F'} />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro Text */}
        <Text style={styles.introText}>
          Securely manage your withdrawal settings and bank information.
        </Text>

        {/* Form Card */}
        <View style={styles.card}>
          {fields.map(field => (
            <FormField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChangeText={value => handleInputChange(field.key, value)}
              keyboardType={field.keyboardType}
              secureTextEntry={field.secureTextEntry}
            />
          ))}

          {/* Info Lock Note */}
          <View style={styles.infoRow}>
            <Lock size={12} color={colors.textMuted || '#555558'} style={styles.lockIcon} />
            <Text style={styles.infoText}>
              Your details are encrypted and securely stored.
            </Text>
          </View>
        </View>

        {/* Verify & Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Verify & Save →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BankDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border || '#2A2A2C',
  },
  backButton: {
    padding: wp(4),
  },
  headerTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(24),
  },
  introText: {
    fontSize: fp(13),
    color: colors.textSecondary || '#888888',
    paddingHorizontal: wp(16),
    paddingVertical: hp(16),
    lineHeight: fp(20),
  },
  card: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(16),
    marginHorizontal: wp(16),
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(12),
  },
  lockIcon: {
    marginRight: wp(6),
  },
  infoText: {
    fontSize: fp(11),
    color: colors.textMuted || '#555558',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.gold || '#F0C040',
    height: hp(50),
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(16),
  },
  saveButtonText: {
    color: '#000000',
    fontSize: fp(14),
    fontWeight: '700',
  },
});
