import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Folder, MoreVertical, SlidersHorizontal, Archive, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export const ChatsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

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

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search Chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Status
            </Button>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              Type
            </Button>
            
            <Button variant="outline" size="sm">
              Folders
            </Button>
            
            <Button variant="outline" size="sm">
              Chats
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              Bulk
            </Button>
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
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat?id=${conv.id}`)}
                className="flex items-center gap-4 p-4 hover:bg-primary/5 cursor-pointer transition-colors group"
              >
                <Folder className="w-5 h-5 text-muted-foreground" />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{conv.title}</p>
                </div>

                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <span className="text-sm text-muted-foreground min-w-[100px] text-right">
                  {formatDate(conv.updated_at)}
                </span>

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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/chat?id=${conv.id}`)}>
                      Открыть
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Архивировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteChat(conv.id, e as any)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
