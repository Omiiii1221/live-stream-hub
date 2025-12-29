import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Radio, Video, Share2, Settings } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const howToSteps = [
    {
      icon: <Settings className="w-8 h-8 text-primary" />,
      title: '1. Set Up Your Stream',
      description: "Navigate to the 'Go Live' page and give your stream a title. This is what viewers will see.",
    },
    {
      icon: <Video className="w-8 h-8 text-primary" />,
      title: '2. Choose Your Source',
      description: 'Select your camera or share your entire screen. Grant the required permissions to get your preview ready.',
    },
    {
      icon: <Share2 className="w-8 h-8 text-primary" />,
      title: '3. Go Live & Share',
      description: 'Once you start the broadcast, copy the unique stream link and share it with your audience to let them join!',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-grow container py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 md:mb-24"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-purple-600/10 border border-white/10 p-8 md:p-16 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
            
            <div className="relative z-10 flex flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold mb-4"
              >
                Create & Share <span className="gradient-text">Live Video</span>
                <br /> Instantly with Anyone.
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
              >
                A simple, powerful platform for real-time video streaming with integrated chat. Go live from your browser, no software required.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button size="lg" variant="hero" asChild>
                  <Link to="/go-live">
                    <Radio className="w-5 h-5 mr-2" />
                    Start Your Stream Now
                  </Link>
                </Button>
              </motion.div>
            </div>

            <motion.div
              className="absolute -top-20 -right-20 w-64 h-64 bg-primary/30 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
          </div>
        </motion.section>

        {/* How to Stream Section */}
        <section className="mb-16 md:mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            How to Stream in 3 Easy Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {howToSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="glass-card text-center h-full">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      {step.icon}
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;