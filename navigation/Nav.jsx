import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';

const Nav = ({ onTabChange, activeTab = 'Offerings' }) => {
  return (
    <View style={styles.navContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Offerings' && styles.activeTab]}
        onPress={() => onTabChange('Offerings')}
      >
        <Image
          source={require('../assets/offerings.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'User' && styles.activeTab]}
        onPress={() => onTabChange('User')}
      >
        <Image
          source={require('../assets/User.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Optional: add active state styling
  },
  icon: {
    width: 30,
    height: 30,
  },
});

export default Nav; 