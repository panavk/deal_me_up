import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../lib/AuthContext';
import Login from '../extras/Login';
import SignUp from '../extras/SignUp';
import Offerings from '../pages/Offerings';
import User from '../pages/User';
import Nav from '../navigation/Nav';
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function Routes() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('Offerings');

  if (loading) {
    return null; // or a loading spinner
  }

  // This function renders the main app with your custom nav
  const renderMainApp = () => (
    <View style={{ flex: 1 }}>
      {activeTab === 'Offerings' && <Offerings />}
      {activeTab === 'User' && <User />}
      <Nav activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainApp" children={renderMainApp} />
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}