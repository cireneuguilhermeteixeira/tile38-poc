// FloorPlanMap.js
import React from 'react';
import { View, Dimensions, ScrollView } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText } from 'react-native-svg';

const normalizeCoordinates = (coords, width, height, padding = 10) => {
  const lats = coords.map(([lat, _]) => lat);
  const lngs = coords.map(([_, lng]) => lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return coords.map(([lat, lng]) => {
    const x = padding + ((lng - minLng) / lngRange) * (width - padding * 2);
    const y = padding + ((maxLat - lat) / latRange) * (height - padding * 2);
    return [x, y];
  });
};

export default function FloorMap({ areas = [], userLocation = null }) {
  const { width } = Dimensions.get('window');
  const height = width; // mapa quadrado

  const allCoords = [];

  areas.forEach(area =>
    area.coordinates[0].forEach(([lng, lat]) =>
      allCoords.push([lat, lng])
    )
  );

  if (userLocation) {
    allCoords.push([userLocation.latitude, userLocation.longitude]);
  }

  const normalized = normalizeCoordinates(allCoords, width, height);

  let index = 0;

  return (
    <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Svg height={height} width={width}>
            {areas.map((area, idx) => {
              const numPoints = area.coordinates[0].length;
              const coords = normalized.slice(index, index + numPoints);
              index += numPoints;
              const points = coords.map(p => p.join(',')).join(' ');

              return (
                <React.Fragment key={`area-${idx}`}>
                  <Polygon
                    points={points}
                    fill="rgba(0, 128, 255, 0.2)"
                    stroke="blue"
                    strokeWidth="2"
                  />
                  {area.name && coords[0] && (
                    <SvgText
                      x={coords[0][0] + 4}
                      y={coords[0][1] - 4}
                      fill="black"
                      fontSize="12"
                    >
                      {area.name}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}

            {userLocation && (() => {
              const [userX, userY] = normalized[normalized.length - 1]; // último da lista
              return (
                <Circle
                  cx={userX}
                  cy={userY}
                  r="8"
                  fill="red"
                />
              );
            })()}
          </Svg>
        </View>
      </ScrollView>
    </ScrollView>
  );
}
