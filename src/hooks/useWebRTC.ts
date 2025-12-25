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
  const pendingCallsRef = useRef<Map<string, MediaConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const viewerCallRef = useRef<MediaConnection | null>(null);

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
      console.log('[WebRTC] Host: Setting up call listener');
      newPeer.on('call', (call) => {
        console.log('[WebRTC] Incoming call from viewer:', call.peer);
        console.log('[WebRTC] Call object:', call);
        console.log('[WebRTC] localStreamRef.current exists?', !!localStreamRef.current);
        console.log('[WebRTC] localStreamRef.current:', localStreamRef.current);
        
        if (localStreamRef.current) {
          // Host already has a stream, answer immediately
          const stream = localStreamRef.current;
          const videoTracks = stream.getVideoTracks();
          const audioTracks = stream.getAudioTracks();
          
          console.log('[WebRTC] Answering call with existing stream');
          console.log('[WebRTC] Stream details when answering:', {
            id: stream.id,
            active: stream.active,
            videoTracks: videoTracks.length,
            audioTracks: audioTracks.length,
          });
          
          if (videoTracks.length === 0) {
            console.error('[WebRTC] WARNING: No video tracks in stream when answering call!');
            return; // Don't answer if there are no video tracks
          }
          
          // Ensure all tracks are enabled and active
          videoTracks.forEach(track => {
            console.log('[WebRTC] Video track state:', {
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
            });
            if (!track.enabled) {
              console.log('[WebRTC] Enabling video track');
              track.enabled = true;
            }
          });
          
          // Ensure audio tracks are enabled
          audioTracks.forEach(track => {
            console.log('[WebRTC] Audio track state:', {
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
            });
            if (!track.enabled) {
              console.log('[WebRTC] Enabling audio track');
              track.enabled = true;
            }
          });
          
          // Use the original stream directly - PeerJS should handle it correctly
          // Creating a new MediaStream might cause track transmission issues
          console.log('[WebRTC] Answering with original stream (not cloned)');
          
          try {
            call.answer(stream);
            console.log('[WebRTC] Call answered successfully');
            connectionsRef.current.set(call.peer, call);
            setViewerCount(connectionsRef.current.size);

            call.on('stream', (remoteStream) => {
              console.log('[WebRTC] Received stream from viewer (unexpected):', remoteStream);
            });

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
      connectionsRef.current.clear();
      pendingCallsRef.current.forEach((call) => call.close());
      pendingCallsRef.current.clear();
      if (viewerCallRef.current) {
        viewerCallRef.current.close();
        viewerCallRef.current = null;
      }
      newPeer.destroy();
    };
  }, [streamId, isHost, hostPeerId]);

  // Host: Start broadcasting a stream
  const startBroadcast = useCallback((stream: MediaStream) => {
    console.log('[WebRTC] Starting broadcast with stream');
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    
    console.log('[WebRTC] Broadcast stream details:', {
      id: stream.id,
      active: stream.active,
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
    });
    
    if (videoTracks.length === 0) {
      console.error('[WebRTC] ERROR: No video tracks in broadcast stream!');
    }
    
    // Ensure all tracks are enabled
    videoTracks.forEach(track => {
      if (!track.enabled) {
        console.log('[WebRTC] Enabling video track in broadcast stream');
        track.enabled = true;
      }
    });
    
    // Ensure audio tracks are enabled
    audioTracks.forEach(track => {
      if (!track.enabled) {
        console.log('[WebRTC] Enabling audio track in broadcast stream');
        track.enabled = true;
      }
    });
    
    localStreamRef.current = stream;
    console.log('[WebRTC] localStreamRef.current set to:', {
      id: stream.id,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
    });
    console.log('[WebRTC] Pending calls to answer:', pendingCallsRef.current.size);
    
    // Answer all pending calls with the new stream
    pendingCallsRef.current.forEach((call, peerId) => {
      console.log('[WebRTC] Answering pending call from viewer:', peerId);
      console.log('[WebRTC] Using original stream for pending call:', {
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });
      
      // Use the original stream directly - PeerJS should handle it correctly
      try {
        console.log('[WebRTC] Answering pending call with stream');
        call.answer(stream);
        console.log('[WebRTC] Pending call answered successfully');
        connectionsRef.current.set(peerId, call);
        pendingCallsRef.current.delete(peerId);
        
        call.on('stream', (remoteStream) => {
          console.log('[WebRTC] Received stream from viewer (unexpected):', remoteStream);
        });

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
    
    // Update viewer count
    setViewerCount(connectionsRef.current.size);
  }, []);

  // Host: Stop broadcasting
  const stopBroadcast = useCallback(() => {
    console.log('[WebRTC] Stopping broadcast');
    localStreamRef.current = null;
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current.clear();
    pendingCallsRef.current.forEach((call) => call.close());
    pendingCallsRef.current.clear();
    setViewerCount(0);
  }, []);

  // Viewer: Connect to a host's stream
  const connectToStream = useCallback(() => {
    if (!peer || isHost) {
      console.log('[WebRTC] Cannot connect: peer not ready or is host');
      return;
    }

    // Close any existing call
    if (viewerCallRef.current) {
      console.log('[WebRTC] Closing existing call');
      viewerCallRef.current.close();
      viewerCallRef.current = null;
    }

    console.log('[WebRTC] Connecting to host:', hostPeerId);
    
    // Initiate call with a dummy video track (receive-only)
    // PeerJS requires at least one track to establish connection properly
    // We'll create a minimal canvas track that won't interfere with receiving
    const initiateCall = async () => {
      console.log('[WebRTC] Initiating receive-only call with dummy video track');
      
      // Create a minimal canvas video track for call initiation
      // This ensures PeerJS establishes a proper video connection
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      const dummyStream = canvas.captureStream(0); // 0 fps = minimal bandwidth
      const dummyTrack = dummyStream.getVideoTracks()[0];
      if (dummyTrack) {
        dummyTrack.enabled = false; // Disable to save bandwidth
      }
      
      console.log('[WebRTC] Created dummy video track for call initiation');
      const call = peer.call(hostPeerId, dummyStream);
      
      if (!call) {
        console.error('[WebRTC] Failed to create call to host');
        setError('Failed to connect to stream');
        // Clean up dummy stream
        dummyStream.getTracks().forEach(track => track.stop());
        return;
      }

      viewerCallRef.current = call;
      console.log('[WebRTC] Call created, waiting for stream...');

      let streamReceived = false;
      call.on('stream', (stream) => {
        streamReceived = true;
        console.log('[WebRTC] Received remote stream from host');
        
        // Clean up dummy stream now that we have the real stream
        dummyStream.getTracks().forEach(track => {
          track.stop();
          console.log('[WebRTC] Stopped dummy track');
        });
        
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        console.log('[WebRTC] Stream details:', {
          id: stream.id,
          active: stream.active,
          videoTracks: videoTracks.length,
          audioTracks: audioTracks.length,
        });
        
        // Log detailed track information
        if (videoTracks.length > 0) {
          videoTracks.forEach((track, index) => {
            console.log(`[WebRTC] Video track ${index}:`, {
              id: track.id,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
              kind: track.kind,
              label: track.label,
            });
          });
        } else {
          console.error('[WebRTC] ERROR: Received stream has NO video tracks!');
          console.log('[WebRTC] Stream object:', stream);
          console.log('[WebRTC] Stream tracks (all):', stream.getTracks());
        }
        
        setRemoteStream(stream);
        setError(null);
      });

      call.on('close', () => {
        console.log('[WebRTC] Connection to host closed');
        setRemoteStream(null);
        // Clean up dummy stream
        dummyStream.getTracks().forEach(track => track.stop());
        if (viewerCallRef.current === call) {
          viewerCallRef.current = null;
        }
      });

      call.on('error', (err) => {
        console.error('[WebRTC] Call error:', err);
        setError(`Connection error: ${err.message || err.type || 'Unknown error'}`);
        // Clean up dummy stream
        dummyStream.getTracks().forEach(track => track.stop());
        if (viewerCallRef.current === call) {
          viewerCallRef.current = null;
        }
      });

      // Add a timeout to detect if stream doesn't arrive
      setTimeout(() => {
        if (viewerCallRef.current === call && !streamReceived) {
          console.warn('[WebRTC] Stream not received after 5 seconds');
          console.log('[WebRTC] The host may not be broadcasting yet, or there may be a connection issue');
        }
      }, 5000);
    };
    
    initiateCall();
    return;
    
    if (!call) {
      console.error('[WebRTC] Failed to create call to host');
      setError('Failed to connect to stream');
      return;
    }

    viewerCallRef.current = call;
    console.log('[WebRTC] Call created, waiting for stream...');

    call.on('stream', (stream) => {
      console.log('[WebRTC] Received remote stream from host');
      console.log('[WebRTC] Stream details:', {
        id: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });
      setRemoteStream(stream);
      setError(null);
    });

    call.on('close', () => {
      console.log('[WebRTC] Connection to host closed');
      setRemoteStream(null);
      if (viewerCallRef.current === call) {
        viewerCallRef.current = null;
      }
    });

    call.on('error', (err) => {
      console.error('[WebRTC] Call error:', err);
      setError(`Connection error: ${err.message || err.type || 'Unknown error'}`);
      if (viewerCallRef.current === call) {
        viewerCallRef.current = null;
      }
    });

    // Add a timeout to detect if stream doesn't arrive
    setTimeout(() => {
      if (viewerCallRef.current === call && !remoteStream) {
        console.warn('[WebRTC] Stream not received after 5 seconds, call may be pending');
      }
    }, 5000);
  }, [peer, isHost, hostPeerId, remoteStream]);

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
