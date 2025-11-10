// =============================================================================
// 🇬🇦 RSU GABON - CAMERA SERVICE COMPLET
// Fichier: src/services/camera/cameraService.js
// Gestion capture photos, signatures, compression et upload
// =============================================================================

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import apiClient from '../api/apiClient';
import { Alert } from 'react-native';

/**
 * Service de gestion caméra et photos
 * Capture, compression, signature, upload
 */

class CameraService {
  constructor() {
    this.IMAGE_CONFIG = {
      quality: 0.7,
      maxWidth: 1280,
      maxHeight: 1280,
      allowsEditing: false,
      base64: false,
    };

    this.SIGNATURE_CONFIG = {
      penColor: '#000000',
      backgroundColor: '#ffffff',
      strokeWidth: 3,
    };

    this.UPLOAD_CONFIG = {
      endpoint: '/media/upload/',
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
    };
  }

  /**
   * Demander permissions caméra
   */
  async requestCameraPermissions() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin d\'accéder à la caméra pour prendre des photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur permission caméra:', error);
      return false;
    }
  }

  /**
   * Demander permissions galerie
   */
  async requestGalleryPermissions() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin d\'accéder à la galerie.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur permission galerie:', error);
      return false;
    }
  }

  /**
   * Prendre une photo avec la caméra
   */
  async takePicture(options = {}) {
    try {
      // Vérifier permission
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Permission caméra refusée');
      }

      // Lancer caméra
      const result = await ImagePicker.launchCameraAsync({
        ...this.IMAGE_CONFIG,
        ...options,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.cancelled || result.canceled) {
        return null;
      }

      console.log('📷 Photo capturée:', result.uri);

      // Compresser image
      const compressed = await this.compressImage(result.uri);

      return {
        uri: compressed.uri,
        width: compressed.width,
        height: compressed.height,
        size: await this.getFileSize(compressed.uri),
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      };

    } catch (error) {
      console.error('Erreur capture photo:', error);
      throw new Error('Impossible de prendre la photo');
    }
  }

  /**
   * Sélectionner image depuis galerie
   */
  async pickImageFromGallery(options = {}) {
    try {
      // Vérifier permission
      const hasPermission = await this.requestGalleryPermissions();
      if (!hasPermission) {
        throw new Error('Permission galerie refusée');
      }

      // Lancer sélecteur
      const result = await ImagePicker.launchImageLibraryAsync({
        ...this.IMAGE_CONFIG,
        ...options,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.cancelled || result.canceled) {
        return null;
      }

      console.log('🖼️ Image sélectionnée:', result.uri);

      // Compresser image
      const compressed = await this.compressImage(result.uri);

      return {
        uri: compressed.uri,
        width: compressed.width,
        height: compressed.height,
        size: await this.getFileSize(compressed.uri),
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
      };

    } catch (error) {
      console.error('Erreur sélection image:', error);
      throw new Error('Impossible de sélectionner l\'image');
    }
  }

  /**
   * Compresser image
   */
  async compressImage(uri, quality = 0.7) {
    try {
      console.log('🗜️ Compression image...');

      const compressed = await manipulateAsync(
        uri,
        [
          { resize: { width: this.IMAGE_CONFIG.maxWidth } }
        ],
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );

      const originalSize = await this.getFileSize(uri);
      const compressedSize = await this.getFileSize(compressed.uri);
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

      console.log(`✅ Image compressée: ${originalSize}B → ${compressedSize}B (${savings}% économisé)`);

      return compressed;

    } catch (error) {
      console.error('Erreur compression:', error);
      // Retourner image originale en cas d'erreur
      return { uri };
    }
  }

  /**
   * Obtenir taille fichier
   */
  async getFileSize(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size || 0;
    } catch (error) {
      console.error('Erreur lecture taille:', error);
      return 0;
    }
  }

  /**
   * Vérifier taille fichier
   */
  async validateFileSize(uri) {
    const size = await this.getFileSize(uri);
    
    if (size > this.UPLOAD_CONFIG.maxSizeBytes) {
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      const maxMB = (this.UPLOAD_CONFIG.maxSizeBytes / 1024 / 1024).toFixed(2);
      
      return {
        valid: false,
        error: `Fichier trop volumineux (${sizeMB}MB). Maximum: ${maxMB}MB`
      };
    }

    return { valid: true, size };
  }

  /**
   * Upload image vers serveur
   */
  async uploadImage(imageData, metadata = {}) {
    try {
      console.log('📤 Upload image...');

      // Vérifier taille
      const sizeCheck = await this.validateFileSize(imageData.uri);
      if (!sizeCheck.valid) {
        throw new Error(sizeCheck.error);
      }

      // Préparer FormData
      const formData = new FormData();
      
      formData.append('file', {
        uri: imageData.uri,
        name: imageData.name || `image_${Date.now()}.jpg`,
        type: imageData.type || 'image/jpeg',
      });

      // Ajouter metadata
      if (metadata.type) formData.append('file_type', metadata.type);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.description) formData.append('description', metadata.description);

      // Upload
      const response = await apiClient.post(
        this.UPLOAD_CONFIG.endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60s pour upload
        }
      );

      console.log('✅ Image uploadée:', response.data.url);

      return {
        success: true,
        url: response.data.url,
        fileId: response.data.file_id,
      };

    } catch (error) {
      console.error('Erreur upload:', error);
      
      // Sauvegarder pour upload différé si offline
      if (error.message.includes('Network')) {
        return {
          success: false,
          offline: true,
          uri: imageData.uri,
          error: 'Sauvegardé pour upload ultérieur'
        };
      }

      throw new Error('Impossible d\'uploader l\'image');
    }
  }

  /**
   * Prendre photo profil
   */
  async takeProfilePicture() {
    return await this.takePicture({
      allowsEditing: true,
      aspect: [1, 1], // Carré
      quality: 0.8,
    });
  }

  /**
   * Prendre photo document
   */
  async takeDocumentPicture() {
    return await this.takePicture({
      allowsEditing: false,
      quality: 0.9, // Qualité élevée pour documents
    });
  }

  /**
   * Prendre photo habitation
   */
  async takeHousingPicture() {
    return await this.takePicture({
      allowsEditing: false,
      quality: 0.7,
    });
  }

  /**
   * Capturer signature
   * Note: Utilise react-native-signature-canvas
   */
  captureSignature() {
    // Cette fonction retourne la configuration
    // La capture réelle se fait via le component SignatureCanvas
    return {
      config: this.SIGNATURE_CONFIG,
      onSave: async (base64) => {
        try {
          // Sauvegarder signature en fichier
          const fileUri = `${FileSystem.documentDirectory}signature_${Date.now()}.png`;
          
          await FileSystem.writeAsStringAsync(
            fileUri,
            base64.replace('data:image/png;base64,', ''),
            { encoding: FileSystem.EncodingType.Base64 }
          );

          console.log('✍️ Signature capturée:', fileUri);

          return {
            uri: fileUri,
            base64: base64,
            type: 'image/png',
            name: `signature_${Date.now()}.png`,
          };

        } catch (error) {
          console.error('Erreur sauvegarde signature:', error);
          throw new Error('Impossible de sauvegarder la signature');
        }
      }
    };
  }

  /**
   * Upload signature
   */
  async uploadSignature(signatureData) {
    return await this.uploadImage(signatureData, {
      type: 'signature',
      category: 'consent',
    });
  }

  /**
   * Batch upload multiple images
   */
  async batchUploadImages(images = [], metadata = {}) {
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const image of images) {
      try {
        const result = await this.uploadImage(image, metadata);
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        results.push({
          success: false,
          error: error.message,
          uri: image.uri,
        });
      }
    }

    return {
      total: images.length,
      success: successCount,
      failed: failedCount,
      results: results,
    };
  }

  /**
   * Supprimer fichier local temporaire
   */
  async deleteLocalFile(uri) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log('🗑️ Fichier supprimé:', uri);
      return true;
    } catch (error) {
      console.error('Erreur suppression:', error);
      return false;
    }
  }

  /**
   * Nettoyer fichiers temporaires
   */
  async cleanupTempFiles() {
    try {
      const tempDir = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(tempDir);
      
      let deletedCount = 0;
      for (const file of files) {
        if (file.startsWith('photo_') || file.startsWith('signature_')) {
          const fileUri = `${tempDir}${file}`;
          await this.deleteLocalFile(fileUri);
          deletedCount++;
        }
      }

      console.log(`🧹 ${deletedCount} fichiers temporaires supprimés`);
      return deletedCount;

    } catch (error) {
      console.error('Erreur nettoyage:', error);
      return 0;
    }
  }

  /**
   * Obtenir statistiques stockage
   */
  async getStorageStats() {
    try {
      const tempDir = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(tempDir);
      
      let totalSize = 0;
      let imageCount = 0;
      let signatureCount = 0;

      for (const file of files) {
        const fileUri = `${tempDir}${file}`;
        const size = await this.getFileSize(fileUri);
        totalSize += size;

        if (file.startsWith('photo_') || file.startsWith('image_')) {
          imageCount++;
        } else if (file.startsWith('signature_')) {
          signatureCount++;
        }
      }

      return {
        totalFiles: files.length,
        images: imageCount,
        signatures: signatureCount,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      };

    } catch (error) {
      console.error('Erreur stats stockage:', error);
      return null;
    }
  }
}

export default new CameraService();