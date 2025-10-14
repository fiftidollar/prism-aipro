import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Paperclip, Mic, Image as ImageIcon, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: string;
  content: string;
  model?: string;
}

interface AIModel {
  id: string;
  name: string;
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationUpdate?: () => void;
}

export const ChatInterface = ({ conversationId, onConversationUpdate }: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [selectedPersonality, setSelectedPersonality] = useState("professional");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const personalities = [
    { id: "professional", name: "Профессионал" },
    { id: "creative", name: "Креативный" },
    { id: "expert-copywriter", name: "Эксперт-копирайтер" },
    { id: "analyst", name: "Аналитик" },
    { id: "friendly", name: "Дружелюбный" },
  ];

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              if (prev.find(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  const loadModels = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-models');
      
      if (error) throw error;
      
      if (data?.data) {
        const modelList = data.data.map((model: any) => ({
          id: model.id,
          name: model.name || model.id,
        }));
        setModels(modelList);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setModels([
        { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'openai/gpt-5', name: 'GPT-5' },
        { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
      ]);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;

    setLoading(true);
    const userMessage = message;
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          conversationId: conversationId,
          model: selectedModel,
        },
      });

      if (error) throw error;

      onConversationUpdate?.();

      toast({
        title: "Сообщение отправлено",
        description: `Используется модель: ${selectedModel}`,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Empty state - no conversation selected
  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-semibold text-foreground">
              Hi, {user?.email?.split('@')[0]}! How can I help?
            </h2>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Hey magi, I'm..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-[120px] pr-40 resize-none bg-card border-2 border-border focus:border-primary rounded-2xl"
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button size="icon" variant="ghost" className="rounded-full">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full">
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full">
                  <Mic className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={!message.trim() || loading}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Summarize Video
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Brainstorm Ideas
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                🎉 Surprise me
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface with messages
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {personalities.map((personality) => (
                <SelectItem key={personality.id} value={personality.id}>
                  {personality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>Начните разговор с AI</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 bg-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  {msg.role === 'assistant' && msg.model && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-medium text-foreground">
                        {models.find(m => m.id === msg.model)?.name || msg.model}
                      </p>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[60px] pr-40 resize-none bg-background border-2 border-border focus:border-primary rounded-2xl"
              disabled={loading}
            />
            
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <Button size="icon" variant="ghost" className="rounded-full">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full">
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Mic className="w-5 h-5" />
              </Button>
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={!message.trim() || loading}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
