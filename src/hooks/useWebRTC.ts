import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';

interface UseWebRTCOptions {
  streamId: string;
  isHost: boolean;
}

export const useWebRTC = ({ streamId, isHost }: UseWebRTCOptions) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Generate a consistent peer ID based on streamId
  const hostPeerId = `stream-host-${streamId}`;

  useEffect(() => {
    // Create peer with a unique ID
    const peerId = isHost ? hostPeerId : `viewer-${streamId}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[WebRTC] Initializing peer as ${isHost ? 'HOST' : 'VIEWER'} with ID: ${peerId}`);
    
    const newPeer = new Peer(peerId, {
      debug: 2,
    });

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

    // Host: Listen for incoming connections from viewers
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
            setViewerCount(connectionsRef.current.size);
          });
        }
      });
    }

    return () => {
      console.log('[WebRTC] Cleaning up peer');
      connectionsRef.current.forEach((conn) => conn.close());
      connectionsRef.current.clear();
      newPeer.destroy();
    };
  }, [streamId, isHost, hostPeerId]);

  // Host: Start broadcasting a stream
  const startBroadcast = useCallback((stream: MediaStream) => {
    console.log('[WebRTC] Starting broadcast with stream');
    localStreamRef.current = stream;
    
    // Update existing connections with new stream
    connectionsRef.current.forEach((conn, peerId) => {
      console.log('[WebRTC] Updating stream for viewer:', peerId);
      conn.close();
    });
    connectionsRef.current.clear();
    setViewerCount(0);
  }, []);

  // Host: Stop broadcasting
  const stopBroadcast = useCallback(() => {
    console.log('[WebRTC] Stopping broadcast');
    localStreamRef.current = null;
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current.clear();
    setViewerCount(0);
  }, []);

  // Viewer: Connect to a host's stream
  const connectToStream = useCallback(() => {
    if (!peer || isHost) return;

    console.log('[WebRTC] Connecting to host:', hostPeerId);
    
    // Create a silent audio track to initiate the call
    const silentStream = new MediaStream();
    
    const call = peer.call(hostPeerId, silentStream);
    
    if (!call) {
      setError('Failed to connect to stream');
      return;
    }

    call.on('stream', (stream) => {
      console.log('[WebRTC] Received remote stream from host');
      setRemoteStream(stream);
      setError(null);
    });

    call.on('close', () => {
      console.log('[WebRTC] Connection to host closed');
      setRemoteStream(null);
    });

    call.on('error', (err) => {
      console.error('[WebRTC] Call error:', err);
      setError('Connection error');
    });
  }, [peer, isHost, hostPeerId]);

  return {
    peer,
    isConnected,
    viewerCount,
    remoteStream,
    error,
    startBroadcast,
    stopBroadcast,
    connectToStream,
  };
};
