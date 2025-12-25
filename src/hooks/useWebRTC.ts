import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { ChatMessage } from '@/types';

interface UseWebRTCOptions {
  streamId: string;
  isHost: boolean;
  username: string;
}

export const useWebRTC = ({ streamId, isHost, username }: UseWebRTCOptions) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const dataConnectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerIdRef = useRef<string | null>(null);

  const hostPeerId = `stream-host-${streamId}`;

  const broadcastMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    dataConnectionsRef.current.forEach((conn) => {
      conn.send(message);
    });
  }, []);

  useEffect(() => {
    const peerId = isHost ? hostPeerId : `viewer-${streamId}-${Math.random().toString(36).substr(2, 9)}`;
    peerIdRef.current = peerId;
    
    console.log(`[WebRTC] Initializing peer as ${isHost ? 'HOST' : 'VIEWER'} with ID: ${peerId}`);
    
    const newPeer = new Peer(peerId, { debug: 2 });

    newPeer.on('open', (id) => {
      console.log(`[WebRTC] Peer connected with ID: ${id}`);
      setIsConnected(true);
      setPeer(newPeer);
    });

    newPeer.on('error', (err) => {
      console.error('[WebRTC] Peer error:', err);
      if (err.type === 'unavailable-id') {
        setError('Stream is already being hosted');
      } else if (err.type === 'peer-unavailable') {
        setError('Stream not found or host is offline');
      } else {
        setError(err.message);
      }
    });

    newPeer.on('disconnected', () => {
      console.log('[WebRTC] Peer disconnected');
      setIsConnected(false);
    });
    
    // Handle incoming data connections
    newPeer.on('connection', (conn) => {
      console.log(`[WebRTC] Incoming data connection from ${conn.peer}`);
      dataConnectionsRef.current.set(conn.peer, conn);

      conn.on('data', (data) => {
        const message = data as ChatMessage;
        console.log(`[WebRTC] Received message from ${conn.peer}:`, message.message);
        if (isHost) {
          broadcastMessage(message);
        } else {
          setMessages((prev) => [...prev, message]);
        }
      });

      conn.on('close', () => {
        console.log(`[WebRTC] Data connection closed with ${conn.peer}`);
        dataConnectionsRef.current.delete(conn.peer);
      });
    });

    if (isHost) {
      newPeer.on('call', (call) => {
        console.log('[WebRTC] Incoming call from viewer:', call.peer);
        
        if (localStreamRef.current) {
          call.answer(localStreamRef.current);
          connectionsRef.current.set(call.peer, call);
          setViewerCount(connectionsRef.current.size);

          call.on('close', () => {
            console.log('[WebRTC] Viewer disconnected:', call.peer);
            connectionsRef.current.delete(call.peer);
            dataConnectionsRef.current.get(call.peer)?.close();
            dataConnectionsRef.current.delete(call.peer);
            setViewerCount(connectionsRef.current.size);
          });
        }
      });
    }

    return () => {
      console.log('[WebRTC] Cleaning up peer');
      connectionsRef.current.forEach((conn) => conn.close());
      dataConnectionsRef.current.forEach((conn) => conn.close());
      connectionsRef.current.clear();
      dataConnectionsRef.current.clear();
      newPeer.destroy();
    };
  }, [streamId, isHost, hostPeerId, broadcastMessage]);

  const startBroadcast = useCallback((stream: MediaStream) => {
    console.log('[WebRTC] Starting broadcast with stream');
    localStreamRef.current = stream;
    setMessages([]);
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current.clear();
    setViewerCount(0);
  }, []);

  const stopBroadcast = useCallback(() => {
    console.log('[WebRTC] Stopping broadcast');
    localStreamRef.current = null;
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current.clear();
    dataConnectionsRef.current.forEach((conn) => conn.close());
    dataConnectionsRef.current.clear();
    setViewerCount(0);
  }, []);

  const connectToStream = useCallback(() => {
    if (!peer || isHost || !peerIdRef.current) return;

    console.log('[WebRTC] Connecting to host:', hostPeerId);
    
    const silentStream = new MediaStream();
    const call = peer.call(hostPeerId, silentStream);
    
    if (!call) {
      setError('Failed to connect to stream');
      return;
    }

    const dataConnection = peer.connect(hostPeerId);
    dataConnectionsRef.current.set(hostPeerId, dataConnection);

    dataConnection.on('open', () => {
      console.log('[WebRTC] Data connection established with host');
    });

    dataConnection.on('data', (data) => {
      const message = data as ChatMessage;
      setMessages((prev) => [...prev, message]);
    });
    
    dataConnection.on('close', () => {
      console.log('[WebRTC] Data connection with host closed');
      dataConnectionsRef.current.delete(hostPeerId);
    });

    call.on('stream', (stream) => {
      console.log('[WebRTC] Received remote stream from host');
      setRemoteStream(stream);
      setError(null);
    });

    call.on('close', () => {
      console.log('[WebRTC] Connection to host closed');
      setRemoteStream(null);
      dataConnectionsRef.current.get(hostPeerId)?.close();
    });

    call.on('error', (err) => {
      console.error('[WebRTC] Call error:', err);
      setError('Connection error');
    });
  }, [peer, isHost, hostPeerId]);

  const sendMessage = useCallback((messageText: string) => {
    if (!peerIdRef.current) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      streamId,
      userId: peerIdRef.current,
      username,
      message: messageText,
      timestamp: new Date(),
    };

    if (isHost) {
      broadcastMessage(message);
    } else {
      const hostConnection = dataConnectionsRef.current.get(hostPeerId);
      if (hostConnection) {
        hostConnection.send(message);
        // Also add to own messages immediately for better UX
        setMessages((prev) => [...prev, message]);
      }
    }
  }, [isHost, streamId, username, hostPeerId, broadcastMessage]);

  return {
    peer,
    isConnected,
    viewerCount,
    remoteStream,
    messages,
    error,
    startBroadcast,
    stopBroadcast,
    connectToStream,
    sendMessage,
  };
};
