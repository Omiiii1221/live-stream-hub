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

  const { isConnected, viewerCount, startBroadcast, stopBroadcast } = useWebRTC({
    streamId,
    isHost: true,
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
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="video-container relative bg-background">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover ${mediaStream ? 'block' : 'hidden'}`}
                />
                {!mediaStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="text-6xl opacity-30">📷</div>
                    <p className="text-muted-foreground">Select a video source to preview</p>
                    <div className="flex gap-3">
                      <Button onClick={startCamera} variant="outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Camera
                      </Button>
                      <Button onClick={startScreenShare} variant="outline">
                        <Monitor className="w-4 h-4 mr-2" />
                        Screen
                      </Button>
                    </div>
                  </div>
                )}

                {isLive && (
                  <>
                    <div className="absolute top-4 left-4">
                      <LiveBadge size="lg" />
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">{viewerCount}</span>
                      </div>
                      <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono text-sm">
                        {formatDuration(streamDuration)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isVideoEnabled ? 'glass' : 'destructive'}
                      size="icon"
                      onClick={toggleVideo}
                      disabled={!mediaStream}
                    >
                      {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant={isAudioEnabled ? 'glass' : 'destructive'}
                      size="icon"
                      onClick={toggleAudio}
                      disabled={!mediaStream}
                    >
                      {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <Button
                      variant={sourceType === 'camera' ? 'default' : 'glass'}
                      size="sm"
                      onClick={startCamera}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Camera
                    </Button>
                    <Button
                      variant={sourceType === 'screen' ? 'default' : 'glass'}
                      size="sm"
                      onClick={startScreenShare}
                    >
                      <Monitor className="w-4 h-4 mr-1" />
                      Screen
                    </Button>
                  </div>

                  {!isLive ? (
                    <Button variant="hero" size="lg" onClick={goLive}>
                      <Radio className="w-4 h-4 mr-2" />
                      Go Live
                    </Button>
                  ) : (
                    <Button variant="destructive" size="lg" onClick={endStream}>
                      <StopCircle className="w-4 h-4 mr-2" />
                      End Stream
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stream Settings / Share Link */}
            {!isLive ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-2 mb-6">
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
                className="glass-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Copy className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Share Your Stream</h2>
                </div>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button onClick={copyShareUrl} variant="outline">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
            className="lg:w-96 h-[600px]"
          >
            {isLive ? (
              <ChatPanel streamId={streamId} viewerCount={viewerCount} />
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GoLive;
