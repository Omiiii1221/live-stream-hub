import { Stream, ChatMessage } from '@/types';

export const mockStreams: Stream[] = [
  {
    id: '1',
    title: 'Building a Real-time App with WebRTC',
    description: 'Learn how to build real-time applications using WebRTC and Socket.IO',
    hostId: 'host1',
    hostName: 'TechStreamDev',
    status: 'live',
    viewerCount: 1247,
    startedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Late Night Coding Session - React + TypeScript',
    description: 'Chill coding vibes with React and TypeScript projects',
    hostId: 'host2',
    hostName: 'CodeNinja',
    status: 'live',
    viewerCount: 892,
    startedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Game Dev Stream - Unity Tutorial',
    description: 'Creating a 2D platformer from scratch',
    hostId: 'host3',
    hostName: 'GameDevPro',
    status: 'live',
    viewerCount: 3451,
    startedAt: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Music Production Live',
    description: 'Making beats and mixing tracks live',
    hostId: 'host4',
    hostName: 'BeatMaster',
    status: 'live',
    viewerCount: 567,
    startedAt: new Date(Date.now() - 1000 * 60 * 15),
    createdAt: new Date(),
  },
];
