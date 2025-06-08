import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import FloorMap from '@/components/FloorMap';

const BACKEND_URL = 'http://192.168.0.13:3000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export default function App() {
  const [location, setLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isOnArea, setIsOnArea] = useState(null);


  const getRooms = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/rooms`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const geolocation = await resp.json();
      console.log("geolocation", geolocation.object.coordinates[0]);
      setAreas([geolocation.object]);

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
              id: Platform.OS,
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
      console.log("data.detect", data.detect)
      
      setIsOnArea(data.detect === 'enter')
      
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => socket.disconnect();
  }, []);



  const userStatus = {
    true: "User is in the Area",
    false: "User is outside the Area"
  }




  return (
    <ScrollView>
    <View style={{ padding: 20, marginTop: 50 }}>

      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          marginVertical: 20,
          color: isOnArea ? 'green' : 'red', // ou qualquer cor indicativa de status
      }}
      >
        Status: {userStatus[String(isOnArea)] || "Unknown status"}
      </Text>

      <Text
       style={{
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    }}
      > 📍 Current Location:: </Text>
      {location && areas.length > 0 ? (
        <>
          <Text 
          style={{
            fontStyle: 'italic',
            fontWeight: 'bold',
            textAlign: 'center',
            marginVertical: 20,
        }}
          >{location.latitude}, {location.longitude}</Text>  
          <FloorMap 
          isOnArea={isOnArea}
         areas={areas}
         userLocation={location}
          />
        </>
      ) : (
        <Text>Loading...</Text>
      )}
     

      <Text 
       style={{
        marginTop: 20,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    }}>🛰️ Events receiveds from Tile38:</Text>
      {events.map((e, i) => (
        <Text key={i} style={{ fontSize: 12 }}>{JSON.stringify(e)}</Text>
      ))}
    </View>
    </ScrollView>
  );
}
