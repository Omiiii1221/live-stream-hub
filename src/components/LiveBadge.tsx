import { motion } from 'framer-motion';

interface LiveBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

const LiveBadge: React.FC<LiveBadgeProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`live-badge ${sizeClasses[size]}`}
    >
      LIVE
    </motion.div>
  );
};

export default LiveBadge;
