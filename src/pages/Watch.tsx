import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Heart, Users, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ChatPanel from '@/components/ChatPanel';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@/components/ui/button';
import { useWebRTC } from '@/hooks/useWebRTC';

const Watch = () => {
  const { streamId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasConnected, setHasConnected] = useState(false);

  const { isConnected, remoteStream, error, connectToStream } = useWebRTC({
    streamId: streamId || '',
    isHost: false,
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
        })
        .catch((err) => {
          console.error('[Watch] Error playing video:', err);
          // Try to play with user interaction
          videoRef.current?.play().catch((err2) => {
            console.error('[Watch] Failed to play video even after retry:', err2);
          });
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
                <div className="absolute top-4 left-4">
                  <LiveBadge size="lg" />
                </div>
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
          </div>

          {/* Chat Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-96 h-[600px]"
          >
            <ChatPanel streamId={streamId} viewerCount={0} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
