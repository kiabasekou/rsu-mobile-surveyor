/**
 * =============================================================================
 * 🇬🇦 RSU GABON - CAMERA SERVICE
 * Standards Top 1% - Capture Photos Documents
 * =============================================================================
 * 
 * Service de capture et gestion photos pour documents d'identité.
 * Utilise expo-camera et expo-image-picker avec compression automatique.
 * 
 * Fonctionnalités:
 * - Capture photo caméra native
 * - Sélection depuis galerie
 * - Compression intelligente
 * - Upload vers serveur Django
 * - Sauvegarde locale offline
 * 
 * Fichier: src/services/camera/cameraService.js
 * =============================================================================
 */

import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import apiClient from '../api/apiClient';
import storageService from '../storage/storageService';

class CameraService {
  /**
   * Configuration compression images
   */
  COMPRESSION_CONFIG = {
    quality: 0.8,          // Qualité JPEG 80%
    maxWidth: 1920,        // Largeur max 1920px
    maxHeight: 1080,       // Hauteur max 1080px
    base64: true,          // Inclure base64 pour preview
  };

  /**
   * Taille maximum fichier (5MB)
   */
  MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

  /**
   * Types de documents supportés
   */
  DOCUMENT_TYPES = {
    NATIONAL_ID: 'national_id',
    BIRTH_CERTIFICATE: 'birth_certificate',
    RESIDENCE: 'residence_certificate',
    INCOME_PROOF: 'income_proof',
    BANK_RIB: 'bank_rib',
    OTHER: 'other_document',
  };

  /**
   * ==========================================================================
   * PERMISSIONS CAMÉRA
   * ==========================================================================
   */

  /**
   * Demande permissions caméra
   * 
   * @returns {Promise<boolean>} - true si accordé
   */
  async requestCameraPermissions() {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Caméra',
          'L\'application a besoin d\'accéder à la caméra pour photographier les documents.',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Paramètres', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur demande permission caméra:', error);
      Alert.alert('Erreur', 'Impossible de demander les permissions caméra');
      return false;
    }
  }

  /**
   * Demande permissions galerie photos
   * 
   * @returns {Promise<boolean>} - true si accordé
   */
  async requestGalleryPermissions() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Galerie',
          'L\'application a besoin d\'accéder à la galerie pour sélectionner des photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur demande permission galerie:', error);
      return false;
    }
  }

  /**
   * ==========================================================================
   * CAPTURE PHOTO
   * ==========================================================================
   */

  /**
   * Capture une photo avec la caméra
   * 
   * @param {string} documentType - Type de document (DOCUMENT_TYPES)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Résultat capture
   */
  async captureDocument(documentType = this.DOCUMENT_TYPES.OTHER, options = {}) {
    try {
      // Vérifier permissions
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Permission caméra refusée',
        };
      }

      // Lancer l'appareil photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: this.COMPRESSION_CONFIG.quality,
        base64: this.COMPRESSION_CONFIG.base64,
        exif: true,
      });

      if (result.canceled) {
        return {
          success: false,
          error: 'Capture annulée',
        };
      }

      // Traiter l'image capturée
      const processedImage = await this._processImage(result.assets[0], documentType);

      return {
        success: true,
        image: processedImage,
      };
    } catch (error) {
      console.error('Erreur capture document:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sélectionne une photo depuis la galerie
   * 
   * @param {string} documentType - Type de document
   * @returns {Promise<Object>} - Résultat sélection
   */
  async pickFromGallery(documentType = this.DOCUMENT_TYPES.OTHER) {
    try {
      // Vérifier permissions
      const hasPermission = await this.requestGalleryPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Permission galerie refusée',
        };
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: this.COMPRESSION_CONFIG.quality,
        base64: this.COMPRESSION_CONFIG.base64,
        exif: true,
      });

      if (result.canceled) {
        return {
          success: false,
          error: 'Sélection annulée',
        };
      }

      // Traiter l'image sélectionnée
      const processedImage = await this._processImage(result.assets[0], documentType);

      return {
        success: true,
        image: processedImage,
      };
    } catch (error) {
      console.error('Erreur sélection galerie:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Affiche un menu de choix (Caméra ou Galerie)
   * 
   * @param {string} documentType - Type de document
   * @returns {Promise<Object>} - Résultat capture
   */
  async showImagePickerMenu(documentType = this.DOCUMENT_TYPES.OTHER) {
    return new Promise((resolve) => {
      Alert.alert(
        'Ajouter une Photo',
        'Choisissez une option',
        [
          {
            text: 'Prendre une Photo',
            onPress: async () => {
              const result = await this.captureDocument(documentType);
              resolve(result);
            },
          },
          {
            text: 'Choisir depuis Galerie',
            onPress: async () => {
              const result = await this.pickFromGallery(documentType);
              resolve(result);
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => resolve({ success: false, error: 'Annulé' }),
          },
        ]
      );
    });
  }

  /**
   * ==========================================================================
   * TRAITEMENT IMAGE
   * ==========================================================================
   */

  /**
   * Traite une image (compression, validation, métadonnées)
   * 
   * @param {Object} imageAsset - Asset ImagePicker
   * @param {string} documentType - Type de document
   * @returns {Promise<Object>} - Image traitée
   */
  async _processImage(imageAsset, documentType) {
    try {
      const uri = imageAsset.uri;
      const fileInfo = await FileSystem.getInfoAsync(uri);

      // Validation taille
      if (fileInfo.size > this.MAX_FILE_SIZE) {
        throw new Error(`Fichier trop volumineux (max ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }

      // Compression si nécessaire
      let compressedUri = uri;
      if (fileInfo.size > 2 * 1024 * 1024) { // > 2MB
        compressedUri = await this._compressImage(uri);
      }

      // Extraire métadonnées
      const metadata = {
        width: imageAsset.width,
        height: imageAsset.height,
        size: fileInfo.size,
        type: documentType,
        captured_at: new Date().toISOString(),
        exif: imageAsset.exif || {},
      };

      return {
        uri: compressedUri,
        base64: imageAsset.base64,
        metadata: metadata,
        documentType: documentType,
      };
    } catch (error) {
      console.error('Erreur traitement image:', error);
      throw error;
    }
  }

  /**
   * Compresse une image
   * 
   * @param {string} uri - URI de l'image
   * @returns {Promise<string>} - URI de l'image compressée
   */
  async _compressImage(uri) {
    try {
      // Utiliser manipulateAsync pour compression
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { 
            resize: { 
              width: this.COMPRESSION_CONFIG.maxWidth 
            } 
          }
        ],
        {
          compress: this.COMPRESSION_CONFIG.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipResult.uri;
    } catch (error) {
      console.error('Erreur compression image:', error);
      return uri; // Fallback: retourner l'original
    }
  }

  /**
   * ==========================================================================
   * UPLOAD SERVEUR
   * ==========================================================================
   */

  /**
   * Upload une photo vers le serveur Django
   * 
   * @param {Object} image - Image traitée
   * @param {string} personId - UUID de la personne
   * @returns {Promise<Object>} - Résultat upload
   */
  async uploadDocument(image, personId) {
    try {
      // Préparer FormData
      const formData = new FormData();
      
      // Ajouter le fichier
      formData.append('document', {
        uri: image.uri,
        type: 'image/jpeg',
        name: `${image.documentType}_${personId}_${Date.now()}.jpg`,
      });

      // Ajouter métadonnées
      formData.append('document_type', image.documentType);
      formData.append('person_id', personId);
      formData.append('metadata', JSON.stringify(image.metadata));

      // Upload
      const response = await apiClient.post(
        '/identity/persons/upload-document/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 secondes pour upload
        }
      );

      if (response.data) {
        return {
          success: true,
          url: response.data.url,
          document_id: response.data.id,
        };
      }

      return {
        success: false,
        error: 'Réponse serveur invalide',
      };
    } catch (error) {
      console.error('Erreur upload document:', error);
      
      // En cas d'erreur, sauvegarder localement pour sync ultérieure
      await this._saveForOfflineSync(image, personId);

      return {
        success: false,
        error: error.message,
        savedOffline: true,
      };
    }
  }

  /**
   * ==========================================================================
   * GESTION OFFLINE
   * ==========================================================================
   */

  /**
   * Sauvegarde une image pour synchronisation ultérieure
   * 
   * @param {Object} image - Image à sauvegarder
   * @param {string} personId - UUID de la personne
   */
  async _saveForOfflineSync(image, personId) {
    try {
      const key = `offline_document_${Date.now()}`;
      const data = {
        image: image,
        personId: personId,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      await storageService.setItem(key, JSON.stringify(data));
      console.log('✅ Document sauvegardé pour sync offline');
    } catch (error) {
      console.error('Erreur sauvegarde offline document:', error);
    }
  }

  /**
   * Récupère tous les documents en attente de sync
   * 
   * @returns {Promise<Array>} - Documents en attente
   */
  async getPendingDocuments() {
    try {
      const allKeys = await storageService.getAllKeys();
      const documentKeys = allKeys.filter(key => key.startsWith('offline_document_'));

      const documents = [];
      for (const key of documentKeys) {
        const data = await storageService.getItem(key);
        if (data) {
          documents.push({
            key: key,
            data: JSON.parse(data),
          });
        }
      }

      return documents;
    } catch (error) {
      console.error('Erreur récupération documents offline:', error);
      return [];
    }
  }

  /**
   * Synchronise tous les documents en attente
   * 
   * @returns {Promise<Object>} - Résultat de la synchronisation
   */
  async syncPendingDocuments() {
    try {
      const pendingDocs = await this.getPendingDocuments();
      
      if (pendingDocs.length === 0) {
        return {
          success: true,
          synced: 0,
          message: 'Aucun document en attente',
        };
      }

      let synced = 0;
      let failed = 0;

      for (const doc of pendingDocs) {
        const result = await this.uploadDocument(doc.data.image, doc.data.personId);
        
        if (result.success) {
          // Supprimer du storage local
          await storageService.removeItem(doc.key);
          synced++;
        } else {
          failed++;
        }
      }

      return {
        success: true,
        synced: synced,
        failed: failed,
        total: pendingDocs.length,
      };
    } catch (error) {
      console.error('Erreur sync documents:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ==========================================================================
   * HELPERS
   * ==========================================================================
   */

  /**
   * Retourne le libellé d'un type de document
   */
  getDocumentTypeLabel(documentType) {
    const labels = {
      [this.DOCUMENT_TYPES.NATIONAL_ID]: 'Carte d\'Identité Nationale (NIP)',
      [this.DOCUMENT_TYPES.BIRTH_CERTIFICATE]: 'Acte de Naissance',
      [this.DOCUMENT_TYPES.RESIDENCE]: 'Certificat de Résidence',
      [this.DOCUMENT_TYPES.INCOME_PROOF]: 'Attestation de Revenus',
      [this.DOCUMENT_TYPES.BANK_RIB]: 'RIB Bancaire',
      [this.DOCUMENT_TYPES.OTHER]: 'Autre Document',
    };
    return labels[documentType] || 'Document';
  }

  /**
   * Formate la taille de fichier
   */
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}

export default new CameraService();
