import React from 'react';
import { View } from 'react-native';
import AppHeader from '../../../../components/AppHeader';
import UserView from './UserView';

const PurchasesScreen: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Manchly" />
      <UserView />
    </View>
  );
};

export default PurchasesScreen;
