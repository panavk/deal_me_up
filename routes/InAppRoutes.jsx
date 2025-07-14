import React from 'react';
import { View } from 'react-native';
import Offerings from '../pages/Offerings';
import User from '../pages/User';
import Nav from '../navigation/Nav';

const InAppRoutes = () => {
  const [activeTab, setActiveTab] = React.useState('Offerings');

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'Offerings' && <Offerings />}
      {activeTab === 'User' && <User />}
      <Nav activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

export default InAppRoutes; 