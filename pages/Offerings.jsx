import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Linking, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import { Fetch } from '../util/Fetch';

const Offerings = () => {
  const [deals, setDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const getDeals = async () => {
      const data = await Fetch();
      setDeals(data);
      setFilteredDeals(data);
      setLoading(false);
    };
    getDeals();
  }, []);

  // Filter deals based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDeals(deals);
    } else {
      const filtered = deals.filter(deal => 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeals(filtered);
    }
  }, [searchTerm, deals]);

  const renderItem = ({ item }) => (
    <View style={styles.dealContainer}>
      {item.imagelink && (
        <Image source={{ uri: item.imagelink }} style={styles.image} />
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.price && <Text style={styles.price}>{item.price}</Text>}
        <Text style={styles.vendor}>{item.vendorname}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
          <Text style={styles.link}>View Deal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading || deals.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Loading deals...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Taskbar */}
      <View style={styles.taskbar}>
        <TextInput
          ref={searchRef}
          style={styles.searchBar}
          placeholder="Search deals..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={async () => {
            setLoading(true);
            const data = await Fetch();
            setDeals(data);
            setFilteredDeals(data);
            setSearchTerm('');
            setLoading(false);
          }}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Deals List */}
      <FlatList
        data={filteredDeals}
        keyExtractor={(item, idx) => item.link + idx}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        style={styles.flatList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 60, // Space for bottom navigation
  },
  taskbar: {
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 5,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 12,
    fontSize: 16,
  },
  refreshButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  flatList: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  dealContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    padding: 10,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    color: '#388e3c',
    marginBottom: 4,
  },
  vendor: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Offerings;
