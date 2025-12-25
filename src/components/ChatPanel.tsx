import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { mockChatMessages } from '@/data/mockStreams';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatPanelProps {
  streamId: string;
  viewerCount: number;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ streamId, viewerCount }) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      streamId,
      userId: user.id,
      username: user.username,
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="chat-container h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold">Live Chat</h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{viewerCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="group"
            >
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/60 to-orange-400/60 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {msg.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm text-primary">{msg.username}</span>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatDistanceToNow(msg.timestamp)} ago
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 break-words">{msg.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        {isAuthenticated ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <a href="/auth?mode=login" className="text-primary hover:underline">
              Log in
            </a>{' '}
            to chat
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
