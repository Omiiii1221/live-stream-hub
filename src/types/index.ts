export type UserRole = 'host' | 'viewer';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Stream {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  status: 'scheduled' | 'live' | 'ended';
  thumbnailUrl?: string;
  viewerCount: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, role: UserRole) => Promise<void>;
  logout: () => void;
}
