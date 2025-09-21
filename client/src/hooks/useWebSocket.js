import { useEffect, useRef, useCallback } from "react";
import { WS_URL } from "../utils/constants.js";
import { authService } from "../services/auth.js";

export const useWebSocket = onMessage => {
  const ws = useRef(null);

  const connect = useCallback(() => {
    const token = authService.getToken();
    if (!token) return;

    ws.current = new WebSocket(`${WS_URL}/ws?token=${token}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.current.onerror = error => {
      console.error("WebSocket error:", error);
    };
  }, [onMessage]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback(message => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
};
