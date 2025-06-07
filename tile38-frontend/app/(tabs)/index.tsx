import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import * as Location from 'expo-location';
import io from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3000'; // ajuste se for rodar fora do emulador
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export default function App() {
  const [location, setLocation] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // 1. Pedir permissão e pegar localização
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão de localização negada');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      // 2. Enviar para o servidor
      await fetch(`${BACKEND_URL}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude
        })
      });
    })();
  }, []);

  useEffect(() => {
    // 3. Open WebSocket
    const socket = io(WS_URL);

    socket.on('connect', () => {
      console.log('WebSocket connected!');
    });

    socket.on('tile38-event', (data) => {
      console.log('Event received:', data);
      setEvents((e) => [...e, data]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <Text>Current Location:</Text>
      {location ? (
        <Text>{location.latitude}, {location.longitude}</Text>
      ) : (
        <Text>Loading...</Text>
      )}

      <Text style={{ marginTop: 20 }}>Events receiveds:</Text>
      {events.map((e, i) => (
        <Text key={i}>{JSON.stringify(e)}</Text>
      ))}
    </View>
  );
}
