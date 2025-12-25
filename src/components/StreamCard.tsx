import { motion } from 'framer-motion';
import { Users, Clock } from 'lucide-react';
import { Stream } from '@/types';
import LiveBadge from './LiveBadge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface StreamCardProps {
  stream: Stream;
  index: number;
}

const StreamCard: React.FC<StreamCardProps> = ({ stream, index }) => {
  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link to={`/watch/${stream.id}`} className="block group">
        <div className="glass-card overflow-hidden shadow-card hover:shadow-glow transition-all duration-300">
          {/* Thumbnail */}
          <div className="video-container relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
              <div className="text-6xl opacity-50">📺</div>
            </div>
            
            {/* Overlays */}
            <div className="absolute top-3 left-3">
              <LiveBadge />
            </div>
            
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs">
                <Users className="w-3 h-3 text-primary" />
                <span className="font-medium">{formatViewerCount(stream.viewerCount)}</span>
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                {stream.hostName.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {stream.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{stream.hostName}</p>
                {stream.startedAt && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Started {formatDistanceToNow(stream.startedAt)} ago</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default StreamCard;
