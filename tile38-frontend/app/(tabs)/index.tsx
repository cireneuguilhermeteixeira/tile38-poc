import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import FloorMap from './floor_map';

const BACKEND_URL = 'http://localhost:3000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export default function App() {
  const [location, setLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [geoPolygon, setGeoPolygon] = useState([[]]);


  const getRooms = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/rooms`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const geolocation = await resp.json();
      console.log("geolocation", geolocation.object.coordinates[0]);
      setGeoPolygon(geolocation.object.coordinates[0]);

    }catch(e) {
      console.log("Error when try to get rooms", e);
    }
  }



  useEffect(() => {
    const setupLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission denied to access location');
        return;
      }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
        async (loc) => {
          const coords = loc.coords;
          setLocation(coords);

          await fetch(`${BACKEND_URL}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: coords.latitude,
              lon: coords.longitude,
            }),
          });
        }
      );
    };
    getRooms();
    setupLocationTracking();
  }, []);



  useEffect(() => {
    const socket = io(WS_URL);

    console.log("WS_URL", WS_URL);
    socket.on('connect', () => {
      console.log('Connected via WebSocket');
    });

    socket.on('tile38-event', (data) => {
      console.log('Event received:', data);
      setEvents((prev) => [...prev, data]);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => socket.disconnect();
  }, []);


  




  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <Text>📍 Current Location:</Text>
      {location ? (
        <>
          <Text>{location.latitude}, {location.longitude}</Text>        
          <FloorMap 
          geoPolygon={geoPolygon}
          userPosition={[location.latitude, location.longitude]}/>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
     

      <Text style={{ marginTop: 20 }}>🛰️ Events receiveds from Tile38:</Text>
      {events.map((e, i) => (
        <Text key={i} style={{ fontSize: 12 }}>{JSON.stringify(e)}</Text>
      ))}
    </View>
  );
}
