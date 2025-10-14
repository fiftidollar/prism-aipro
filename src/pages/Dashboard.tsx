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

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const activeChatId = searchParams.get('chat');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

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
      <div className="w-64 glass-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent gradient-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Hub
          </h1>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeSection === "chats" && activeChatId ? (
          <ChatInterface 
            conversationId={activeChatId} 
            onConversationUpdate={loadConversations}
          />
        ) : activeSection === "chats" ? (
          <ChatsList />
        ) : (
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card 
              className="glass-card border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
              onClick={() => {
                setActiveSection("chats");
                setSearchParams({});
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">Start a New Chat</CardTitle>
                    <CardDescription>
                      Get answers or create with the most powerful chat models.
                    </CardDescription>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-2xl">+</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="glass-card border-2 border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group"
              onClick={() => setActiveSection("images")}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">Generate an Image</CardTitle>
                    <CardDescription>
                      Create something visually stunning using your words!
                    </CardDescription>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-2xl">+</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Chats */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Recent Chats</h3>
              <div className="space-y-3">
                {conversations.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      Нет чатов. Начните новый разговор!
                    </CardContent>
                  </Card>
                ) : (
                  conversations.map((conv) => (
                    <Card 
                      key={conv.id}
                      className="glass-card hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => {
                        setActiveSection("chats");
                        setSearchParams({ chat: conv.id });
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Sparkles className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.title}</p>
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
              <h3 className="text-xl font-semibold mb-4">Announcements</h3>
              <div className="space-y-4">
                <Card className="glass-card bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">The AI Academy</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          An ongoing learning hub—FREE for subscribers—with weekly live training, and library of recorded videos.
                        </p>
                        <Button size="sm" className="bg-white text-orange-500 hover:bg-white/90">
                          Join the Academy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
                        <Users2 className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">Join the Community!</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          A private group where users can share their creations, tips, and get advice.
                        </p>
                        <Button size="sm" className="bg-white text-blue-500 hover:bg-white/90">
                          Join the Group
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
    </div>
  );
};

export default Dashboard;