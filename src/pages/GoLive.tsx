import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Camera,
  Settings,
  Radio,
  Users,
  MessageSquare,
  StopCircle,
  Copy,
  Check,
} from 'lucide-react';
import Header from '@/components/Header';
import ChatPanel from '@/components/ChatPanel';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';
import Footer from '@/components/Footer';

// Viewer Stream Component
const ViewerStreamItem = ({ stream, username }: { stream: MediaStream; username: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-xs font-medium text-white truncate">{username}</p>
      </div>
    </div>
  );
};

const GoLive = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [sourceType, setSourceType] = useState<'camera' | 'screen'>('camera');
  const [streamDuration, setStreamDuration] = useState(0);
  const [copied, setCopied] = useState(false);

  // Generate a unique stream ID for this session
  const [streamId] = useState(() => Math.random().toString(36).substr(2, 9));

  const { isConnected, viewerCount, startBroadcast, stopBroadcast, messages, sendMessage, viewerStreams } = useWebRTC({
    streamId,
    isHost: true,
    username: 'Host',
  });

  const shareUrl = `${window.location.origin}/watch/${streamId}`;

  // Stream duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  // Update video element when mediaStream changes
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      console.log('[GoLive] Updating video element with stream');
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => {
        console.error('[GoLive] Error playing video in useEffect:', err);
      });
    }
  }, [mediaStream]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const startCamera = async () => {
    try {
      console.log('[GoLive] Requesting camera access...');
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true,
      });
      console.log('[GoLive] Camera access granted, stream obtained:', stream);
      console.log('[GoLive] Video tracks:', stream.getVideoTracks().length);
      console.log('[GoLive] Audio tracks:', stream.getAudioTracks().length);
      
      setMediaStream(stream);
      
      setSourceType('camera');
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
    } catch (error: any) {
      console.error('[GoLive] Camera error:', error);
      toast({
        title: 'Camera Error',
        description: error.message || 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const startScreenShare = async () => {
    try {
      console.log('[GoLive] Requesting screen share access...');
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true,
      });
      console.log('[GoLive] Screen share access granted, stream obtained:', stream);
      console.log('[GoLive] Video tracks:', stream.getVideoTracks().length);
      console.log('[GoLive] Audio tracks:', stream.getAudioTracks().length);
      
      setMediaStream(stream);
      setSourceType('screen');
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      
      // Handle when user stops sharing
      stream.getVideoTracks()[0].onended = () => {
        console.log('[GoLive] Screen share ended by user');
        setMediaStream(null);
        toast({
          title: 'Screen Share Ended',
          description: 'Screen sharing was stopped.',
        });
      };
    } catch (error: any) {
      console.error('[GoLive] Screen share error:', error);
      toast({
        title: 'Screen Share Error',
        description: error.message || 'Could not start screen sharing.',
        variant: 'destructive',
      });
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const goLive = () => {
    if (!title.trim()) {
      toast({
        title: 'Missing Title',
        description: 'Please enter a stream title before going live.',
        variant: 'destructive',
      });
      return;
    }
    if (!mediaStream) {
      toast({
        title: 'No Media',
        description: 'Please start your camera or screen share first.',
        variant: 'destructive',
      });
      return;
    }
    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Waiting for WebRTC connection. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    startBroadcast(mediaStream);
    setIsLive(true);
    toast({
      title: "You're Live!",
      description: 'Share the link for viewers to join.',
    });
  };

  const endStream = () => {
    stopBroadcast();
    setIsLive(false);
    setStreamDuration(0);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    toast({
      title: 'Stream Ended',
      description: 'Your stream has been ended.',
    });
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link Copied!', description: 'Share it with your viewers.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-grow container py-4 pb-24 lg:pb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="video-container relative bg-background/50 aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 w-full h-full object-contain ${
                    mediaStream ? 'block' : 'hidden'
                  }`}
                />
                {!mediaStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className="text-4xl md:text-6xl opacity-30">📷</div>
                    <p className="text-muted-foreground text-sm">
                      Select a video source to preview
                    </p>
                    <div className="flex gap-3 mt-2">
                      <Button onClick={startCamera} variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Camera
                      </Button>
                      <Button onClick={startScreenShare} variant="outline" size="sm">
                        <Monitor className="w-4 h-4 mr-2" />
                        Screen
                      </Button>
                    </div>
                  </div>
                )}

                {isLive && (
                  <>
                    <div className="absolute top-2 left-2 md:top-4 md:left-4">
                      <LiveBadge />
                    </div>
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{viewerCount}</span>
                      </div>
                      <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg font-mono text-xs md:text-sm">
                        {formatDuration(streamDuration)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="p-3 md:p-4 border-t border-border/40">
                <div className="flex flex-wrap items-center justify-center md:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isVideoEnabled ? 'glass' : 'destructive'}
                      size="lg"
                      onClick={toggleVideo}
                      disabled={!mediaStream}
                      className="h-11 w-11 md:h-10 md:w-auto md:px-4 md:py-2"
                    >
                      {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      <span className="sr-only md:not-sr-only md:ml-2">Video</span>
                    </Button>
                    <Button
                      variant={isAudioEnabled ? 'glass' : 'destructive'}
                      size="lg"
                      onClick={toggleAudio}
                      disabled={!mediaStream}
                      className="h-11 w-11 md:h-10 md:w-auto md:px-4 md:py-2"
                    >
                      {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      <span className="sr-only md:not-sr-only md:ml-2">Audio</span>
                    </Button>
                  </div>

                  {/* Main Go Live Button */}
                  <div className="hidden lg:block">
                    {!isLive ? (
                      <Button variant="hero" size="lg" onClick={goLive} disabled={!mediaStream || !isConnected}>
                        <Radio className="w-5 h-5 mr-2" />
                        Go Live
                      </Button>
                    ) : (
                      <Button variant="destructive" size="lg" onClick={endStream}>
                        <StopCircle className="w-5 h-5 mr-2" />
                        End Stream
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stream Settings / Share Link */}
            {!isLive ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 md:p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Stream Settings</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Stream Title</Label>
                    <Input
                      id="title"
                      placeholder="What are you streaming today?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell viewers what to expect..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 md:p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Copy className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Share Your Stream</h2>
                </div>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1 bg-secondary/50" />
                  <Button onClick={copyShareUrl} variant="outline" size="icon">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Share this link with viewers to let them watch your stream.
                </p>
              </motion.div>
            )}
          </div>

          {/* Chat Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-96 space-y-4"
          >
            {/* Viewer Streams */}
            {isLive && viewerStreams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4"
              >
                <h3 className="font-semibold mb-3 text-sm">Viewer Streams ({viewerStreams.length})</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {viewerStreams.map(({ stream, username }, index) => (
                    <ViewerStreamItem key={`${username}-${index}`} stream={stream} username={username} />
                  ))}
                </div>
              </motion.div>
            )}
            
            <div className="lg:h-[calc(100vh-150px)] h-[400px] min-h-[300px]">
              {isLive ? (
                <ChatPanel viewerCount={viewerCount} messages={messages} sendMessage={sendMessage} />
              ) : (
                <div className="chat-container h-full flex items-center justify-center text-center p-6">
                  <div>
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Chat Preview</h3>
                    <p className="text-sm text-muted-foreground">
                      Chat will appear here once you go live
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Sticky Go Live Button for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 border-t border-border/40 backdrop-blur-xl lg:hidden pb-safe">
        {!isLive ? (
          <Button variant="hero" size="lg" className="w-full h-12" onClick={goLive} disabled={!mediaStream || !isConnected}>
            <Radio className="w-5 h-5 mr-2" />
            Go Live
          </Button>
        ) : (
          <Button variant="destructive" size="lg" className="w-full h-12" onClick={endStream}>
            <StopCircle className="w-5 h-5 mr-2" />
            End Stream
          </Button>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default GoLive;
