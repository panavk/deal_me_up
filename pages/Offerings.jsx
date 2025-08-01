import React, { useEffect, useState, useRef } from 'react';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import {
  View, Text, Image, SectionList, TouchableOpacity, Linking,
  StyleSheet, TextInput, SafeAreaView
} from 'react-native';
import { Fetch } from '../util/Fetch';
import {
  addFavorite, removeFavorite,
  getAllPosts, getUserDocument, operateFlag
} from '../util/UserDB';
import { useAuth } from '../lib/AuthContext';
import Payment from '../util/Payment';          // 🆕 import

const Offerings = () => {
  const { user } = useAuth();

  /* -------------------- existing state -------------------- */
  const [deals,      setDeals]      = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [userPosts,  setUserPosts]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);
  const [favorited,  setFavorited]  = useState(new Set());
  const [flagged,    setFlagged]    = useState(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /* -------------------- modal state 🆕 -------------------- */
  const [payVisible, setPayVisible] = useState(false);    // 🆕

  /* -------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [genData, postsData, userDoc] = await Promise.all([
        Fetch(),
        getAllPosts(),
        getUserDocument(user.email)
      ]);
      setDeals(genData);
      setFiltered(genData);
      setUserPosts(postsData || []);
      const favLinks = userDoc?.favorites?.map(f => f.link) || [];
      setFavorited(new Set(favLinks));
      setLoading(false);
    })();
  }, [refreshTrigger]);

  /* filter on search */
  useEffect(() => {
    if (!searchTerm.trim()) return setFiltered(deals);
    setFiltered(
      deals.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, deals]);

  /* -------------------------------------------------------- */
  const renderItem = ({ item, section }) => {
    const imageUri = item.imagelink || item.imageUrl;
    const siteName = item.site || item.vendorname;

    return (
      <View style={styles.dealContainer}>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{item.title}</Text>
          {item.price && <Text style={styles.price}>{item.price}</Text>}
          <Text style={styles.vendor}>{siteName}</Text>
          {section?.needsFlag && (
            <Text style={styles.postedBy}>Posted by {item.username}</Text>
          )}

          <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
            <Text style={styles.link}>View Deal</Text>
          </TouchableOpacity>

          {/* action buttons */}
          <View style={styles.buttonsRow}>
            {/* like / unlike – unchanged */}
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={async () => {
                const next = new Set(favorited);
                if (next.has(item.link)) {
                  next.delete(item.link);
                  user?.email && removeFavorite(user.email, item.link);
                } else {
                  next.add(item.link);
                  user?.email &&
                    addFavorite(user.email, { link: item.link, title: item.title });
                }
                setFavorited(next);
              }}
            >
              <AntDesign
                name={favorited.has(item.link) ? 'heart' : 'hearto'}
                size={24}
                color={favorited.has(item.link) ? 'red' : '#888'}
              />
            </TouchableOpacity>

            {/* flag – unchanged */}
            {section?.needsFlag && (
              <TouchableOpacity
                style={styles.flagButton}
                onPress={() => {
                  if (flagged.has(item.link)) return;
                  setFlagged(prev => new Set(prev).add(item.link));
                  operateFlag(item.link, item.username).catch(console.error);
                  setTimeout(() => {
                    setFlagged(prev => {
                      const s = new Set(prev);
                      s.delete(item.link);
                      return s;
                    });
                    setRefreshTrigger(x => x + 1);
                  }, 3000);
                }}
              >
                <FontAwesome
                  name={flagged.has(item.link) ? 'flag' : 'flag-o'}
                  size={24}
                  color={flagged.has(item.link) ? '#ff8c00' : '#888'}
                />
              </TouchableOpacity>
            )}

            {/* open Payment modal 🆕 */}
            <TouchableOpacity onPress={() => setPayVisible(true)}>
              <FontAwesome name="dollar" size={22} color="#388e3c" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Loading deals...</Text>
      </SafeAreaView>
    );
  }

  const sections = [
    { title: 'User Posted', data: userPosts,   needsFlag: true  },
    { title: 'Generated',   data: filtered,    needsFlag: false }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* taskbar */}
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
            const [gen, posts] = await Promise.all([Fetch(), getAllPosts()]);
            setDeals(gen);
            setFiltered(gen);
            setUserPosts(posts || []);
            setSearchTerm('');
            setLoading(false);
          }}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* list */}
      <SectionList
        sections={sections}
        keyExtractor={(item, idx) => item.link + idx}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        style={styles.flatList}
      />

      {/* payment overlay 🆕 */}
      <Payment
        visible={payVisible}
        onClose={() => setPayVisible(false)}
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
  sectionHeader: {
    backgroundColor: '#eee',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sectionHeaderText: {
    fontWeight: '600',
    color: '#444',
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
  favoriteButton: {
    marginRight: 12,
  },
  postedBy: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  flagButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tipButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  tipButtonText: {
    fontWeight: 'bold',
    color: '#444',
  },
  favoriteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Offerings;
