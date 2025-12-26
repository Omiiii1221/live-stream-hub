import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Heart, Users, Loader2, Play } from 'lucide-react';
// COMMENTED OUT - Viewer streaming icons - Uncomment when needed
// import { Video, VideoOff, Mic, MicOff, Monitor, Camera, X, Radio, Check, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import ChatPanel from '@/components/ChatPanel';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@/components/ui/button';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useToast } from '@/hooks/use-toast';

const Watch = () => {
  const { streamId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  // COMMENTED OUT - Viewer video ref - Uncomment when needed
  // const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [hasConnected, setHasConnected] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [username] = useState(() => `Viewer${Math.floor(Math.random() * 9999)}`);
  // COMMENTED OUT - Viewer streaming state - Uncomment when needed
  // const [viewerStream, setViewerStream] = useState<MediaStream | null>(null);
  // const [isViewerVideoEnabled, setIsViewerVideoEnabled] = useState(true);
  // const [isViewerAudioEnabled, setIsViewerAudioEnabled] = useState(true);
  const { toast } = useToast();

  const { 
    isConnected, 
    remoteStream, 
    error, 
    connectToStream, 
    messages, 
    sendMessage, 
    viewerCount,
    // COMMENTED OUT - Viewer streaming - Uncomment when needed
    // viewerLocalStream,
    // otherViewerStreams,
    // startViewerStream,
    // stopViewerStream,
  } = useWebRTC({
    streamId: streamId || '',
    isHost: false,
    username,
  });

  // COMMENTED OUT - Status tracking - Uncomment when needed
  // const [hasCamera, setHasCamera] = useState(false);
  // const [hasMic, setHasMic] = useState(false);
  // const [hasScreenShare, setHasScreenShare] = useState(false);

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

  // COMMENTED OUT - Viewer stream preview and functions - Uncomment when needed
  // useEffect(() => {
  //   if (viewerLocalStream && viewerVideoRef.current) {
  //     viewerVideoRef.current.srcObject = viewerLocalStream;
  //     viewerVideoRef.current.play().catch(console.error);
  //     setViewerStream(viewerLocalStream);
  //     
  //     const hasVideo = viewerLocalStream.getVideoTracks().length > 0;
  //     const hasAudio = viewerLocalStream.getAudioTracks().length > 0;
  //     const isScreenShare = viewerLocalStream.getVideoTracks().some(track => track.label.includes('screen') || track.label.includes('Screen'));
  //     
  //     setHasCamera(hasVideo && !isScreenShare);
  //     setHasScreenShare(hasVideo && isScreenShare);
  //     setHasMic(hasAudio);
  //   } else if (!viewerLocalStream && viewerVideoRef.current) {
  //     viewerVideoRef.current.srcObject = null;
  //     setViewerStream(null);
  //     setHasCamera(false);
  //     setHasMic(false);
  //     setHasScreenShare(false);
  //   }
  // }, [viewerLocalStream]);

  // const startViewerCamera = async () => {
  //   try {
  //     if (!startViewerStream) return;
  //     
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: {
  //         width: { ideal: 1280 },
  //         height: { ideal: 720 },
  //         facingMode: 'user'
  //       },
  //       audio: true,
  //     });
  //     
  //     startViewerStream(stream);
  //     setIsViewerVideoEnabled(true);
  //     setIsViewerAudioEnabled(true);
  //     setHasCamera(true);
  //     setHasMic(true);
  //     setHasScreenShare(false);
  //     toast({
  //       title: 'Camera Started',
  //       description: 'Your camera is now visible to others.',
  //     });
  //   } catch (error: any) {
  //     console.error('[Watch] Camera error:', error);
  //     toast({
  //       title: 'Camera Error',
  //       description: error.message || 'Could not access camera.',
  //       variant: 'destructive',
  //     });
  //   }
  // };

  // const startViewerScreenShare = async () => {
  //   try {
  //     if (!startViewerStream) return;
  //     
  //     const stream = await navigator.mediaDevices.getDisplayMedia({
  //       video: {
  //         width: { ideal: 1920 },
  //         height: { ideal: 1080 }
  //       },
  //       audio: true,
  //     });
  //     
  //     startViewerStream(stream);
  //     setIsViewerVideoEnabled(true);
  //     setIsViewerAudioEnabled(true);
  //     setHasScreenShare(true);
  //     setHasCamera(false);
  //     setHasMic(stream.getAudioTracks().length > 0);
  //     
  //     stream.getVideoTracks()[0].onended = () => {
  //       if (stopViewerStream) {
  //         stopViewerStream();
  //         setHasScreenShare(false);
  //         setHasMic(false);
  //         toast({
  //           title: 'Screen Share Ended',
  //           description: 'Screen sharing was stopped.',
  //         });
  //       }
  //     };
  //     
  //     toast({
  //       title: 'Screen Share Started',
  //       description: 'Your screen is now visible to others.',
  //     });
  //   } catch (error: any) {
  //     console.error('[Watch] Screen share error:', error);
  //     toast({
  //       title: 'Screen Share Error',
  //       description: error.message || 'Could not start screen sharing.',
  //       variant: 'destructive',
  //     });
  //   }
  // };

  // const stopViewerSharing = () => {
  //   if (stopViewerStream) {
  //     stopViewerStream();
  //     setHasCamera(false);
  //     setHasMic(false);
  //     setHasScreenShare(false);
  //     toast({
  //       title: 'Sharing Stopped',
  //       description: 'You are no longer sharing your camera/screen.',
  //     });
  //   }
  // };

  // const toggleViewerVideo = () => {
  //   if (viewerStream) {
  //     const newState = !isViewerVideoEnabled;
  //     viewerStream.getVideoTracks().forEach((track) => {
  //       track.enabled = newState;
  //     });
  //     setIsViewerVideoEnabled(newState);
  //     if (viewerStream.getVideoTracks().length > 0) {
  //       const isScreenShare = viewerStream.getVideoTracks().some(track => track.label.includes('screen') || track.label.includes('Screen'));
  //       if (!isScreenShare) {
  //         setHasCamera(newState);
  //       }
  //     }
  //   }
  // };

  // const toggleViewerAudio = () => {
  //   if (viewerStream) {
  //     const newState = !isViewerAudioEnabled;
  //     viewerStream.getAudioTracks().forEach((track) => {
  //       track.enabled = newState;
  //     });
  //     setIsViewerAudioEnabled(newState);
  //     setHasMic(newState);
  //   }
  // };

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

            {/* Viewer Sharing Controls - COMMENTED OUT - Uncomment when needed */}
            {/* {remoteStream && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Share Your Stream</h2>
                
                {!viewerStream ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Want to participate? Share your camera, microphone, or screen (optional):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button 
                        onClick={startViewerCamera} 
                        variant={hasCamera ? "default" : "outline"}
                        className="flex flex-col items-center justify-center h-auto py-4 gap-2 relative"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          {hasCamera ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span>Camera</span>
                        {hasCamera && <span className="text-xs text-green-500">ON</span>}
                      </Button>
                      <Button 
                        onClick={startViewerScreenShare} 
                        variant={hasScreenShare ? "default" : "outline"}
                        className="flex flex-col items-center justify-center h-auto py-4 gap-2 relative"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="w-5 h-5" />
                          {hasScreenShare ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span>Screen Share</span>
                        {hasScreenShare && <span className="text-xs text-green-500">ON</span>}
                      </Button>
                      <Button 
                        onClick={async () => {
                          try {
                            if (!startViewerStream) return;
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            startViewerStream(stream);
                            setIsViewerAudioEnabled(true);
                            setHasMic(true);
                            setHasCamera(false);
                            setHasScreenShare(false);
                            toast({
                              title: 'Microphone Started',
                              description: 'Your microphone is now active.',
                            });
                          } catch (error: any) {
                            toast({
                              title: 'Microphone Error',
                              description: error.message || 'Could not access microphone.',
                              variant: 'destructive',
                            });
                          }
                        }}
                        variant={hasMic ? "default" : "outline"}
                        className="flex flex-col items-center justify-center h-auto py-4 gap-2 relative"
                      >
                        <div className="flex items-center gap-2">
                          <Mic className="w-5 h-5" />
                          {hasMic ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span>Microphone</span>
                        {hasMic && <span className="text-xs text-green-500">ON</span>}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      You can also just watch without sharing
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={viewerVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      {viewerStream && viewerStream.getVideoTracks().length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <Mic className="w-12 h-12 text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">Audio Only</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {hasCamera && (
                          <div className="bg-green-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            <span>Camera ON</span>
                          </div>
                        )}
                        {hasScreenShare && (
                          <div className="bg-green-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            <span>Screen ON</span>
                          </div>
                        )}
                        {hasMic && (
                          <div className="bg-green-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Mic className="w-3 h-3" />
                            <span>Mic ON</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      {viewerStream && viewerStream.getVideoTracks().length > 0 && (
                        <Button
                          variant={isViewerVideoEnabled ? 'glass' : 'destructive'}
                          size="sm"
                          onClick={toggleViewerVideo}
                          title={isViewerVideoEnabled ? 'Turn off video' : 'Turn on video'}
                        >
                          {isViewerVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </Button>
                      )}
                      {viewerStream && viewerStream.getAudioTracks().length > 0 && (
                        <Button
                          variant={isViewerAudioEnabled ? 'glass' : 'destructive'}
                          size="sm"
                          onClick={toggleViewerAudio}
                          title={isViewerAudioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
                        >
                          {isViewerAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={stopViewerSharing}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Stop Sharing
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )} */}
          </div>

          {/* Other Viewers' Streams - COMMENTED OUT - Uncomment when needed */}
          {/* {otherViewerStreams && otherViewerStreams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 mb-4"
            >
              <h3 className="font-semibold mb-3 text-sm">Other Viewers ({otherViewerStreams.length})</h3>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {otherViewerStreams.map(({ stream, username }, index) => (
                  <OtherViewerStreamItem key={`${username}-${index}`} stream={stream} username={username} />
                ))}
              </div>
            </motion.div>
          )} */}

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

// COMMENTED OUT - Other Viewer Stream Component - Uncomment when needed
// const OtherViewerStreamItem = ({ stream, username }: { stream: MediaStream; username: string }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     if (videoRef.current && stream) {
//       videoRef.current.srcObject = stream;
//       videoRef.current.play().catch(console.error);
//     }
//   }, [stream]);

//   return (
//     <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         className="w-full h-full object-cover"
//       />
//       {stream.getVideoTracks().length === 0 && (
//         <div className="absolute inset-0 flex items-center justify-center bg-background/50">
//           <Mic className="w-8 h-8 text-muted-foreground" />
//         </div>
//       )}
//       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
//         <p className="text-xs font-medium text-white truncate">{username}</p>
//       </div>
//     </div>
//   );
// };

export default Watch;
