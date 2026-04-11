import { memo } from 'react';
import { Bot, Send } from 'lucide-react';
import type { Variants } from 'motion/react';
import { PlannerAssistantMarkdown } from '@/app/components/planner/PlannerAssistantMarkdown';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { motion } from 'motion/react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type DashboardClientChatPanelProps = {
  itemVariants: Variants;
  chatMessages: ChatMessage[];
  chatMessage: string;
  onChatMessageChange: (value: string) => void;
  onSend: () => void;
  chatSending: boolean;
};

export const DashboardClientChatPanel = memo(function DashboardClientChatPanel({
  itemVariants,
  chatMessages,
  chatMessage,
  onChatMessageChange,
  onSend,
  chatSending,
}: DashboardClientChatPanelProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      className="bg-card border border-border rounded-lg flex flex-col h-[500px]"
    >
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Project AI Assistant</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {chatMessages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'assistant' && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`p-3 rounded-xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}
            >
              {m.role === 'user' ? (
                m.content
              ) : (
                <PlannerAssistantMarkdown content={m.content} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border">
        <div className="relative">
          <Input
            placeholder="Ask about the project..."
            value={chatMessage}
            onChange={(e) => onChatMessageChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
            className="pr-10 bg-input-background"
            disabled={chatSending}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={onSend}
            disabled={chatSending || !chatMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});
