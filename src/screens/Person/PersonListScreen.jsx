
// =============================================================================
// 2. PERSON LIST SCREEN (screens/Person/PersonListScreen.jsx)
// =============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Searchbar,
  Chip,
  Avatar,
  Button,
  FAB,
  List,
  Menu,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import apiClient from '../../services/api/apiClient';
import { GABON_PROVINCES } from '../../constants/gabonData';

export default function PersonListScreen({ navigation }) {
  const [persons, setPersons] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadPersons();
  }, []);

  useEffect(() => {
    filterPersons();
  }, [searchQuery, selectedProvince, persons]);

  const loadPersons = async () => {
    try {
      const response = await apiClient.get('/identity/persons/');
      setPersons(response.data.results || []);
    } catch (error) {
      console.error('Erreur chargement personnes:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des personnes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPersons = () => {
    let filtered = persons;

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(person =>
        person.first_name.toLowerCase().includes(query) ||
        person.last_name.toLowerCase().includes(query) ||
        person.nip.includes(query) ||
        person.phone.includes(query)
      );
    }

    // Filtre par province
    if (selectedProvince) {
      filtered = filtered.filter(person => person.province === selectedProvince);
    }

    setFilteredPersons(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPersons();
  };

  const renderPersonItem = ({ item }) => (
    <Card style={styles.personCard} onPress={() => navigation.navigate('PersonDetail', { person: item })}>
      <Card.Content>
        <View style={styles.personHeader}>
          <Avatar.Text
            size={50}
            label={`${item.first_name[0]}${item.last_name[0]}`}
            style={styles.personAvatar}
          />
          <View style={styles.personInfo}>
            <Title style={styles.personName}>
              {item.first_name} {item.last_name}
            </Title>
            <Paragraph style={styles.personDetails}>
              NIP: {item.nip} • {item.phone}
            </Paragraph>
            <Paragraph style={styles.personLocation}>
              📍 {GABON_PROVINCES[item.province]?.name || item.province}
            </Paragraph>
          </View>
          <View style={styles.personStatus}>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                item.verification_status === 'VERIFIED' && styles.verifiedChip,
                item.verification_status === 'PENDING' && styles.pendingChip,
              ]}
            >
              {item.verification_status === 'VERIFIED' ? 'Vérifié' :
               item.verification_status === 'PENDING' ? 'En attente' : 'À vérifier'}
            </Chip>
            {item.vulnerability_score && (
              <Chip
                mode="outlined"
                style={[
                  styles.vulnerabilityChip,
                  { backgroundColor: getVulnerabilityColor(item.vulnerability_score) }
                ]}
              >
                {Math.round(item.vulnerability_score)}/100
              </Chip>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const getVulnerabilityColor = (score) => {
    if (score >= 75) return '#FFEBEE'; // Rouge clair
    if (score >= 50) return '#FFF3E0'; // Orange clair  
    if (score >= 25) return '#E8F5E8'; // Vert clair
    return '#F3E5F5'; // Violet clair
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche et filtres */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Rechercher par nom, NIP, téléphone..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.filterButton}
              icon="filter-list"
            >
              {selectedProvince ? GABON_PROVINCES[selectedProvince]?.name : 'Toutes provinces'}
            </Button>
          }
        >
          <Menu.Item
            title="Toutes provinces"
            onPress={() => {
              setSelectedProvince('');
              setMenuVisible(false);
            }}
          />
          <Divider />
          {Object.entries(GABON_PROVINCES).map(([code, data]) => (
            <Menu.Item
              key={code}
              title={data.name}
              onPress={() => {
                setSelectedProvince(code);
                setMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {/* Liste des personnes */}
      <FlatList
        data={filteredPersons}
        renderItem={renderPersonItem}
        keyExtractor={item => item.id.toString()}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#ccc" />
            <Paragraph style={styles.emptyText}>
              {loading ? 'Chargement...' : 'Aucune personne trouvée'}
            </Paragraph>
            {!loading && (
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Enrollment')}
                style={styles.emptyButton}
                icon="person-add"
              >
                Ajouter une personne
              </Button>
            )}
          </View>
        }
      />

      {/* Bouton flottant nouvelle inscription */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Enrollment')}
        label="Nouvelle inscription"
      />
    </View>
  );
}

const personListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  personCard: {
    marginBottom: 12,
    elevation: 2,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 12,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  personDetails: {
    color: '#666',
    marginBottom: 2,
  },
  personLocation: {
    color: '#888',
    fontSize: 12,
  },
  personStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusChip: {
    marginBottom: 4,
  },
  verifiedChip: {
    backgroundColor: '#E8F5E8',
  },
  pendingChip: {
    backgroundColor: '#FFF3E0',
  },
  vulnerabilityChip: {
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  emptyButton: {
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E7D32',
  },
});