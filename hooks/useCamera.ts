import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { compressAndSavePhoto } from '@/services/imageUtils';

export function useCamera() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await compressAndSavePhoto(result.assets[0].uri);
        setPhoto(savedUri);
        return savedUri;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await compressAndSavePhoto(result.assets[0].uri);
        setPhoto(savedUri);
        return savedUri;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPhoto = useCallback(() => setPhoto(null), []);

  return { photo, loading, takePhoto, pickFromLibrary, clearPhoto };
}
