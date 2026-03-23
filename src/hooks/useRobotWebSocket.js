import { useState, useEffect, useRef, useCallback } from 'react';

const RECONNECT_DELAY = 1500;
const getWsUrl = () => {
    const host = window.location.hostname || 'localhost';
    return `ws://${host}:8765`;
};
const WS_URL = getWsUrl();

export function useRobotWebSocket() {
  const [joints, setJoints] = useState({
    base: 90, shoulder: 45, elbow: 30, gripper: 0
  });
  const [gesture, setGesture] = useState('IDLE');
  const [connected, setConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const [syncId, setSyncId] = useState(0);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setJoints(data.joints);
        setGesture(data.gesture);
        if (data.client_count !== undefined) setClientCount(data.client_count);
        if (data.sync_id !== undefined) setSyncId(data.sync_id);
      } catch (_) {}
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { joints, gesture, connected, syncId, clientCount };
}
