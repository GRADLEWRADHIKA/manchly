import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {MessageCircle, X} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import colors from '../../utils/colors';
import {wp, hp} from '../../utils/responsive';
import {useAssistant} from '../../context/AssistantContext';

const AssistantLauncher = () => {

  const TAB_BAR_HEIGHT = hp(60);
  const {isOpen, toggle} = useAssistant();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.85}
      style={[
        s.button,
        {bottom: TAB_BAR_HEIGHT + (insets.bottom || hp(6)) + hp(16)}, 
      ]}>
      {isOpen ? (
        <X size={wp(24)} color={colors.white} />
      ) : (
        <MessageCircle size={wp(24)} color={colors.white} />
      )}
    </TouchableOpacity>
  );
};

export default AssistantLauncher;

const s = StyleSheet.create({
  button: {
    position: 'absolute',
    right: wp(20),
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 999,
  },
});