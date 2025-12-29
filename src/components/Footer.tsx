import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border/40 mt-16">
      <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <Radio className="w-6 h-6 text-primary group-hover:animate-pulse" />
          <span className="font-bold">Streamify</span>
        </Link>
        <p className="text-sm text-muted-foreground order-last sm:order-none">
          © {new Date().getFullYear()} Streamify. All Rights Reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
