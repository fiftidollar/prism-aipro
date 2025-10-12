import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, LogOut, Plus, MessageSquare, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: string;
  content: string;
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface AIModel {
  id: string;
  name: string;
}

const Chat = () => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-3.5-turbo");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadModels();
    }
  }, [user]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${currentConversation}`,
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
  }, [currentConversation]);

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
      // Use fallback models
      setModels([
        { id: 'openai/gpt-4', name: 'GPT-4' },
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
        { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
        { id: 'google/gemini-pro', name: 'Gemini Pro' },
        { id: 'perplexity/pplx-70b-online', name: 'Perplexity' },
      ]);
    }
  };

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) {
      setConversations(data);
      if (!currentConversation && data.length > 0) {
        setCurrentConversation(data[0].id);
      }
    }
  };

  const loadMessages = async () => {
    if (!currentConversation) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', currentConversation)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('conversations')
      .insert({ 
        title: 'Новый чат',
        user_id: user.id 
      })
      .select()
      .single();
    
    if (data) {
      setConversations([data, ...conversations]);
      setCurrentConversation(data.id);
      setMessages([]);
    }
  };

  const deleteConversation = async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id);
    setConversations(conversations.filter(c => c.id !== id));
    if (currentConversation === id) {
      setCurrentConversation(conversations[0]?.id || null);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !currentConversation) return;

    setLoading(true);
    const userMessage = message;
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          conversationId: currentConversation,
          model: selectedModel,
        },
      });

      if (error) throw error;

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Sparkles className="w-16 h-16 text-primary animate-glow-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex">
      {/* Sidebar */}
      <div className="w-64 glass-card border-r border-border p-4 flex flex-col">
        <div className="mb-4">
          <Button
            onClick={createNewConversation}
            className="w-full gradient-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Новый чат
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversation === conv.id
                    ? "bg-primary/20"
                    : "hover:bg-primary/10"
                }`}
                onClick={() => setCurrentConversation(conv.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm">{conv.title}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="mt-4 w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 glass-card border-b border-border">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent gradient-primary">
              AI Chat Hub
            </h1>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <Sparkles className="w-16 h-16 mx-auto text-primary animate-glow-pulse" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Начните разговор с AI
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Выберите модель и задайте любой вопрос. Вы можете переключаться между моделями в процессе общения.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-lg ${
                      msg.role === "user"
                        ? "gradient-primary text-white"
                        : "glass-card"
                    }`}
                  >
                    <p className="text-sm mb-1 opacity-70">
                      {msg.role === "user" ? "Вы" : msg.model || "AI"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 glass-card border-t border-border">
          <div className="container mx-auto max-w-4xl flex gap-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите ваше сообщение..."
              className="resize-none bg-background/50"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading || !currentConversation}
            />
            <Button
              onClick={handleSend}
              size="lg"
              className="gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading || !currentConversation}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
