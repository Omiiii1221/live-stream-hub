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
} from 'lucide-react';
import Header from '@/components/Header';
import ChatPanel from '@/components/ChatPanel';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
  const [viewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setSourceType('camera');
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setSourceType('screen');
    } catch (error) {
      toast({
        title: 'Screen Share Error',
        description: 'Could not start screen sharing.',
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
    setIsLive(true);
    toast({
      title: "You're Live!",
      description: 'Your stream has started.',
    });
  };

  const endStream = () => {
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
                {mediaStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
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

            {/* Stream Settings */}
            {!isLive && (
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
              <ChatPanel streamId="host-preview" viewerCount={viewerCount} />
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
