// app/index.tsx
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE } from '../../constants/config';

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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();

      if (data.plate && data.plate !== 'No detectado') {
        const texto = data.plate.toUpperCase();
        setPlaca(texto);
        Speech.speak(texto, { language: 'es' });
      } else {
        setPlaca('No detectado');
        Speech.speak('No se detectó placa');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
      console.error(error);
      setPlaca('Error');
    } finally {
      setLoading(false);
    }
  };

  const hablarPlaca = () => {
    if (placa && placa !== 'No detectado' && placa !== 'Error') {
      Speech.speak(placa, { language: 'es' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detector de Placas</Text>

      <Button title="Tomar Foto" onPress={tomarFoto} />

      {image && <Image source={{ uri: image }} style={styles.image} />}

      {loading ? (
        <Text style={styles.loading}>Procesando...</Text>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.label}>Placa detectada:</Text>

          {/* RECUADRO CON LETRAS GRANDES */}
          <View style={styles.plateBox}>
            <Text style={styles.plateText}>{placa}</Text>
          </View>

          {/* BOTÓN PARA ESCUCHAR */}
          {placa && placa !== 'No detectado' && placa !== 'Error' && (
            <TouchableOpacity style={styles.speakButton} onPress={hablarPlaca}>
              <Text style={styles.speakText}>Escuchar Placa</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  image: { width: 300, height: 200, marginVertical: 20, borderRadius: 12, borderWidth: 2, borderColor: '#ddd' },
  loading: { fontSize: 18, color: '#666', marginTop: 10 },
  resultContainer: { alignItems: 'center', marginTop: 20 },
  label: { fontSize: 18, color: '#555', marginBottom: 10 },
  plateBox: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  plateText: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 3 },
  speakButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  speakText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});