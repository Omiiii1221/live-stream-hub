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
  // For host: store viewer streams
  const [viewerStreams, setViewerStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  // For viewer: their own local stream when sharing
  const [viewerLocalStream, setViewerLocalStream] = useState<MediaStream | null>(null);
  // For viewer: streams from other viewers
  const [otherViewerStreams, setOtherViewerStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map());
  
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const dataConnectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const pendingCallsRef = useRef<Map<string, MediaConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const viewerCallRef = useRef<MediaConnection | null>(null);
  const peerIdRef = useRef<string | null>(null);
  // For viewer: call to host when sharing their stream
  const viewerToHostCallRef = useRef<MediaConnection | null>(null);
  // For host: calls from viewers sharing their streams
  const viewerCallsRef = useRef<Map<string, MediaConnection>>(new Map());
  // Store usernames by peer ID
  const peerUsernamesRef = useRef<Map<string, string>>(new Map());

  const hostPeerId = `stream-host-${streamId}`;

  const broadcastMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    dataConnectionsRef.current.forEach((conn) => {
      conn.send(message);
    });
  }, [setMessages]);

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
        
        // Store username for this peer
        if (message.username) {
          peerUsernamesRef.current.set(conn.peer, message.username);
        }
        
        if (isHost) {
          broadcastMessage(message);
        } else {
          // Check if this is our own message (already added when sending)
          // If userId matches our peerId, skip adding to avoid duplicates
          if (message.userId !== peerIdRef.current) {
            setMessages((prev) => [...prev, message]);
          } else {
            console.log('[WebRTC] Skipping own message to avoid duplicate');
          }
        }
      });

      conn.on('close', () => {
        console.log(`[WebRTC] Data connection closed with ${conn.peer}`);
        dataConnectionsRef.current.delete(conn.peer);
        peerUsernamesRef.current.delete(conn.peer);
      });
    });

    // For viewers: listen for calls from other viewers (relayed through host)
    if (!isHost) {
      newPeer.on('call', (call) => {
        // This is a call from another viewer (relayed by host)
        console.log('[WebRTC] Viewer received call from another viewer:', call.peer);
        
        // Answer with dummy stream to receive their stream
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.fillRect(0, 0, 1, 1);
        const dummyStream = canvas.captureStream(0);
        
        try {
          call.answer(dummyStream);
          
          call.on('stream', (incomingStream) => {
            console.log('[WebRTC] Viewer received stream from another viewer:', call.peer);
            const viewerUsername = peerUsernamesRef.current.get(call.peer) || `Viewer-${call.peer.substring(0, 8)}`;
            setOtherViewerStreams((prev) => {
              const newMap = new Map(prev);
              newMap.set(call.peer, { stream: incomingStream, username: viewerUsername });
              return newMap;
            });
          });
          
          call.on('close', () => {
            console.log('[WebRTC] Other viewer stream closed:', call.peer);
            setOtherViewerStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(call.peer);
              return newMap;
            });
          });
        } catch (error) {
          console.error('[WebRTC] Error answering viewer call:', error);
        }
      });
    }

    if (isHost) {
      console.log('[WebRTC] Host: Setting up call listener');
      newPeer.on('call', (call) => {
        console.log('[WebRTC] Incoming call from viewer:', call.peer);
        
        let isViewerSharing = false;
        let viewerStreamReceived = false;
        
        // Check if this is a viewer sharing their stream (they send a stream)
        // Listen for stream from viewer - if we receive one, it means viewer is sharing
        call.on('stream', (incomingStream) => {
          console.log('[WebRTC] Host received stream from viewer:', call.peer);
          viewerStreamReceived = true;
          isViewerSharing = true;
          
          // This is a viewer sharing their stream
          // Get username from stored usernames or use default
          const viewerUsername = peerUsernamesRef.current.get(call.peer) || `Viewer-${call.peer.substring(0, 8)}`;
          
          // Ensure tracks are enabled
          incomingStream.getVideoTracks().forEach(track => {
            track.enabled = true;
            console.log('[WebRTC] Viewer video track:', { id: track.id, enabled: track.enabled, readyState: track.readyState });
          });
          incomingStream.getAudioTracks().forEach(track => {
            track.enabled = true;
            console.log('[WebRTC] Viewer audio track:', { id: track.id, enabled: track.enabled, readyState: track.readyState, muted: track.muted });
          });
          
          setViewerStreams((prev) => {
            const newMap = new Map(prev);
            newMap.set(call.peer, { stream: incomingStream, username: viewerUsername });
            console.log('[WebRTC] Added viewer stream to state, total streams:', newMap.size);
            return newMap;
          });
          viewerCallsRef.current.set(call.peer, call);
          
          // Broadcast this viewer's stream to all other viewers
          // Only broadcast to connected peers
          setTimeout(() => {
            const videoTracks = incomingStream.getVideoTracks();
            const audioTracks = incomingStream.getAudioTracks();
            
            console.log('[WebRTC] Preparing to broadcast viewer stream', {
              videoTracks: videoTracks.length,
              audioTracks: audioTracks.length,
              totalViewers: connectionsRef.current.size,
            });
            
            let broadcastCount = 0;
            const connectedViewers: string[] = [];
            
            // Collect all connected viewers first
            connectionsRef.current.forEach((viewerCall, viewerPeerId) => {
              if (viewerPeerId !== call.peer && viewerCall && viewerCall.open) {
                connectedViewers.push(viewerPeerId);
              }
            });
            
            console.log(`[WebRTC] Found ${connectedViewers.length} connected viewers to broadcast to`);
            
            // Broadcast to each connected viewer using the same stream
            connectedViewers.forEach(viewerPeerId => {
              try {
                // Use the same stream object - PeerJS will handle it
                // MediaStream tracks can be shared across multiple calls
                const broadcastCall = newPeer.call(viewerPeerId, incomingStream);
                if (broadcastCall) {
                  broadcastCount++;
                  console.log(`[WebRTC] Broadcasting viewer ${call.peer} stream to ${viewerPeerId}`);
                  
                  broadcastCall.on('error', (err) => {
                    console.error(`[WebRTC] Error broadcasting to ${viewerPeerId}:`, err);
                  });
                  
                  broadcastCall.on('close', () => {
                    console.log(`[WebRTC] Broadcast call to ${viewerPeerId} closed`);
                  });
                } else {
                  console.warn(`[WebRTC] Failed to create broadcast call to ${viewerPeerId}`);
                }
              } catch (error) {
                console.error(`[WebRTC] Error creating broadcast call to ${viewerPeerId}:`, error);
              }
            });
            
            console.log(`[WebRTC] Broadcast initiated to ${broadcastCount} viewers`);
          }, 500);
          
          // Track when this stream ends
          incomingStream.getTracks().forEach(track => {
            track.onended = () => {
              console.log('[WebRTC] Viewer stream track ended:', call.peer);
              setViewerStreams((prev) => {
                const newMap = new Map(prev);
                newMap.delete(call.peer);
                return newMap;
              });
              viewerCallsRef.current.delete(call.peer);
            };
          });
        });
        
        // Answer the call - differentiate between viewer sharing vs viewer receiving
        // Wait a bit to see if viewer sends a stream first
        const answerTimeout = setTimeout(() => {
          if (!viewerStreamReceived && localStreamRef.current) {
            // Viewer wants to receive host's stream, not sharing their own
            console.log('[WebRTC] Viewer wants to receive host stream, answering with host stream');
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
            
            const answerStream = new MediaStream();
            videoTracks.forEach(track => {
              answerStream.addTrack(track);
              console.log('[WebRTC] Added video track to answer stream');
            });
            audioTracks.forEach(track => {
              answerStream.addTrack(track);
              console.log('[WebRTC] Added audio track to answer stream');
            });
            
            console.log('[WebRTC] Answer stream created with:', {
              videoTracks: answerStream.getVideoTracks().length,
              audioTracks: answerStream.getAudioTracks().length,
              totalTracks: answerStream.getTracks().length,
            });
            
            try {
              call.answer(answerStream);
              console.log('[WebRTC] Call answered successfully with stream containing all tracks');
              connectionsRef.current.set(call.peer, call);
              setViewerCount(connectionsRef.current.size);

              call.on('close', () => {
                console.log('[WebRTC] Viewer disconnected:', call.peer);
                connectionsRef.current.delete(call.peer);
                setViewerCount(connectionsRef.current.size);
                // Also remove from viewer streams if it was there
                setViewerStreams((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(call.peer);
                  return newMap;
                });
                viewerCallsRef.current.delete(call.peer);
              });

              call.on('error', (err) => {
                console.error('[WebRTC] Call error after answering:', err);
              });
            } catch (error) {
              console.error('[WebRTC] Error answering call:', error);
            }
          } else if (viewerStreamReceived) {
            // Viewer is sharing their stream, just answer with a dummy stream to complete the connection
            console.log('[WebRTC] Viewer is sharing stream, answering with dummy stream');
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.fillRect(0, 0, 1, 1);
            const dummyStream = canvas.captureStream(0);
            
            try {
              call.answer(dummyStream);
              console.log('[WebRTC] Answered call with dummy stream to accept viewer stream');
              connectionsRef.current.set(call.peer, call);
              
              call.on('close', () => {
                console.log('[WebRTC] Viewer disconnected:', call.peer);
                connectionsRef.current.delete(call.peer);
                setViewerStreams((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(call.peer);
                  return newMap;
                });
                viewerCallsRef.current.delete(call.peer);
              });
            } catch (error) {
              console.error('[WebRTC] Error answering call with dummy stream:', error);
            }
          }
        }, 200);
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
      viewerCallsRef.current.forEach((call) => call.close());
      viewerCallsRef.current.clear();
      if (viewerCallRef.current) {
        viewerCallRef.current.close();
        viewerCallRef.current = null;
      }
      if (viewerToHostCallRef.current) {
        viewerToHostCallRef.current.close();
        viewerToHostCallRef.current = null;
      }
      if (viewerLocalStream) {
        viewerLocalStream.getTracks().forEach(track => track.stop());
      }
      newPeer.destroy();
    };
  }, [streamId, isHost, hostPeerId, broadcastMessage, setMessages]);

  const startBroadcast = useCallback((stream: MediaStream) => {
    console.log('[WebRTC] Starting broadcast with stream');
    localStreamRef.current = stream;
    setMessages([]);
    
    console.log('[WebRTC] Pending calls to answer:', pendingCallsRef.current.size);
    
    // Answer all pending calls with the new stream
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    
    pendingCallsRef.current.forEach((call, peerId) => {
      console.log('[WebRTC] Answering pending call from viewer:', peerId);
      
      // Create a new MediaStream with all tracks for pending calls too
      const answerStream = new MediaStream();
      videoTracks.forEach(track => {
        answerStream.addTrack(track);
        console.log('[WebRTC] Added video track to pending call answer stream');
      });
      audioTracks.forEach(track => {
        answerStream.addTrack(track);
        console.log('[WebRTC] Added audio track to pending call answer stream');
      });
      
      console.log('[WebRTC] Pending call answer stream:', {
        videoTracks: answerStream.getVideoTracks().length,
        audioTracks: answerStream.getAudioTracks().length,
      });
      
      try {
        console.log('[WebRTC] Answering pending call with stream containing all tracks');
        call.answer(answerStream);
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
      // Create a dummy stream with both video and audio tracks
      // This ensures PeerJS negotiates for both video and audio capabilities
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.fillRect(0, 0, 1, 1);
      const dummyVideoStream = canvas.captureStream(1);
      
      // Create a dummy audio track using AudioContext
      let dummyAudioStream: MediaStream;
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0; // Silent
        oscillator.connect(gainNode);
        const destination = audioContext.createMediaStreamDestination();
        gainNode.connect(destination);
        oscillator.start();
        dummyAudioStream = destination.stream;
        // Stop oscillator after a short time
        setTimeout(() => oscillator.stop(), 100);
        console.log('[WebRTC] Created dummy audio track for call initiation');
      } catch (err) {
        console.warn('[WebRTC] Could not create dummy audio track:', err);
        dummyAudioStream = new MediaStream();
      }
      
      // Combine video and audio tracks into one stream
      const dummyStream = new MediaStream();
      dummyVideoStream.getVideoTracks().forEach(track => {
        dummyStream.addTrack(track);
        track.enabled = false; // Disable to save bandwidth
      });
      dummyAudioStream.getAudioTracks().forEach(track => {
        dummyStream.addTrack(track);
        track.enabled = false; // Disable to save bandwidth
      });
      
      console.log('[WebRTC] Dummy stream for call initiation:', {
        videoTracks: dummyStream.getVideoTracks().length,
        audioTracks: dummyStream.getAudioTracks().length,
      });
      
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
      dataConnection.on('data', (data) => {
        const message = data as ChatMessage;
        // When the host broadcasts messages, we'll get our own back too.
        // We check the user ID to ensure we don't display our own message twice,
        // as it's already been added optimistically in sendMessage.
        if (message.userId !== peerIdRef.current) {
          setMessages((prev) => [...prev, message]);
        }
      });
      dataConnection.on('close', () => dataConnectionsRef.current.delete(hostPeerId));

      call.on('stream', (stream) => {
        console.log('[WebRTC] Received remote stream from host');
        
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        const allTracks = stream.getTracks();
        
        console.log('[WebRTC] Received stream details:', {
          id: stream.id,
          active: stream.active,
          videoTracks: videoTracks.length,
          audioTracks: audioTracks.length,
          totalTracks: allTracks.length,
        });
        
        // Log all tracks
        allTracks.forEach((track, index) => {
          console.log(`[WebRTC] Track ${index}:`, {
            id: track.id,
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
            label: track.label,
          });
        });
        
        // Log audio tracks specifically
        if (audioTracks.length > 0) {
          audioTracks.forEach((track, index) => {
            console.log(`[WebRTC] Audio track ${index} details:`, {
              id: track.id,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
              settings: track.getSettings(),
            });
            if (!track.enabled) {
              console.log('[WebRTC] Enabling received audio track');
              track.enabled = true;
            }
          });
        } else {
          console.error('[WebRTC] ERROR: No audio tracks in received stream!');
        }
        
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

  // Viewer functions to share their stream
  const startViewerStream = useCallback(async (stream: MediaStream) => {
    if (!peer || isHost || !peer.id) {
      console.log('[WebRTC] Cannot start viewer stream: peer not ready, is host, or no peer ID');
      return;
    }

    // Prevent multiple simultaneous calls - if call exists and is open, don't create another
    if (viewerToHostCallRef.current && viewerToHostCallRef.current.open) {
      console.log('[WebRTC] Already sharing stream with an active call, skipping duplicate');
      // Just update the local stream reference
      setViewerLocalStream(stream);
      return;
    }

    // Stop any existing local stream tracks
    if (viewerLocalStream) {
      viewerLocalStream.getTracks().forEach(track => track.stop());
    }

    // Close existing call if any
    if (viewerToHostCallRef.current) {
      console.log('[WebRTC] Closing existing viewer-to-host call');
      viewerToHostCallRef.current.close();
      viewerToHostCallRef.current = null;
      // Wait a bit for the call to close
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Ensure audio tracks are enabled
    stream.getAudioTracks().forEach(track => {
      track.enabled = true;
      console.log('[WebRTC] Audio track enabled:', { id: track.id, enabled: track.enabled, readyState: track.readyState, muted: track.muted });
    });

    // Ensure video tracks are enabled
    stream.getVideoTracks().forEach(track => {
      track.enabled = true;
      console.log('[WebRTC] Video track enabled:', { id: track.id, enabled: track.enabled, readyState: track.readyState });
    });

    console.log('[WebRTC] Viewer starting to share stream to host', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      streamId: stream.id,
    });
    
    setViewerLocalStream(stream);

    try {
      const call = peer.call(hostPeerId, stream);
      if (!call) {
        console.error('[WebRTC] Failed to create call to host for viewer stream');
        stream.getTracks().forEach(track => track.stop());
        setViewerLocalStream(null);
        return;
      }

      viewerToHostCallRef.current = call;
      console.log('[WebRTC] Viewer call to host created for stream sharing');

      call.on('close', () => {
        console.log('[WebRTC] Viewer-to-host call closed');
        if (viewerToHostCallRef.current === call) {
          viewerToHostCallRef.current = null;
        }
      });

      call.on('error', (err) => {
        console.error('[WebRTC] Viewer-to-host call error:', err);
        if (viewerToHostCallRef.current === call) {
          viewerToHostCallRef.current = null;
        }
      });
    } catch (error) {
      console.error('[WebRTC] Error creating viewer-to-host call:', error);
      stream.getTracks().forEach(track => track.stop());
      setViewerLocalStream(null);
    }
  }, [peer, isHost, hostPeerId, viewerLocalStream]);

  const stopViewerStream = useCallback(() => {
    console.log('[WebRTC] Viewer stopping stream share');
    if (viewerToHostCallRef.current) {
      viewerToHostCallRef.current.close();
      viewerToHostCallRef.current = null;
    }
    if (viewerLocalStream) {
      viewerLocalStream.getTracks().forEach(track => track.stop());
      setViewerLocalStream(null);
    }
  }, [viewerLocalStream]);

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
    // Viewer streaming
    viewerStreams: isHost ? Array.from(viewerStreams.values()) : [],
    viewerLocalStream: !isHost ? viewerLocalStream : null,
    otherViewerStreams: !isHost ? Array.from(otherViewerStreams.values()) : [],
    startViewerStream: !isHost ? startViewerStream : undefined,
    stopViewerStream: !isHost ? stopViewerStream : undefined,
  };
};