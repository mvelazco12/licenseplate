// app/index.tsx
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, View } from 'react-native';
import { API_BASE } from '../../constants/config'; // <-- Usa tu config.ts

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [placa, setPlaca] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Necesitas permitir acceso a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setImage(uri);
      procesarFoto(uri);
    }
  };

  const procesarFoto = async (uri: string) => {
    setLoading(true);
    setPlaca('');

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'placa.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.plate) {
        const texto = data.plate.toUpperCase();
        setPlaca(texto);
        Speech.speak(texto, { language: 'es' });
      } else {
        setPlaca('No se detectó placa');
        Speech.speak('No se detectó placa');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detector de Placas</Text>

      <Button title="Tomar Foto" onPress={tomarFoto} />

      {image && <Image source={{ uri: image }} style={styles.image} />}

      {loading ? (
        <Text style={styles.text}>Procesando...</Text>
      ) : (
        <Text style={styles.text}>Placa: {placa}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  image: { width: 300, height: 200, marginVertical: 20, borderRadius: 10 },
  text: { fontSize: 20, marginTop: 10 },
});