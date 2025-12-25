import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Video, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const Header: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className={`flex items-center gap-2 group ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
          <div className="relative">
            <Radio className="w-8 h-8 text-primary" />
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <span className="text-xl font-bold gradient-text">Streamify</span>
        </Link>

        {/* Search */}
        <div className={`flex-1 mx-auto ${isSearchOpen ? 'block' : 'hidden'} md:block`}>
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search streams..."
              className="pl-10 bg-secondary/30 w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>
          <div className={`${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
            <Button variant="hero" size="sm" asChild>
              <Link to="/go-live">
                <Video className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Go Live</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

