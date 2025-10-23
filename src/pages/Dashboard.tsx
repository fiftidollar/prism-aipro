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
    <div className="min-h-screen gradient-hero gradient-mesh flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Sidebar */}
      <div className="w-72 glass-sidebar flex flex-col relative z-10">
        <div className="p-6 border-b border-border/30">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-2xl gradient-primary shadow-lg animate-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-br from-primary via-primary-light to-accent bg-clip-text text-transparent font-extrabold tracking-tight">
              AI Hub
            </span>
          </h1>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === "chats") {
                    setSearchParams({});
                  }
                }}
                className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  activeSection === item.id
                    ? "gradient-primary text-white shadow-lg scale-[1.02]"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-secondary hover:to-secondary/50 hover:text-foreground hover:scale-[1.01]"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${
                  activeSection === item.id ? "scale-110" : "group-hover:scale-110"
                }`} />
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border/30">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative z-10">
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
          <div className="p-10 max-w-7xl mx-auto">
            <div className="mb-10">
              <h2 className="text-5xl font-black bg-gradient-to-br from-primary via-primary-light to-accent bg-clip-text text-transparent mb-3 tracking-tight">
                Dashboard
              </h2>
              <p className="text-lg text-muted-foreground font-medium">Начните создавать с помощью AI</p>
            </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <Card 
              className="glass-card border-2 border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-500 cursor-pointer group overflow-hidden relative"
              onClick={() => setIsNewChatDialogOpen(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="relative p-8">
                <div className="flex items-center gap-6">
                  <div className="p-4 rounded-3xl gradient-primary text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 animate-glow">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-br from-primary to-primary-dark bg-clip-text text-transparent mb-2">
                      Начать новый чат
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-muted-foreground">
                      Получайте ответы с помощью мощных AI моделей
                    </CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                    <span className="text-3xl font-bold text-primary">+</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="glass-card border-2 border-accent/20 hover:border-accent/40 hover:shadow-xl transition-all duration-500 cursor-pointer group overflow-hidden relative"
              onClick={() => setActiveSection("images")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="relative p-8">
                <div className="flex items-center gap-6">
                  <div className="p-4 rounded-3xl gradient-secondary text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent mb-2">
                      Создать изображение
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-muted-foreground">
                      Создайте что-то визуально потрясающее!
                    </CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                    <span className="text-3xl font-bold text-accent">+</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Chats */}
            <div>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Недавние чаты
              </h3>
              <div className="space-y-4">
                {conversations.length === 0 ? (
                  <Card className="glass-card border-2 border-primary/20">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 rounded-full gradient-primary/10 flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-primary animate-glow" />
                      </div>
                      <p className="text-lg font-semibold text-muted-foreground">
                        Нет чатов. Начните новый разговор!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  conversations.map((conv) => (
                    <Card 
                      key={conv.id}
                      className="glass-card hover:border-primary/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-border/30 group"
                      onClick={() => {
                        setActiveSection("chats");
                        setSearchParams({ chat: conv.id });
                      }}
                    >
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12 gradient-primary shadow-lg">
                            <AvatarFallback className="gradient-primary text-white">
                              <Sparkles className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-card" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base truncate group-hover:text-primary transition-colors">
                            {conv.title}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {formatDate(conv.updated_at)}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Announcements */}
            <div>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Объявления
              </h3>
              <div className="space-y-6">
                <Card className="glass-card border-2 border-primary/30 hover:border-primary/50 hover:shadow-xl transition-all duration-500 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <CardContent className="p-8 relative">
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-3xl gradient-primary text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-3 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                          AI Academy
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium mb-5 leading-relaxed">
                          Непрерывный центр обучения с еженедельными живыми тренингами и библиотекой записанных видео
                        </p>
                        <Button size="sm" className="gradient-primary text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl font-semibold px-6">
                          Присоединиться
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-2 border-accent/30 hover:border-accent/50 hover:shadow-xl transition-all duration-500 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <CardContent className="p-8 relative">
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-3xl gradient-secondary text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <Users2 className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-3 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                          Присоединяйтесь к сообществу!
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium mb-5 leading-relaxed">
                          Приватная группа, где пользователи делятся своими творениями, советами и получают помощь
                        </p>
                        <Button size="sm" className="gradient-secondary text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl font-semibold px-6">
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