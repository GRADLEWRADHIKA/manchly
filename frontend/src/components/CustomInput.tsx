import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import React, { useState } from 'react';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

interface props {
  isLeftIcon?: Boolean;
  leftIcon?: React.ReactNode;
  isRightIcon?: Boolean;
  rightIcon?: React.ReactNode;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  isError?: Boolean;
  errorText?: String;
  multiline?: boolean;
  sendTextIcon?: boolean;
  searchIcon?: boolean;
  handleRightIconPress?: () => void;
  onChange?: any;
  onBlur?: any;
  value?: any;
  showFullHeight?: boolean;
  passwordFild?: boolean;
  disabled?: boolean;
}

type CustomTextInputProps = TextInputProps & props;
const CustomTextInput: React.FC<CustomTextInputProps> = ({
  isLeftIcon,
  isRightIcon,
  rightIcon,
  onChange,
  onBlur,
  value,
  leftIcon,
  inputStyle,
  inputContainerStyle,
  handleRightIconPress,
  isError,
  multiline = false,
  searchIcon = false,
  errorText,
  sendTextIcon = false,
  placeholder,
  showFullHeight,
  passwordFild = false,
  disabled = false,
  ...restProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [leftData, setLeftData] = useState(false)

  return (
    <React.Fragment>
      <View style={[styles.container, inputContainerStyle]}>
        {isLeftIcon && leftIcon}

        <TextInput
          underlineColorAndroid={'transparent'}
          style={[
            styles.textInput,
            inputStyle,
            showFullHeight ? { height: '100%' } : {},
            { width: passwordFild === true ? '90%' : '100%' }
          ]}
          placeholder={placeholder}
          {...restProps}
          multiline={multiline}
          onChangeText={onChange}
          onBlur={onBlur}
          textAlignVertical="top"
          value={value}
          secureTextEntry={passwordFild ? !isPasswordVisible : false}
          editable={!disabled}
          placeholderTextColor={'grey'}
        />

      </View>
      {isError && <Text>{errorText}</Text>}
    </React.Fragment>
  );
};

export default CustomTextInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(56),
  },
  textInput: {
    fontSize: fp(14),
    marginTop: hp(2),
    color: colors.black

  },
  searchIcon: {
    position: 'absolute',
    fontSize: fp(20),
    left: wp(10),
  },
  placeholder: {
    color: colors.black,
    fontSize: fp(14)
  }
});
