/**
 * =============================================================================
 * 🇬🇦 RSU GABON - MAP VIEW SCREEN
 * Standards Top 1% - Cartographie des Enquêtes
 * =============================================================================
 * 
 * Écran de visualisation cartographique des enquêtes terrain.
 * Affichage des markers géolocalisés avec clustering.
 * 
 * Fonctionnalités:
 * - Affichage carte interactive
 * - Markers personnes/ménages
 * - Filtres par province
 * - Navigation vers détails
 * - Clustering intelligent
 * 
 * Fichier: src/screens/Map/MapViewScreen.jsx
 * =============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import {
  FAB,
  Portal,
  Modal,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Searchbar,
  ActivityIndicator,
} from 'react-native-paper';
import * as Location from 'expo-location';

import apiClient from '../../services/api/apiClient';
import gpsService from '../../services/gps/gpsService';
import { GABON_PROVINCES } from '../../constants/gabonData';

const { width, height } = Dimensions.get('window');

/**
 * Configuration par défaut de la carte (centré sur Libreville)
 */
const DEFAULT_REGION = {
  latitude: 0.4162,    // Libreville
  longitude: 9.4673,
  latitudeDelta: 3.0,
  longitudeDelta: 3.0,
};

/**
 * Limites géographiques du Gabon
 */
const GABON_BOUNDS = {
  north: 2.3,
  south: -4.0,
  east: 14.8,
  west: 8.5,
};

export default function MapViewScreen({ navigation }) {
  const mapRef = useRef(null);

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterProvince, setFilterProvince] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadMapData();
    getUserLocation();
  }, [filterProvince]);

  /**
   * ==========================================================================
   * CHARGEMENT DONNÉES
   * ==========================================================================
   */

  /**
   * Charge les données de la carte (personnes/ménages avec GPS)
   */
  const loadMapData = async () => {
    try {
      setLoading(true);

      // Construire les filtres
      const params = {};
      if (filterProvince) {
        params.province = filterProvince;
      }

      // Récupérer personnes avec coordonnées GPS
      const response = await apiClient.get('/identity/persons/', { params });

      if (response.data && response.data.results) {
        // Filtrer uniquement les entrées avec GPS
        const markersData = response.data.results
          .filter(person => person.latitude && person.longitude)
          .map(person => ({
            id: person.id,
            coordinate: {
              latitude: parseFloat(person.latitude),
              longitude: parseFloat(person.longitude),
            },
            title: `${person.first_name} ${person.last_name}`,
            description: person.province,
            data: person,
          }));

        setMarkers(markersData);

        // Ajuster la vue pour inclure tous les markers
        if (markersData.length > 0 && mapRef.current) {
          fitMarkersToMap(markersData);
        }
      }
    } catch (error) {
      console.error('Erreur chargement carte:', error);
      Alert.alert('Erreur', 'Impossible de charger les données cartographiques');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère la position de l'utilisateur
   */
  const getUserLocation = async () => {
    try {
      const position = await gpsService.getCurrentPosition();
      
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      });
    } catch (error) {
      console.log('Position utilisateur non disponible:', error.message);
    }
  };

  /**
   * Ajuste la vue pour inclure tous les markers
   */
  const fitMarkersToMap = (markersData) => {
    if (markersData.length === 0) return;

    const coordinates = markersData.map(m => m.coordinate);

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      },
      animated: true,
    });
  };

  /**
   * ==========================================================================
   * INTERACTIONS CARTE
   * ==========================================================================
   */

  /**
   * Sélection d'un marker
   */
  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  /**
   * Centrer sur position utilisateur
   */
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      Alert.alert('Position Non Disponible', 'Impossible de déterminer votre position');
    }
  };

  /**
   * Navigation vers détails personne
   */
  const navigateToPersonDetail = () => {
    if (selectedMarker) {
      setModalVisible(false);
      navigation.navigate('PersonDetail', { personId: selectedMarker.id });
    }
  };

  /**
   * ==========================================================================
   * FILTRES
   * ==========================================================================
   */

  /**
   * Applique un filtre de province
   */
  const applyProvinceFilter = (province) => {
    if (filterProvince === province) {
      setFilterProvince(null); // Toggle off
    } else {
      setFilterProvince(province);
    }
  };

  /**
   * Réinitialise les filtres
   */
  const clearFilters = () => {
    setFilterProvince(null);
    setSearchQuery('');
  };

  /**
   * Recherche par nom
   */
  const handleSearch = () => {
    if (searchQuery.trim() === '') return;

    const found = markers.find(m =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (found && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: found.coordinate.latitude,
        longitude: found.coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      handleMarkerPress(found);
    } else {
      Alert.alert('Non Trouvé', 'Aucun résultat pour cette recherche');
    }
  };

  /**
   * ==========================================================================
   * RENDU MARKER PERSONNALISÉ
   * ==========================================================================
   */

  /**
   * Couleur du marker selon niveau de vulnérabilité
   */
  const getMarkerColor = (person) => {
    const riskLevel = person.vulnerability_assessment?.risk_level;
    
    switch (riskLevel) {
      case 'CRITICAL':
        return '#D32F2F'; // Rouge
      case 'HIGH':
        return '#F57C00'; // Orange
      case 'MODERATE':
        return '#FBC02D'; // Jaune
      case 'LOW':
        return '#388E3C'; // Vert
      default:
        return '#2196F3'; // Bleu par défaut
    }
  };

  /**
   * ==========================================================================
   * RENDU MODAL DÉTAILS
   * ==========================================================================
   */

  const renderDetailsModal = () => {
    if (!selectedMarker) return null;

    const person = selectedMarker.data;

    return (
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Content>
              <Title>{selectedMarker.title}</Title>
              
              <Paragraph style={styles.detailRow}>
                <Paragraph style={styles.detailLabel}>Province:</Paragraph>
                <Paragraph style={styles.detailValue}>{person.province}</Paragraph>
              </Paragraph>

              <Paragraph style={styles.detailRow}>
                <Paragraph style={styles.detailLabel}>Genre:</Paragraph>
                <Paragraph style={styles.detailValue}>
                  {person.gender === 'M' ? 'Masculin' : 'Féminin'}
                </Paragraph>
              </Paragraph>

              <Paragraph style={styles.detailRow}>
                <Paragraph style={styles.detailLabel}>Âge:</Paragraph>
                <Paragraph style={styles.detailValue}>{person.age} ans</Paragraph>
              </Paragraph>

              {person.vulnerability_assessment && (
                <View style={styles.vulnerabilitySection}>
                  <Paragraph style={styles.detailLabel}>Vulnérabilité:</Paragraph>
                  <Chip
                    style={[
                      styles.chip,
                      { backgroundColor: getMarkerColor(person) },
                    ]}
                    textStyle={{ color: '#FFF' }}
                  >
                    {person.vulnerability_assessment.risk_level}
                  </Chip>
                </View>
              )}

              <View style={styles.coordinatesSection}>
                <Paragraph style={styles.coordinatesLabel}>Coordonnées GPS:</Paragraph>
                <Paragraph style={styles.coordinates}>
                  {person.latitude.toFixed(6)}, {person.longitude.toFixed(6)}
                </Paragraph>
              </View>
            </Card.Content>

            <Card.Actions>
              <Button onPress={() => setModalVisible(false)}>
                Fermer
              </Button>
              <Button mode="contained" onPress={navigateToPersonDetail}>
                Voir Détails
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    );
  };

  /**
   * ==========================================================================
   * RENDU PRINCIPAL
   * ==========================================================================
   */

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Rechercher une personne..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onIconPress={handleSearch}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />
      </View>

      {/* Filtres de province */}
      <View style={styles.filtersContainer}>
        <Chip
          selected={filterProvince === null}
          onPress={clearFilters}
          style={styles.filterChip}
        >
          Toutes
        </Chip>
        {GABON_PROVINCES.slice(0, 3).map((province) => (
          <Chip
            key={province}
            selected={filterProvince === province}
            onPress={() => applyProvinceFilter(province)}
            style={styles.filterChip}
          >
            {province}
          </Chip>
        ))}
      </View>

      {/* Carte */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Paragraph>Chargement de la carte...</Paragraph>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Markers personnes */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onPress={() => handleMarkerPress(marker)}
              pinColor={getMarkerColor(marker.data)}
            />
          ))}

          {/* Cercle position utilisateur */}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={100}
              strokeColor="rgba(0, 122, 255, 0.5)"
              fillColor="rgba(0, 122, 255, 0.1)"
            />
          )}
        </MapView>
      )}

      {/* FAB Actions */}
      <FAB
        style={styles.fab}
        icon="crosshairs-gps"
        onPress={centerOnUserLocation}
        label="Ma Position"
      />

      {/* Badge compteur */}
      <View style={styles.counterBadge}>
        <Paragraph style={styles.counterText}>
          {markers.length} personne(s)
        </Paragraph>
      </View>

      {/* Modal détails */}
      {renderDetailsModal()}
    </View>
  );
}

/**
 * =============================================================================
 * STYLES
 * =============================================================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  searchbar: {
    elevation: 4,
  },
  filtersContainer: {
    position: 'absolute',
    top: 70,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    elevation: 4,
  },
  counterText: {
    fontWeight: 'bold',
  },
  modal: {
    margin: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  detailValue: {
    color: '#666',
  },
  vulnerabilitySection: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    marginLeft: 8,
  },
  coordinatesSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#666',
  },
  coordinates: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
