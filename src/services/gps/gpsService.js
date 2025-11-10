// =============================================================================
// 2. GPS SERVICE (services/gps/gpsService.js)
// =============================================================================
import * as Location from 'expo-location';
import { Alert } from 'react-native';

class GPSService {
  async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission GPS requise',
        'L\'application a besoin d\'accéder à votre position pour la collecte terrain.',
        [{ text: 'OK' }]
      );
      throw new Error('Permission GPS refusée');
    }
    
    return true;
  }

  async getCurrentPosition(options = {}) {
    try {
      await this.requestPermissions();

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
        ...options,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Erreur GPS:', error);
      throw new Error('Impossible de capturer la position GPS');
    }
  }

  async watchPosition(callback, options = {}) {
    try {
      await this.requestPermissions();

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
          ...options,
        },
        callback
      );

      return subscription;
    } catch (error) {
      console.error('Erreur watch GPS:', error);
      throw error;
    }
  }

  // Validation coordonnées Gabon
  isValidGabonCoordinates(latitude, longitude) {
    // Limites géographiques du Gabon
    const GABON_BOUNDS = {
      north: 2.3,
      south: -4.0,
      east: 14.8,
      west: 8.5,
    };

    return (
      latitude >= GABON_BOUNDS.south &&
      latitude <= GABON_BOUNDS.north &&
      longitude >= GABON_BOUNDS.west &&
      longitude <= GABON_BOUNDS.east
    );
  }

  // Calcul distance entre deux points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

export default new GPSService();

