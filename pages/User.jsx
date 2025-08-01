import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, TouchableOpacity, Modal, TextInput, Image, Linking, ScrollView, Alert } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { getUserDocument, updateUserPayment, removeFavorite, validateDealScreenshot, addPost } from '../util/UserDB';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

function PaymentCard({ payment, onUpdate }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [venmo, setVenmo] = useState(payment?.venmo || '');
  const [paypal, setPaypal] = useState(payment?.paypal || '');

  useEffect(() => {
    setVenmo(payment?.venmo || '');
    setPaypal(payment?.paypal || '');
  }, [payment]);

  const handleSave = async () => {
    await onUpdate({ venmo, paypal });
    setModalVisible(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Payment Information</Text>
      <View style={styles.paymentRow}>
        <Image source={require('../assets/venmo.png')} style={styles.logoIcon} />
        <Text style={styles.paymentLabel}>Venmo:</Text>
        <Text style={styles.paymentValue}>{payment?.venmo || <Text style={styles.placeholder}>Not set</Text>}</Text>
      </View>
      <View style={styles.paymentRow}>
        <FontAwesome name="paypal" size={20} color="#003087" style={styles.icon} />
        <Text style={styles.paymentLabel}>PayPal:</Text>
        <Text style={styles.paymentValue}>{payment?.paypal || <Text style={styles.placeholder}>Not set</Text>}</Text>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Payment Info</Text>
            <View style={styles.inputRow}>
              <Image source={require('../assets/venmo.png')} style={styles.logoIcon} />
              <TextInput
                style={styles.input}
                placeholder="Venmo username"
                value={venmo}
                onChangeText={setVenmo}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputRow}>
              <FontAwesome name="paypal" size={20} color="#003087" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="PayPal email"
                value={paypal}
                onChangeText={setPaypal}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PostForm({ visible, onClose, userData, setUserData, updateState }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('$');
  const [site, setSite] = useState(''); // temp
  const [link, setLink] = useState('https://');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const { user } = useAuth();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true, // Get base64 for validation
    });
    if (!result.cancelled) {
      const uri = result.assets ? result.assets[0].uri : result.uri;
      const base64 = result.assets ? result.assets[0].base64 : result.base64;
      setImage(uri);
      setImageBase64(base64);
    }
  };

  // Only allow numbers after the $ in price
  const handlePriceChange = (val) => {
    if (val === '' || val === '$') {
      setPrice('$');
    } else if (val.startsWith('$')) {
      const num = val.slice(1).replace(/[^0-9.]/g, '');
      setPrice('$' + num);
    } else {
      const num = val.replace(/[^0-9.]/g, '');
      setPrice('$' + num);
    }
  };

  const handleSubmit = async () => {
    // Check all fields are filled
    if (!title.trim() || price === '$' || !site.trim()
        || !link.trim() || !description.trim() || !imageBase64) {
      Alert.alert('Error', 'Please fill out all fields and select an image.');
      return;
    }
    // Validate link: must start with 'https://' and contain a '.' after the slashes
    const linkPattern = /^https:\/\/.+\..+/;
    if (!linkPattern.test(link)) {
      Alert.alert('Error', 'Please enter a valid link (must start with https:// and contain a "." after the slashes).');
      return;
    }

    setIsValidating(true);
    try {
      const validation = await validateDealScreenshot(imageBase64, title.trim(), price);
      
      if (validation.valid) {
        Alert.alert('Success', 'Screenshot validation passed! Title and price found in image.');
        console.log('Image URI before addPost:', image);
        const result = await addPost(user.email, { title, link, imageUri: image, price, site });
        if (!result.success) {
          Alert.alert('Duplicate Post', 'A post with this title or link already exists.');
          return;
        } else {
          setUserData({ ...userData, posts: result.posts });
          updateState();
        }
        handleClose();
      } else {
        Alert.alert('Validation Failed', 'Screenshot validation failed. Please ensure the image contains the title and price you entered.');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', error.message || 'Failed to validate screenshot. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setTitle(''); setPrice('$'); setSite(''); setLink('https://'); setDescription(''); setImage(null); setImageBase64(null);
    setIsValidating(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}> 
          <Text style={styles.modalTitle}>Create a Post</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              maxLength={10}
            />
            <TextInput style={styles.input} placeholder="Site" value={site} onChangeText={setSite} />
            <TextInput
              style={styles.input}
              placeholder="Link"
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Description" value={description} onChangeText={setDescription} multiline />
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text style={styles.imagePickerButtonText}>{image ? 'Change Image' : 'Pick Image for Proof'}</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.proofImage} />}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.saveButton, isValidating && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={isValidating}
              >
                <Text style={styles.saveButtonText}>{isValidating ? 'Validating...' : 'Validate & Submit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isValidating}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const User = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [favoritesUpdated, setFavoritesUpdated] = useState(0);
  const [postModalVisible, setPostModalVisible] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (user?.email) {
        const data = await getUserDocument(user.email);
        setUserData(data);
      }
    }
    fetchUser();
  }, [user?.email, favoritesUpdated]);

  const onFavoriteAdded = () => setFavoritesUpdated(f => f + 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card 1: Email and Logout */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.email}>{user?.email || 'No email'}</Text>
          <Button title="Log Out" onPress={logout} />
        </View>

        {/* Card 2: Payment Info */}
        {userData && (
          <PaymentCard
            payment={userData.payment}
            onUpdate={async (newPayment) => {
              await updateUserPayment(user.email, newPayment);
              setUserData({ ...userData, payment: newPayment });
            }}
          />
        )}

        {/* Card 3: Favorites */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Favorites</Text>
          {userData?.favorites && userData.favorites.length > 0 ? (
            userData.favorites.map((fav, idx) => (
              <View key={fav.link || idx} style={styles.favoriteBlock}>
                <Text style={styles.favoriteTitle}>{fav.title}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(fav.link)}>
                  <Text style={styles.favoriteLink}>{fav.link}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeFavoriteButton}
                  onPress={async () => {
                    await removeFavorite(user.email, fav.link);
                    onFavoriteAdded();
                  }}
                >
                  <Text style={styles.removeFavoriteButtonText}>Remove</Text>
                </TouchableOpacity>
                {idx !== userData.favorites.length - 1 && <View style={styles.favoriteDivider} />}
              </View>
            ))
          ) : (
            <Text style={styles.placeholder}>No favorites yet.</Text>
          )}
        </View>

        {/* Card 4: Posts */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Posts</Text>
          {userData?.posts && userData.posts.length > 0 ? (
            userData.posts.map((post, idx) => (
              <View key={post.link || idx} style={styles.favoriteBlock}>
                <Text style={styles.favoriteSite}>{post.site}</Text>
                <Text style={styles.favoriteTitle}>{post.title}</Text>
                <Text style={styles.favoritePrice}>{post.price}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(post.link)}>
                  <Text style={styles.favoriteLink}>{post.link}</Text>
                </TouchableOpacity>
                {post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.proofImage} />
                )}
                <TouchableOpacity
                  style={styles.removeFavoriteButton}
                  onPress={async () => {
                    await removePost(user.email, post.link);
                    // Update UI: refetch user data or update state here
                    onFavoriteAdded(); // or a similar function for posts
                  }}
                >
                  <Text style={styles.removeFavoriteButtonText}>Remove</Text>
                </TouchableOpacity>
                {idx !== userData.posts.length - 1 && <View style={styles.favoriteDivider} />}
              </View>
            ))
          ) : (
            <Text style={styles.placeholder}>No posts yet.</Text>
          )}
          <TouchableOpacity style={styles.editButton} onPress={() => setPostModalVisible(true)}>
            <Text style={styles.editButtonText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <PostForm 
        visible={postModalVisible} 
        onClose={() => setPostModalVisible(false)} 
        userData={userData}
        setUserData={setUserData}
        updateState={onFavoriteAdded}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingBottom: 60, // Space for bottom navigation
    paddingTop: 24,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 60,
    paddingTop: 24,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    marginBottom: 12,
  },
  placeholder: {
    color: '#888',
    fontSize: 15,
    marginBottom: 8,
  },
  editButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#eee',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentLabel: {
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 4,
    fontSize: 15,
  },
  paymentValue: {
    fontSize: 15,
    color: '#222',
  },
  icon: {
    marginRight: 4,
  },
  logoIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
    alignSelf: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 15,
    marginLeft: 8,
    backgroundColor: '#fafafa',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#eee',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  favoriteItem: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  favoriteBlock: {
    marginBottom: 14,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  favoriteLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  favoriteDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 8,
  },
  favoriteSite: { 
    fontSize: 13, 
    fontStyle: 'italic', 
    color: '#888' 
  },
  favoritePrice: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  removeFavoriteButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff5252',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  removeFavoriteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  imagePickerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  proofImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default User; 