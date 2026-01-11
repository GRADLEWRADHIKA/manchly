import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { User, Star, X, Check } from 'lucide-react-native';
import colors from '../../utils/colors';

type UserType = 'USER' | 'CREATOR' | null;

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (type: UserType) => void;
}

const ChooseUserType: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
  const [selectedType, setSelectedType] = useState<UserType>(null);

  const handleConfirm = () => {
    if (!selectedType) return;
    onConfirm(selectedType);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Role</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            You can choose only one role at a time
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === 'USER' && styles.selectedCard,
              ]}
              onPress={() => setSelectedType('USER')}
            >
              <User
                size={28}
                color={selectedType === 'USER' ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.optionTitle,
                  selectedType === 'USER' && styles.selectedText,
                ]}
              >
                User
              </Text>
              <Text
                style={[
                  styles.optionDesc,
                  selectedType === 'USER' && styles.selectedText,
                ]}
              >
                Browse & consume content
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === 'CREATOR' && styles.selectedCard,
              ]}
              onPress={() => setSelectedType('CREATOR')}
            >
              <Star
                size={28}
                color={
                  selectedType === 'CREATOR' ? colors.white : colors.secondary
                }
              />
              <Text
                style={[
                  styles.optionTitle,
                  selectedType === 'CREATOR' && styles.selectedText,
                ]}
              >
                Creator
              </Text>
              <Text
                style={[
                  styles.optionDesc,
                  selectedType === 'CREATOR' && styles.selectedText,
                ]}
              >
                Create & publish content
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedType && styles.disabledButton,
            ]}
            disabled={!selectedType}
            onPress={handleConfirm}
          >
            <Check size={18} color={colors.white} />
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ChooseUserType;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '88%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  optionCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  selectedCard: {
    backgroundColor: colors.secPrimary,
    borderColor: colors.secPrimary,
  },
  optionTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionDesc: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  selectedText: {
    color: colors.white,
  },
  confirmButton: {
    marginTop: 22,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: colors.muted,
  },
  confirmText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
