import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, Image as ImageIcon, FileText, Users, Briefcase, Users2, Gift, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatsList } from "@/components/ChatsList";
import { ChatInterface } from "@/components/ChatInterface";
import { PersonasList } from "@/components/PersonasList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [selectedPersonaForNewChat, setSelectedPersonaForNewChat] = useState<string>("");
  const [selectedModelForNewChat, setSelectedModelForNewChat] = useState("google/gemini-2.5-flash");
  const [creatingChat, setCreatingChat] = useState(false);
  const activeChatId = searchParams.get('chat');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadPersonas();
    }
  }, [user]);

  const loadPersonas = async () => {
    const { data } = await supabase
      .from('personas')
      .select('*')
      .order('name');
    
    if (data) {
      setPersonas(data);
    }
  };

  useEffect(() => {
    if (activeChatId) {
      setActiveSection("chats");
    }
  }, [activeChatId]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (data) {
      setConversations(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Briefcase },
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "images", label: "Images", icon: ImageIcon },
    { id: "prompts", label: "Prompts", icon: FileText },
    { id: "personas", label: "Personas", icon: Users },
    { id: "workspaces", label: "Workspaces", icon: Briefcase },
    { id: "team", label: "Team", icon: Users2 },
    { id: "rewards", label: "Rewards", icon: Gift },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Sparkles className="w-16 h-16 text-primary animate-glow-pulse" />
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen gradient-hero flex">
      {/* Sidebar */}
      <div className="w-64 glass-card border-r border-border/50 flex flex-col shadow-lg">
        <div className="p-6 border-b border-border/50">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-xl gradient-primary">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="bg-clip-text text-transparent gradient-primary">AI Hub</span>
          </h1>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === "chats") {
                    setSearchParams({});
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.id
                    ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-secondary/50 hover:to-secondary/30 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border/50">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-primary/30 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeChatId ? (
          <ChatInterface 
            conversationId={activeChatId} 
            onConversationUpdate={loadConversations}
          />
        ) : activeSection === "chats" ? (
          <ChatsList />
        ) : activeSection === "personas" ? (
          <PersonasList />
        ) : (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-clip-text text-transparent gradient-primary mb-2">Dashboard</h2>
              <p className="text-muted-foreground">Начните создавать с помощью AI</p>
            </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card 
              className="glass-card border-2 border-primary/30 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group overflow-hidden relative"
              onClick={() => setIsNewChatDialogOpen(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl gradient-primary text-white group-hover:scale-110 transition-transform shadow-md">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-primary">Начать новый чат</CardTitle>
                    <CardDescription>
                      Получайте ответы с помощью мощных AI моделей
                    </CardDescription>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    <span className="text-2xl">+</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="glass-card border-2 border-accent/30 hover:border-accent/50 hover:shadow-lg transition-all cursor-pointer group overflow-hidden relative"
              onClick={() => setActiveSection("images")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary text-white group-hover:scale-110 transition-transform shadow-md">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl" style={{ color: 'hsl(280 70% 55%)' }}>Создать изображение</CardTitle>
                    <CardDescription>
                      Создайте что-то визуально потрясающее!
                    </CardDescription>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(280 70% 55%)' }}>
                    <span className="text-2xl">+</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Chats */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">Недавние чаты</h3>
              <div className="space-y-3">
                {conversations.length === 0 ? (
                  <Card className="glass-card border-primary/20">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary/30" />
                      <p>Нет чатов. Начните новый разговор!</p>
                    </CardContent>
                  </Card>
                ) : (
                  conversations.map((conv) => (
                    <Card 
                      key={conv.id}
                      className="glass-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer border border-border/50 group"
                      onClick={() => {
                        setActiveSection("chats");
                        setSearchParams({ chat: conv.id });
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="w-10 h-10 gradient-primary">
                          <AvatarFallback className="gradient-primary text-white">
                            <Sparkles className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">{conv.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(conv.updated_at)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Announcements */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">Объявления</h3>
              <div className="space-y-4">
                <Card className="glass-card bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30 hover:border-primary/40 transition-all overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl gradient-primary text-white shadow-md">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2 text-primary">AI Academy</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Непрерывный центр обучения с еженедельными живыми тренингами и библиотекой записанных видео
                        </p>
                        <Button size="sm" className="gradient-primary text-white hover:opacity-90 transition-opacity shadow-sm">
                          Присоединиться
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-accent/10 to-primary/5 border-accent/30 hover:border-accent/40 transition-all overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary text-white shadow-md">
                        <Users2 className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2" style={{ color: 'hsl(280 70% 55%)' }}>Присоединяйтесь к сообществу!</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Приватная группа, где пользователи делятся своими творениями, советами и получают помощь
                        </p>
                        <Button size="sm" className="bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 transition-opacity shadow-sm">
                          Вступить в группу
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый чат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Модель</Label>
              <Select value={selectedModelForNewChat} onValueChange={setSelectedModelForNewChat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                  <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Персона</Label>
              <Select value={selectedPersonaForNewChat} onValueChange={(v) => setSelectedPersonaForNewChat(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите персону (опционально)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без персоны</SelectItem>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={async () => {
                if (!user) {
                  toast({ title: 'Требуется вход', description: 'Пожалуйста, войдите в аккаунт', variant: 'destructive' });
                  return;
                }
                try {
                  setCreatingChat(true);
                  const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert({
                      title: 'Новый чат',
                      user_id: user.id,
                      model: selectedModelForNewChat
                    })
                    .select()
                    .maybeSingle();

                  if (error || !newConv) {
                    toast({ title: 'Ошибка', description: 'Не удалось создать чат', variant: 'destructive' });
                    return;
                  }

                  setSearchParams({ 
                    chat: newConv.id,
                    ...(selectedPersonaForNewChat && { persona: selectedPersonaForNewChat })
                  });
                  setActiveSection('chats');
                  loadConversations();
                  setIsNewChatDialogOpen(false);
                  setSelectedPersonaForNewChat('');
                  setSelectedModelForNewChat('google/gemini-2.5-flash');
                  toast({ title: 'Новый чат создан' });
                } catch (e) {
                  toast({ title: 'Ошибка', description: 'Не удалось создать чат', variant: 'destructive' });
                } finally {
                  setCreatingChat(false);
                }
              }}
              disabled={creatingChat}
              className="w-full"
            >
              {creatingChat ? 'Создание...' : 'Создать чат'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;