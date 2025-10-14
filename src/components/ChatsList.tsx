import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Bot, MoreVertical, FolderPlus, Plus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  model?: string;
}

const getModelIcon = (model?: string) => {
  if (!model) return Bot;
  if (model.includes('gemini')) return Sparkles;
  if (model.includes('gpt')) return Bot;
  return Bot;
};

export const ChatsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      toast.error("Не удалось загрузить чаты");
      return;
    }

    if (data) {
      setConversations(data);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Не удалось удалить чат");
      return;
    }

    toast.success("Чат удален");
    loadConversations();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleNewChat = () => {
    navigate('/chat');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Chats</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:text-white"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </Button>
            <Button 
              onClick={handleNewChat}
              size="sm" 
              className="gap-2 gradient-primary text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              Status
            </Button>
            <Button variant="secondary" size="sm">All</Button>
            <Button variant="outline" size="sm">Archived</Button>
            <Button variant="outline" size="sm">Not Archived</Button>
            
            <Button variant="outline" size="sm" className="gap-2">
              Type
            </Button>
            <Button variant="secondary" size="sm">All</Button>
            <Button variant="outline" size="sm">Folders</Button>
            <Button variant="outline" size="sm">Chats</Button>
            
            <Button variant="outline" size="sm" className="gap-2">
              Sort
            </Button>
            <Button variant="secondary" size="sm">A-Z</Button>
            
            <Button variant="outline" size="sm">Bulk</Button>
          </div>
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Нет чатов</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conv) => {
              const ModelIcon = getModelIcon(conv.model);
              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat?id=${conv.id}`)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  {/* Colored indicator */}
                  <div className="w-1 h-12 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
                  
                  {/* Model Icon */}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <ModelIcon className="w-5 h-5 text-foreground" />
                  </div>
                  
                  {/* Chat Title */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-foreground">{conv.title}</p>
                  </div>

                  {/* User Avatar */}
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Date */}
                  <span className="text-sm text-muted-foreground min-w-[100px] text-right">
                    {formatDate(conv.created_at)}
                  </span>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => navigate(`/chat?id=${conv.id}`)}>
                        Открыть
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Архивировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteChat(conv.id, e as any)}
                        className="text-destructive"
                      >
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
