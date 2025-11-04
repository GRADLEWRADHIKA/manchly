import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import AppHeader from '../../../../components/AppHeader';
import colors from '../../../../utils/colors';
import CreatorView from '../../Creator/Products/CreatorView';
import UserView from './UserView';

const PurchasesScreen: React.FC = () => {
  const { user } = useSelector((state: any) => state.userReducer);
  const Nav = useNavigation<any>();

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Manchly" />
      <UserView />
    </View>
  );
};

export default PurchasesScreen;
