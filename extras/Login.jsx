import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await login(email, password);
      // AuthContext will handle navigation
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        textContentType="password"
      />
      <Button title="Sign In" onPress={handleLogin} />
      <Button title="Don't have an account?" onPress={() => navigation.navigate('SignUp')} />
      <View style={{ marginTop: 16 }}>
        <Text
          style={{
            backgroundColor: '#DB4437',
            color: 'white',
            textAlign: 'center',
            paddingVertical: 12,
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 16,
          }}
          onPress={useAuth().loginWithGoogle}
        >
          Sign in with Google
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
});

export default LoginScreen; 