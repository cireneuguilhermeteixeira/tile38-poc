import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Polygon, Circle } from 'react-native-svg';

// const geoPolygon = [
//   [-38.5430, -3.7170],
//   [-38.5425, -3.7170],
//   [-38.5425, -3.7165],
//   [-38.5430, -3.7165],
//   [-38.5430, -3.7170],
// ];

// const userPosition = [-38.54275, -3.71675]; // [lng, lat]


export default function FloorMap({ userPosition, geoPolygon }: {userPosition: Array<number>, geoPolygon: Array<Array<number>>}) {
  const { width } = Dimensions.get('window');
  const height = width; // square




const normalizeCoordinates = (coords: Array<Array<number>>, width: number, height: number, padding = 10) => {
  const lats = coords.map(([, lat]) => lat);
  const lngs = coords.map(([lng]) => lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  return coords.map(([lng, lat]) => {
    const x = padding + ((lng - minLng) / lngRange) * (width - padding * 2);
    const y = padding + ((maxLat - lat) / latRange) * (height - padding * 2);
    return [x, y];
  });
};


  const roomCoords = normalizeCoordinates(geoPolygon, width, height);
  const userCoords = normalizeCoordinates([userPosition], width, height)[0];

  return (
    <View style={{ flex: 1 }}>
      <Svg height={height} width={width}>
        <Polygon
          points={roomCoords.map(p => p.join(',')).join(' ')}
          fill="rgba(0, 128, 255, 0.3)"
          stroke="blue"
          strokeWidth="2"
        />
        <Circle
          cx={userCoords[0]}
          cy={userCoords[1]}
          r="8"
          fill="red"
        />
      </Svg>
    </View>
  );
}
