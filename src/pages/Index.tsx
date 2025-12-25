import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import StreamCard from '@/components/StreamCard';
import { mockStreams } from '@/data/mockStreams';

const Index = () => {
  const liveStreams = mockStreams.filter((s) => s.status === 'live');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-purple-600/20 border border-white/10 p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="live-badge">
                  {liveStreams.length} LIVE NOW
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-5xl font-bold mb-4"
              >
                Watch <span className="gradient-text">Live Streams</span>
                <br />& Connect in Real-Time
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground max-w-lg"
              >
                Join thousands of viewers watching live content from creators around the world.
                Start streaming or watch your favorite hosts.
              </motion.p>
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -top-20 -right-20 w-64 h-64 bg-primary/30 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>
        </motion.section>

        {/* Live Streams Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <Flame className="w-6 h-6 text-primary" />
              <h2>Live Now</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {liveStreams.map((stream, index) => (
              <StreamCard key={stream.id} stream={stream} index={index} />
            ))}
          </div>

          {liveStreams.length === 0 && (
            <div className="text-center py-16">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No live streams right now</h3>
              <p className="text-muted-foreground">Check back later or start your own stream!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
