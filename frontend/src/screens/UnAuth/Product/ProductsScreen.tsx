import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import AppHeader from '../../../components/AppHeader';
import colors from '../../../utils/colors';
import CreatorView from './CreatorView';
import UserView from './UserView';

const PurchasesScreen: React.FC = () => {
  const { user } = useSelector((state: any) => state.userReducer);
  const Nav = useNavigation<any>();

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Manchly" />

      {user?.user_type === 'CREATOR' ? <CreatorView /> : <UserView />}

      {user?.user_type === 'CREATOR' && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            backgroundColor: colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6,
          }}
          onPress={() => Nav.navigate('CreateProducts')}
          accessibilityLabel="Create course"
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PurchasesScreen;
