import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Earnings from '../screens/Auth/Profile/Earnings';
import UserProfile from '../screens/Auth/Profile/UserProfile';
import CreatorProfile from '../screens/Auth/Creator/Profile/CreatorProfile';
import Dashboard from '../screens/Auth/Profile/Dashboard';
import SuperThank from '../screens/Auth/Profile/SuperThank';
import Wallet from '../screens/Auth/Profile/Wallet';
import CreateProducts from '../screens/Auth/Creator/Products/Course/CreateProducts';
import CreateWebinar from '../screens/Auth/Creator/Products/Webinar/CreateWebinar';
import CreateCourse from '../screens/Auth/Creator/Products/Course/CreateCourse';
import WalletCreator from '../screens/Auth/Wallet/WalletCreator';
import CreatorBottomTab from './CreatorBottomTab';
import CourseVideoList from '../screens/Auth/Creator/Products/Course/CourseVideoList';
import CreatorSettingsDetails from '../screens/Auth/Creator/Settings/CreatorSettingDetails';
import KYCVerificationScreen from '../screens/Auth/Creator/Kyc/KYCVerificationScreen';
import CourseDetailsScreen from '../screens/Auth/Creator/Products/Course/CourseDetailsScreen';
import CreatorNotification from '../screens/Auth/Creator/Notification/CreatorNotification';
import BankDetails from '../screens/Auth/Creator/BankDetails/BankDetails';

const Stack = createNativeStackNavigator();

const CreatorMainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="CreatorBottomTab"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="CreatorBottomTab" component={CreatorBottomTab} />
      <Stack.Screen
        name="CreatorSettingsDetails"
        component={CreatorSettingsDetails}
      />
      <Stack.Screen name="Earnings" component={Earnings} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfile} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="SuperThank" component={SuperThank} />
      <Stack.Screen name="Wallet" component={Wallet} />
      <Stack.Screen name="CreateProducts" component={CreateProducts} />
      <Stack.Screen name="CreateWebinar" component={CreateWebinar} />
      <Stack.Screen name="CreateCourse" component={CreateCourse} />
      <Stack.Screen name="WalletCreator" component={WalletCreator} />
      <Stack.Screen name="CourseVideoList" component={CourseVideoList} />
      <Stack.Screen
        name="KYCVerificationScreen"
        component={KYCVerificationScreen}
      />
      <Stack.Screen
        name="CourseDetailsScreen"
        component={CourseDetailsScreen}
      />
      <Stack.Screen
        name="CreatorNotification"
        component={CreatorNotification}
      />
      <Stack.Screen name="BankDetails" component={BankDetails} />
    </Stack.Navigator>
  );
};

export default CreatorMainStack;
