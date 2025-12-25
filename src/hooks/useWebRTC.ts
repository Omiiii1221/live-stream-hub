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
  const pendingCallsRef = useRef<Map<string, MediaConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const viewerCallRef = useRef<MediaConnection | null>(null);
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
      console.log('[WebRTC] Host: Setting up call listener');
      newPeer.on('call', (call) => {
        console.log('[WebRTC] Incoming call from viewer:', call.peer);
        
        if (localStreamRef.current) {
          // Host already has a stream, answer immediately
          const stream = localStreamRef.current;
          console.log('[WebRTC] Answering call with existing stream');
          
          try {
            call.answer(stream);
            console.log('[WebRTC] Call answered successfully');
            connectionsRef.current.set(call.peer, call);
            setViewerCount(connectionsRef.current.size);

            call.on('close', () => {
              console.log('[WebRTC] Viewer disconnected:', call.peer);
              connectionsRef.current.delete(call.peer);
              setViewerCount(connectionsRef.current.size);
            });

            call.on('error', (err) => {
              console.error('[WebRTC] Call error after answering:', err);
            });
          } catch (error) {
            console.error('[WebRTC] Error answering call:', error);
          }
        } else {
          // Host doesn't have a stream yet, store the call for later
          console.log('[WebRTC] Storing pending call, waiting for stream');
          pendingCallsRef.current.set(call.peer, call);
          
          call.on('close', () => {
            console.log('[WebRTC] Pending call closed:', call.peer);
            pendingCallsRef.current.delete(call.peer);
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
      pendingCallsRef.current.forEach((call) => call.close());
      pendingCallsRef.current.clear();
      if (viewerCallRef.current) {
        viewerCallRef.current.close();
        viewerCallRef.current = null;
      }
      newPeer.destroy();
    };
  }, [streamId, isHost, hostPeerId, broadcastMessage]);

  const startBroadcast = useCallback((stream: MediaStream) => {
    console.log('[WebRTC] Starting broadcast with stream');
    localStreamRef.current = stream;
    setMessages([]);
    
    console.log('[WebRTC] Pending calls to answer:', pendingCallsRef.current.size);
    
    // Answer all pending calls with the new stream
    pendingCallsRef.current.forEach((call, peerId) => {
      console.log('[WebRTC] Answering pending call from viewer:', peerId);
      try {
        console.log('[WebRTC] Answering pending call with stream');
        call.answer(stream);
        console.log('[WebRTC] Pending call answered successfully');
        connectionsRef.current.set(peerId, call);
        pendingCallsRef.current.delete(peerId);
        
        call.on('close', () => {
          console.log('[WebRTC] Viewer disconnected:', peerId);
          connectionsRef.current.delete(peerId);
          setViewerCount(connectionsRef.current.size);
        });

        call.on('error', (err) => {
          console.error('[WebRTC] Pending call error after answering:', err);
        });
      } catch (error) {
        console.error('[WebRTC] Error answering pending call:', error);
      }
    });
    
    setViewerCount(connectionsRef.current.size);
  }, []);

  const stopBroadcast = useCallback(() => {
    console.log('[WebRTC] Stopping broadcast');
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
    }
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current.clear();
    dataConnectionsRef.current.forEach((conn) => conn.close());
    dataConnectionsRef.current.clear();
    pendingCallsRef.current.forEach((call) => call.close());
    pendingCallsRef.current.clear();
    setViewerCount(0);
  }, []);

  const connectToStream = useCallback(() => {
    if (!peer || isHost) {
      console.log('[WebRTC] Cannot connect: peer not ready or is host');
      return;
    }

    if (viewerCallRef.current) {
      console.log('[WebRTC] Closing existing call');
      viewerCallRef.current.close();
    }

    console.log('[WebRTC] Connecting to host:', hostPeerId);
    
    const initiateCall = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.fillRect(0, 0, 1, 1);
      const dummyStream = canvas.captureStream(1);
      
      const call = peer.call(hostPeerId, dummyStream);
      
      if (!call) {
        console.error('[WebRTC] Failed to create call to host');
        setError('Failed to connect to stream');
        dummyStream.getTracks().forEach(track => track.stop());
        return;
      }

      viewerCallRef.current = call;
      console.log('[WebRTC] Call created, waiting for stream...');

      const dataConnection = peer.connect(hostPeerId);
      dataConnectionsRef.current.set(hostPeerId, dataConnection);
      dataConnection.on('open', () => console.log('[WebRTC] Data connection established with host'));
      dataConnection.on('data', (data) => setMessages((prev) => [...prev, data as ChatMessage]));
      dataConnection.on('close', () => dataConnectionsRef.current.delete(hostPeerId));

      call.on('stream', (stream) => {
        console.log('[WebRTC] Received remote stream from host');
        dummyStream.getTracks().forEach(track => track.stop());
        setRemoteStream(stream);
        setError(null);
      });

      call.on('close', () => {
        console.log('[WebRTC] Connection to host closed');
        dummyStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
        if (viewerCallRef.current === call) {
          viewerCallRef.current = null;
        }
      });

      call.on('error', (err) => {
        console.error('[WebRTC] Call error:', err);
        setError(`Connection error: ${err.message || 'Unknown error'}`);
        if (viewerCallRef.current === call) {
          viewerCallRef.current = null;
        }
      });
    };
    
    initiateCall();
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