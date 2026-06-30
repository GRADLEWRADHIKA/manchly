import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import NotAuthorized from './NotAuthorized';
import { canAccessMarketplace } from '../utils/marketplaceUtils';

type MarketplaceRouteGuardProps = {
  children: React.ReactNode;
  redirectToDashboard?: boolean;
};

const MarketplaceRouteGuard: React.FC<MarketplaceRouteGuardProps> = ({
  children,
  redirectToDashboard = false,
}) => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const isAllowed = canAccessMarketplace(user);

  useEffect(() => {
    if (!isAllowed && redirectToDashboard) {
      navigation.navigate('Home');
    }
  }, [isAllowed, navigation, redirectToDashboard]);

  if (!isAllowed) {
    if (redirectToDashboard) {
      return null;
    }

    return (
      <NotAuthorized
        onAction={() =>
          navigation.navigate('Home')
        }
      />
    );
  }

  return <>{children}</>;
};

export default MarketplaceRouteGuard;
