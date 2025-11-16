import { useEffect, useRef, useState } from "react";
import { queryClient } from "./queryClient";

export function useWebSocket(address?: string) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnected(true);
      // Register wallet address
      ws.current?.send(JSON.stringify({
        type: 'register',
        address,
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Invalidate queries based on event type
        switch (message.event) {
          case 'transaction:created':
          case 'transaction:updated':
            queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
            break;
          case 'bill:created':
          case 'bill:updated':
            queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
            break;
          case 'invoice:created':
          case 'invoice:updated':
            queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
            break;
          case 'merchant:created':
          case 'merchant:updated':
            queryClient.invalidateQueries({ queryKey: ['/api/merchant-payments'] });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [address]);

  return { connected };
}
