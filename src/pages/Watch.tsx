import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Heart, Users, Loader2, Play, Video, VideoOff, Mic, MicOff, Monitor, Camera, X, Radio } from 'lucide-react';
import Header from '@/components/Header';
import ChatPanel from '@/components/ChatPanel';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@/components/ui/button';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useToast } from '@/hooks/use-toast';

const Watch = () => {
  const { streamId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [hasConnected, setHasConnected] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [username] = useState(() => `Viewer${Math.floor(Math.random() * 9999)}`);
  const [viewerStream, setViewerStream] = useState<MediaStream | null>(null);
  const [isViewerVideoEnabled, setIsViewerVideoEnabled] = useState(true);
  const [isViewerAudioEnabled, setIsViewerAudioEnabled] = useState(true);
  const [hasStartedStream, setHasStartedStream] = useState(false);
  const { toast } = useToast();

  const { 
    isConnected, 
    remoteStream, 
    error, 
    connectToStream, 
    messages, 
    sendMessage, 
    viewerCount,
    viewerLocalStream,
    startViewerStream,
    stopViewerStream,
  } = useWebRTC({
    streamId: streamId || '',
    isHost: false,
    username,
  });

  // Connect to stream when peer is ready
  useEffect(() => {
    if (isConnected && !hasConnected) {
      console.log('[Watch] Peer connected, connecting to stream...');
      connectToStream();
      setHasConnected(true);
    }
  }, [isConnected, hasConnected, connectToStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteStream && videoRef.current) {
      console.log('[Watch] Attaching remote stream to video element');
      console.log('[Watch] Stream details:', {
        id: remoteStream.id,
        active: remoteStream.active,
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length,
      });
      
      // Check video tracks
      const videoTracks = remoteStream.getVideoTracks();
      if (videoTracks.length === 0) {
        console.error('[Watch] No video tracks in stream!');
        return;
      }
      
      console.log('[Watch] Video track details:', {
        enabled: videoTracks[0].enabled,
        readyState: videoTracks[0].readyState,
        settings: videoTracks[0].getSettings(),
      });
      
      // Check audio tracks
      const audioTracks = remoteStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('[Watch] Audio track details:', {
          enabled: audioTracks[0].enabled,
          readyState: audioTracks[0].readyState,
          muted: audioTracks[0].muted,
          settings: audioTracks[0].getSettings(),
        });
        // Ensure audio track is enabled
        if (!audioTracks[0].enabled) {
          console.log('[Watch] Enabling audio track');
          audioTracks[0].enabled = true;
        }
      } else {
        console.warn('[Watch] No audio tracks in stream!');
      }
      
      videoRef.current.srcObject = remoteStream;
      
      // Ensure video is not muted to hear audio
      videoRef.current.muted = false;
      
      // Explicitly play the video
      videoRef.current.play()
        .then(() => {
          console.log('[Watch] Video playback started successfully');
          setNeedsUserInteraction(false);
        })
        .catch((err) => {
          console.error('[Watch] Error playing video:', err);
          // If autoplay is blocked, show play button
          if (err.name === 'NotAllowedError') {
            console.log('[Watch] Autoplay blocked, user interaction required');
            setNeedsUserInteraction(true);
          } else {
            // Try to play with user interaction
            videoRef.current?.play().catch((err2) => {
              console.error('[Watch] Failed to play video even after retry:', err2);
              if (err2.name === 'NotAllowedError') {
                setNeedsUserInteraction(true);
              }
            });
          }
        });
      
      // Log when video starts playing
      videoRef.current.onloadedmetadata = () => {
        console.log('[Watch] Video metadata loaded');
        console.log('[Watch] Video dimensions:', {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
        });
      };
      
      videoRef.current.onplay = () => {
        console.log('[Watch] Video started playing');
      };
      
      videoRef.current.onerror = (err) => {
        console.error('[Watch] Video element error:', err);
      };
    }
  }, [remoteStream]);

  // Handle viewer's own stream preview
  useEffect(() => {
    if (viewerLocalStream && viewerVideoRef.current) {
      viewerVideoRef.current.srcObject = viewerLocalStream;
      viewerVideoRef.current.play().catch(console.error);
      setViewerStream(viewerLocalStream);
    } else if (!viewerLocalStream && viewerVideoRef.current) {
      viewerVideoRef.current.srcObject = null;
      setViewerStream(null);
    }
  }, [viewerLocalStream]);

  const startViewerCamera = async () => {
    try {
      if (!startViewerStream) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true,
      });
      
      startViewerStream(stream);
      setIsViewerVideoEnabled(true);
      setIsViewerAudioEnabled(true);
      toast({
        title: 'Camera Started',
        description: 'Your camera is now visible to the host.',
      });
    } catch (error: any) {
      console.error('[Watch] Camera error:', error);
      toast({
        title: 'Camera Error',
        description: error.message || 'Could not access camera.',
        variant: 'destructive',
      });
    }
  };

  const startViewerScreenShare = async () => {
    try {
      if (!startViewerStream) return;
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true,
      });
      
      startViewerStream(stream);
      setIsViewerVideoEnabled(true);
      setIsViewerAudioEnabled(true);
      
      stream.getVideoTracks()[0].onended = () => {
        if (stopViewerStream) {
          stopViewerStream();
          toast({
            title: 'Screen Share Ended',
            description: 'Screen sharing was stopped.',
          });
        }
      };
      
      toast({
        title: 'Screen Share Started',
        description: 'Your screen is now visible to the host.',
      });
    } catch (error: any) {
      console.error('[Watch] Screen share error:', error);
      toast({
        title: 'Screen Share Error',
        description: error.message || 'Could not start screen sharing.',
        variant: 'destructive',
      });
    }
  };

  const stopViewerSharing = () => {
    if (stopViewerStream) {
      stopViewerStream();
      toast({
        title: 'Sharing Stopped',
        description: 'You are no longer sharing your camera/screen.',
      });
    }
  };

  const toggleViewerVideo = () => {
    if (viewerStream) {
      viewerStream.getVideoTracks().forEach((track) => {
        track.enabled = !isViewerVideoEnabled;
      });
      setIsViewerVideoEnabled(!isViewerVideoEnabled);
    }
  };

  const toggleViewerAudio = () => {
    if (viewerStream) {
      viewerStream.getAudioTracks().forEach((track) => {
        track.enabled = !isViewerAudioEnabled;
      });
      setIsViewerAudioEnabled(!isViewerAudioEnabled);
    }
  };

  if (!streamId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid stream link</h1>
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="video-container mb-4 relative"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`absolute inset-0 w-full h-full object-cover bg-black ${remoteStream ? 'block' : 'hidden'}`}
              />
              {!remoteStream && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center">
                  <div className="text-center">
                    {error ? (
                      <>
                        <div className="text-6xl mb-4">📺</div>
                        <p className="text-destructive font-medium mb-2">{error}</p>
                        <p className="text-sm text-muted-foreground">
                          The host may not be live yet. Try refreshing.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => window.location.reload()}
                        >
                          Refresh
                        </Button>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Connecting to stream...</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                          Waiting for the host to go live
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {remoteStream && (
                <>
                  <div className="absolute top-4 left-4">
                    <LiveBadge size="lg" />
                  </div>
                  {needsUserInteraction && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <Button
                        size="lg"
                        onClick={() => {
                          videoRef.current?.play()
                            .then(() => {
                              console.log('[Watch] Video playback started after user interaction');
                              setNeedsUserInteraction(false);
                            })
                            .catch((err) => {
                              console.error('[Watch] Error playing video after click:', err);
                            });
                        }}
                        className="flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Play Stream
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Stream Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  {/* Host Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                    H
                  </div>

                  <div>
                    <h1 className="text-xl font-bold mb-1">
                      {remoteStream ? 'Live Stream' : 'Waiting for stream...'}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Host</span>
                      <span>•</span>
                      <span>Stream ID: {streamId}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">{viewerCount}</span>
                      </div>
                  <Button variant="glass" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="glass"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Viewer Sharing Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              {!hasStartedStream ? (
                <div className="text-center space-y-4">
                  <h2 className="text-lg font-semibold">Join the Stream</h2>
                  <p className="text-sm text-muted-foreground">
                    Click below to start streaming. You can optionally share your camera, microphone, or screen.
                  </p>
                  <Button 
                    onClick={() => setHasStartedStream(true)} 
                    variant="hero" 
                    size="lg"
                    className="w-full"
                  >
                    <Radio className="w-5 h-5 mr-2" />
                    Start Stream
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Your Stream</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        stopViewerSharing();
                        setHasStartedStream(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {!viewerStream ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose how you want to participate (optional):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button onClick={startViewerCamera} variant="outline" className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          Camera
                        </Button>
                        <Button onClick={startViewerScreenShare} variant="outline" className="flex-1">
                          <Monitor className="w-4 h-4 mr-2" />
                          Screen Share
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        You can also just watch without sharing
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview */}
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={viewerVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant={isViewerVideoEnabled ? 'glass' : 'destructive'}
                          size="sm"
                          onClick={toggleViewerVideo}
                          title={isViewerVideoEnabled ? 'Turn off video' : 'Turn on video'}
                        >
                          {isViewerVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant={isViewerAudioEnabled ? 'glass' : 'destructive'}
                          size="sm"
                          onClick={toggleViewerAudio}
                          title={isViewerAudioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
                        >
                          {isViewerAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={stopViewerSharing}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Chat Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-96 lg:h-[calc(100vh-200px)] h-[500px]"
          >
            <ChatPanel viewerCount={viewerCount} messages={messages} sendMessage={sendMessage} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
