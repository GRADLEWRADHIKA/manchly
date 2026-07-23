import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Earnings from '../screens/Auth/Profile/Earnings';
import UserProfile from '../screens/Auth/Profile/UserProfile';
import Dashboard from '../screens/Auth/Profile/Dashboard';
import SuperThank from '../screens/Auth/Profile/SuperThank';
import Wallet from '../screens/Auth/Profile/Wallet';
import CreateProducts from '../screens/Auth/Creator/Products/Course/CreateProducts';
import CreateWebinarScreen from '../screens/Auth/Creator/Products/Webinar/CreateWebinar';
import CreateCourse from '../screens/Auth/Creator/Products/Course/CreateCourse';
import WalletCreator from '../screens/Auth/Wallet/WalletCreator';
import UserBottomTab from './UserBottomTab';
import UserSettingsDetails from '../screens/Auth/User/Settings/UserSettingDetails';
import CourseDetailsScreen from '../screens/Auth/Product/CourseDetailsScreen';
import UserCourseSearch from '../screens/Auth/User/Search/UserCourseSearch';
import UserVideoList from '../screens/Auth/User/Home/UserVideoList';
import WebinarDetails from '../screens/Auth/User/Home/WebinarDetails';
import KYCVerificationScreen from '../screens/Auth/Creator/Kyc/KYCVerificationScreen';
import CreatorPublicProfile from '../screens/Auth/Creator/Profile/CreatorPublicProfile';
import CallScreen from '../screens/Auth/User/Astrologer/CallScreen';
import IncomingCallScreen from '../screens/Auth/Creator/Astrologer/IncomingCallScreen';
import ExpertList from '../screens/Auth/User/Sessions/ExpertList';
import ExpertDetail from '../screens/Auth/User/Sessions/ExpertDetail';
import SessionRatingScreen from '../screens/Auth/User/Sessions/SessionRatingScreen';
import UserNotification from '../screens/Auth/User/Notifications/UserNotification';
import ChatThread from '../screens/Auth/User/Chat/ChatThread';
import SettlementHistory from '../screens/Auth/Creator/Wallet/SettlementHistory';
import ProductsScreen from '../screens/Auth/User/Products/ProductsScreen';
import PurchasesScreen from '../screens/Auth/User/Purchase/PurchasesScreen';
import BrandMarketplace from '../screens/Auth/User/Marketplace/BrandMarketplace';
import ExploreDetail from '../screens/Auth/User/Explore/ExploreDetail';

const Stack = createNativeStackNavigator();

const UserMainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="UserBottomTab"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="UserBottomTab" component={UserBottomTab} />
      <Stack.Screen
        name="UserSettingsDetails"
        component={UserSettingsDetails}
      />
      <Stack.Screen name="Earnings" component={Earnings} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="SuperThank" component={SuperThank} />
      <Stack.Screen name="Wallet" component={Wallet} />
      <Stack.Screen name="CreateProducts" component={CreateProducts} />
      <Stack.Screen name="CreateWebinar" component={CreateWebinarScreen} />
      <Stack.Screen name="CreateCourse" component={CreateCourse} />
      <Stack.Screen name="WalletCreator" component={WalletCreator} />
      <Stack.Screen
        name="CourseDetailsScreen"
        component={CourseDetailsScreen}
      />
      <Stack.Screen name="UserCourseSearch" component={UserCourseSearch} />
      <Stack.Screen name="UserVideoList" component={UserVideoList} />
      <Stack.Screen name="ProductsScreen" component={ProductsScreen} />
      <Stack.Screen name="PurchasesScreen" component={PurchasesScreen} />
      <Stack.Screen name="WebinarDetails" component={WebinarDetails} />
      <Stack.Screen name="KYCVerificationScreen" component={KYCVerificationScreen} />
      <Stack.Screen name="CreatorPublicProfile" component={CreatorPublicProfile} />
      <Stack.Screen name="ExpertList" component={ExpertList} />
      <Stack.Screen name="ExpertDetail" component={ExpertDetail} />
      <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} />
      <Stack.Screen name="CallScreen" component={CallScreen} />
      <Stack.Screen name="SessionRatingScreen" component={SessionRatingScreen} />
      <Stack.Screen name="UserNotification" component={UserNotification} />
      <Stack.Screen name="SettlementHistory" component={SettlementHistory} />
      <Stack.Screen name="ChatThread" component={ChatThread} />
      <Stack.Screen name="BrandMarketplace" component={BrandMarketplace} />
      <Stack.Screen name="ExploreDetail" component={ExploreDetail} />
    </Stack.Navigator>
  );
};

export default UserMainStack;
