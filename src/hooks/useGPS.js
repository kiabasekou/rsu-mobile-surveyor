/**
 * =============================================================================
 * 🇬🇦 RSU GABON - USE GPS HOOK
 * Standards Top 1% - Hook Personnalisé GPS
 * =============================================================================
 * 
 * Hook React personnalisé pour gérer le GPS.
 * Capture position, surveillance temps réel, validation coordonnées.
 * 
 * Utilisation:
 * const { position, accuracy, capturing, capture, watch, stop } = useGPS();
 * 
 * Fichier: src/hooks/useGPS.js
 * =============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import gpsService from '../services/gps/gpsService';

export default function useGPS(options = {}) {
  const {
    autoCapture = false,
    watchMode = false,
    minAccuracy = 50, // mètres
  } = options;

  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const watchSubscription = useRef(null);

  useEffect(() => {
    if (autoCapture) {
      capturePosition();
    }

    if (watchMode) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, []);

  /**
   * Capture la position actuelle
   */
  const capturePosition = async () => {
    try {
      setCapturing(true);
      setError(null);

      const result = await gpsService.getCurrentPosition();

      if (result) {
        setPosition({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        setAccuracy(result.accuracy);
        setPermissionGranted(true);

        return {
          success: true,
          position: result,
        };
      }

      return {
        success: false,
        error: 'Position non disponible',
      };
    } catch (error) {
      console.error('Erreur capture GPS:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setCapturing(false);
    }
  };

  /**
   * Démarre la surveillance de position
   */
  const startWatching = async () => {
    try {
      setError(null);

      const subscription = await gpsService.watchPosition((location) => {
        setPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setAccuracy(location.coords.accuracy);
      });

      watchSubscription.current = subscription;
      setWatching(true);
      setPermissionGranted(true);

      return { success: true };
    } catch (error) {
      console.error('Erreur watch GPS:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Arrête la surveillance de position
   */
  const stopWatching = () => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      setWatching(false);
    }
  };

  /**
   * Valide si les coordonnées sont dans les limites du Gabon
   */
  const isValidGabonPosition = () => {
    if (!position) return false;
    return gpsService.isValidGabonCoordinates(
      position.latitude,
      position.longitude
    );
  };

  /**
   * Vérifie si la précision est acceptable
   */
  const hasGoodAccuracy = () => {
    return accuracy !== null && accuracy <= minAccuracy;
  };

  /**
   * Calcule la distance par rapport à un point
   */
  const getDistanceFrom = (otherPosition) => {
    if (!position || !otherPosition) return null;

    return gpsService.calculateDistance(
      position.latitude,
      position.longitude,
      otherPosition.latitude,
      otherPosition.longitude
    );
  };

  return {
    position,
    accuracy,
    capturing,
    watching,
    error,
    permissionGranted,
    capturePosition,
    startWatching,
    stopWatching,
    isValidGabonPosition,
    hasGoodAccuracy,
    getDistanceFrom,
  };
}
