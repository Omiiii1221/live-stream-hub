import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Video, Users, Clock, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'host') {
      navigate('/auth?mode=login');
    }
  }, [isAuthenticated, user, navigate]);

  const stats = [
    {
      label: 'Total Streams',
      value: '12',
      icon: Video,
      change: '+2 this month',
    },
    {
      label: 'Total Views',
      value: '8.4K',
      icon: TrendingUp,
      change: '+15% from last month',
    },
    {
      label: 'Followers',
      value: '1,247',
      icon: Users,
      change: '+89 new',
    },
    {
      label: 'Watch Time',
      value: '142h',
      icon: Clock,
      change: 'This month',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.username}</p>
          </div>
          <Button variant="hero" size="lg" onClick={() => navigate('/go-live')}>
            <Plus className="w-5 h-5 mr-2" />
            Go Live
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-primary mt-1">{stat.change}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Streams */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold mb-6">Recent Streams</h2>
          
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No streams yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start your first stream and it will appear here
            </p>
            <Button onClick={() => navigate('/go-live')}>
              Start Streaming
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
