import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const User = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>User Page</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingBottom: 60, // Space for bottom navigation
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default User; 