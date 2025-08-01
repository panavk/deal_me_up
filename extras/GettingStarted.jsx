import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { updateOnboarding, updatePreferences } from '../util/UserDB';
import { useAuth } from '../lib/AuthContext';

const categories = [
  { id: 1, name: 'Electronics', icon: '📱' },
  { id: 2, name: 'Gaming', icon: '🎮' },
  { id: 3, name: 'Home & Kitchen', icon: '🏠' },
  { id: 4, name: 'Fashion', icon: '👕' },
  { id: 5, name: 'Books', icon: '📚' },
  { id: 6, name: 'Sports & Outdoors', icon: '⚽' },
  { id: 7, name: 'Beauty & Health', icon: '💄' },
  { id: 8, name: 'Automotive', icon: '🚗' },
  { id: 9, name: 'Toys & Kids', icon: '🧸' },
  { id: 10, name: 'Pet Supplies', icon: '🐾' }
];

const GettingStarted = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { user, setIsNewUser } = useAuth();

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = async () => {
    try {
      setIsNewUser(false); // might be a break point
      await updateOnboarding(user.email, true);
      
      // Convert selected category IDs to category names
      const selectedCategoryNames = selectedCategories.map(id => 
        categories.find(category => category.id === id)?.name
      ).filter(Boolean);
      
      await updatePreferences(user.email, selectedCategoryNames);
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>What interests you?</Text>
      <Text style={styles.subtitle}>Select categories to personalize your deals</Text>
      
      <ScrollView style={styles.categoriesContainer}>
        <View style={styles.grid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategories.includes(category.id) && styles.selectedCategory
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          selectedCategories.length === 0 && styles.disabledButton
        ]}
        onPress={handleContinue}
        disabled={selectedCategories.length === 0}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriesContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  continueText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GettingStarted;