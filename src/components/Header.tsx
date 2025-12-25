import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, User, LogOut, Video, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
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
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search streams..."
              className="pl-10 bg-secondary/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {user?.role === 'host' && (
                <Button variant="hero" size="sm" asChild>
                  <Link to="/go-live">
                    <Video className="w-4 h-4" />
                    Go Live
                  </Link>
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="glass" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-primary mt-1 capitalize">{user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {user?.role === 'host' && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <Video className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth?mode=login">Log in</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/auth?mode=register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
