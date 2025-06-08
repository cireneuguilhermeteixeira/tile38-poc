// DeadReckoningTracker.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import io from 'socket.io-client';

const socket = io('http://YOUR_LOCAL_IP:3000'); // Substitua pelo IP da sua máquina

export default function DeadReckoningTracker() {
  const [subscription, setSubscription] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });

  // Refs para manter valores atualizados dentro do callback
  const lastTimeRef = useRef(null);
  const velocityRef = useRef(velocity);
  const positionRef = useRef(position);

  useEffect(() => {
    setVelocity(velocityRef.current);
  }, [velocityRef.current]);

  useEffect(() => {
    setPosition(positionRef.current);
  }, [positionRef.current]);

  const _subscribe = () => {
    const sub = Accelerometer.addListener(data => {
      const now = Date.now();
      if (lastTimeRef.current) {

        const threshold = 0.45;


        const dt = (now - lastTimeRef.current) / 1000;

        const ax = Math.abs(data.x) > threshold ? data.x : 0;
        const ay = Math.abs(data.y) > threshold ? data.y : 0;

        let vx, vy;
        if (ax === 0 && ay === 0) {
          vx = 0;
          vy = 0;
        } else {
          vx = velocityRef.current.x + ax * dt;
          vy = velocityRef.current.y + ay * dt;
        }

        const px = positionRef.current.x + vx * dt + 0.5 * ax * dt * dt;
        const py = positionRef.current.y + vy * dt + 0.5 * ay * dt * dt;

        const newPosition = { x: px, y: py };
        const newVelocity = { x: vx, y: vy }




        setVelocity(newVelocity);
        setPosition(newPosition);

        // Atualiza refs para manter os valores em tempo real
        velocityRef.current = newVelocity;
        positionRef.current = newPosition;

        socket.emit('dead-reckoning-position', newPosition);
      }
      lastTimeRef.current = now;
    });
    setSubscription(sub);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
    lastTimeRef.current = null;
};

  const reset = () => {
    const resetPos = { x: 0, y: 0 };
    setPosition(resetPos);
    setVelocity(resetPos);
    velocityRef.current = resetPos;
    positionRef.current = resetPos;
    lastTimeRef.current = null;
};

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Dead Reckoning Tracker</Text>
      <Text>Posição relativa estimada:</Text>
      <Text>X: {position.x.toFixed(2)} m</Text>
      <Text>Y: {position.y.toFixed(2)} m</Text>

      <View style={{ marginTop: 20 }}>
        <Button title={subscription ? 'Parar' : 'Iniciar'} onPress={subscription ? _unsubscribe : _subscribe} />
        <View style={{ marginTop: 10 }}>
          <Button title="Resetar Posição" onPress={reset} />
        </View>
      </View>
    </View>
  );
}
