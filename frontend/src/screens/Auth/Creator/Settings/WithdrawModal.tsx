import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  WalletMinimal,
  Clock,
  Landmark,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  withdrawableBalance: number;
  bankAccount: any;
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const getT2Date = () => {
  const eta = new Date();
  let businessDays = 0;
  while (businessDays < 2) {
    eta.setDate(eta.getDate() + 1);
    const day = eta.getDay();
    if (day !== 0 && day !== 6) businessDays++;
  }
  return eta.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  visible,
  onClose,
  withdrawableBalance,
  bankAccount,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalIconWrap}>
            <WalletMinimal size={wp(28)} color={colors.primary} />
          </View>
          <Text style={styles.modalTitle}>Withdraw Funds</Text>

          <View style={styles.modalAmountCard}>
            <Text style={styles.modalAmountLabel}>Amount to be settled</Text>
            <Text style={styles.modalAmountValue}>
              ₹ {formatAmount(withdrawableBalance)}
            </Text>
          </View>

          <View style={styles.modalInfoRow}>
            <Clock size={wp(16)} color={colors.info} />
            <Text style={styles.modalInfoText}>
              Your money will be credited to your bank account by{' '}
              <Text style={styles.boldText}>{getT2Date()}</Text> (T+2
              settlement period).
            </Text>
          </View>

          {bankAccount && (
            <View style={styles.modalBankRow}>
              <Landmark size={wp(16)} color={colors.textSecondary} />
              <Text style={styles.modalBankText}>
                Crediting to: {bankAccount.account_number} (
                {bankAccount.ifsc_code})
              </Text>
            </View>
          )}

          <View style={styles.modalNoteRow}>
            <Info size={wp(14)} color={colors.secondary} />
            <Text style={styles.modalNoteText}>
              Settlements are processed automatically. Your earnings will be
              transferred after the T+2 settlement period.
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => {
                onClose();
                Toast.show({
                  type: 'success',
                  text1: 'Settlement Scheduled',
                  text2: `₹${formatAmount(
                    withdrawableBalance,
                  )} will be credited by ${getT2Date()}`,
                  position: 'bottom',
                });
              }}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={wp(16)} color={colors.white} />
              <Text style={styles.modalConfirmText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default memo(WithdrawModal);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(20),
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    width: '100%',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(16),
  },
  modalAmountCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: wp(14),
    paddingVertical: hp(16),
    paddingHorizontal: wp(20),
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  modalAmountLabel: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: hp(4),
  },
  modalAmountValue: {
    fontSize: fp(28),
    fontWeight: '900',
    color: colors.text,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(10),
    backgroundColor: colors.info + '10',
    padding: wp(12),
    borderRadius: wp(12),
    width: '100%',
    marginBottom: hp(10),
  },
  modalInfoText: {
    flex: 1,
    fontSize: fp(12),
    color: colors.info,
    lineHeight: fp(17),
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '700',
  },
  modalBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: '#f8f9fa',
    padding: wp(12),
    borderRadius: wp(10),
    width: '100%',
    marginBottom: hp(10),
  },
  modalBankText: {
    flex: 1,
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(8),
    padding: wp(12),
    width: '100%',
    marginBottom: hp(16),
  },
  modalNoteText: {
    flex: 1,
    fontSize: fp(11),
    color: colors.textSecondary,
    lineHeight: fp(16),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: wp(10),
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: hp(46),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#eaecef',
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: fp(14),
  },
  modalConfirmBtn: {
    flex: 1,
    height: hp(46),
    borderRadius: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    gap: wp(6),
  },
  modalConfirmText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(14),
  },
});
