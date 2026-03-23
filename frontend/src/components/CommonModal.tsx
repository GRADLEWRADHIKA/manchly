import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

const { width } = Dimensions.get('window');

const DynamicModal = ({
  visible,
  heading,
  message,
  onCancel,
  onDelete,
  loading,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.heading}>{heading}</Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onDelete}
            >
              <Text style={styles.deleteText}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size={'small'} />
                ) : (
                  'Delete'
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DynamicModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: colors.white,
    borderRadius: wp(15),
    padding: wp(20),
    elevation: 10,
  },
  heading: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.heading,
    textAlign: 'center',
  },
  message: {
    fontSize: fp(15),
    color: colors.subtext,
    textAlign: 'center',
    marginVertical: hp(15),
    lineHeight: fp(20),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: hp(10),
  },
  button: {
    width: '40%',
    paddingVertical: hp(10),
    borderRadius: wp(10),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  cancelText: {
    color: colors.primary,
    fontWeight: '600',
  },
  deleteText: {
    color: colors.white,
    fontWeight: '600',
  },
});
