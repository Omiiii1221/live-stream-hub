import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Heart, Settings, Users } from 'lucide-react';
import Header from '@/components/Header';
import ChatPanel from '@/components/ChatPanel';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@/components/ui/button';
import { mockStreams } from '@/data/mockStreams';
import { formatDistanceToNow } from 'date-fns';

const Watch = () => {
  const { streamId } = useParams();
  const stream = mockStreams.find((s) => s.id === streamId);

  if (!stream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Stream not found</h1>
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
              className="video-container mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4 opacity-50">📺</div>
                  <p className="text-muted-foreground">Live stream preview</p>
                  <p className="text-sm text-muted-foreground/60">
                    WebRTC stream would appear here
                  </p>
                </div>
              </div>

              {/* Live indicator */}
              <div className="absolute top-4 left-4">
                <LiveBadge size="lg" />
              </div>

              {/* Viewer count */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">{stream.viewerCount.toLocaleString()}</span>
                </div>
              </div>
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
                    {stream.hostName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h1 className="text-xl font-bold mb-1">{stream.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{stream.hostName}</span>
                      <span>•</span>
                      <span>
                        Started {stream.startedAt ? formatDistanceToNow(stream.startedAt) : 'just now'} ago
                      </span>
                    </div>
                    {stream.description && (
                      <p className="mt-3 text-muted-foreground">{stream.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="glass" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="glass" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="glass" size="icon">
                    <Settings className="w-4 h-4" />
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
            <ChatPanel streamId={stream.id} viewerCount={stream.viewerCount} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
