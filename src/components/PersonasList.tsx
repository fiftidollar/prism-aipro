import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Persona {
  id: string;
  name: string;
  instructions: string;
  created_at: string;
  updated_at: string;
}

export const PersonasList = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaInstructions, setNewPersonaInstructions] = useState("");

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading personas:", error);
      toast.error("Ошибка загрузки персон");
    } else {
      setPersonas(data || []);
    }
  };

  const handleCreatePersona = async () => {
    if (!newPersonaName.trim() || !newPersonaInstructions.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("personas").insert({
      user_id: user.id,
      name: newPersonaName,
      instructions: newPersonaInstructions,
    });

    if (error) {
      console.error("Error creating persona:", error);
      toast.error("Ошибка создания персоны");
    } else {
      toast.success("Персона создана");
      setNewPersonaName("");
      setNewPersonaInstructions("");
      setIsCreateDialogOpen(false);
      loadPersonas();
    }
  };

  const handleUpdatePersona = async () => {
    if (!editingPersona || !newPersonaName.trim() || !newPersonaInstructions.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    const { error } = await supabase
      .from("personas")
      .update({
        name: newPersonaName,
        instructions: newPersonaInstructions,
      })
      .eq("id", editingPersona.id);

    if (error) {
      console.error("Error updating persona:", error);
      toast.error("Ошибка обновления персоны");
    } else {
      toast.success("Персона обновлена");
      setNewPersonaName("");
      setNewPersonaInstructions("");
      setIsEditDialogOpen(false);
      setEditingPersona(null);
      loadPersonas();
    }
  };

  const handleDeletePersona = async (id: string) => {
    const { error } = await supabase.from("personas").delete().eq("id", id);

    if (error) {
      console.error("Error deleting persona:", error);
      toast.error("Ошибка удаления персоны");
    } else {
      toast.success("Персона удалена");
      loadPersonas();
    }
  };

  const openEditDialog = (persona: Persona) => {
    setEditingPersona(persona);
    setNewPersonaName(persona.name);
    setNewPersonaInstructions(persona.instructions);
    setIsEditDialogOpen(true);
  };

  const filteredPersonas = personas.filter((persona) =>
    persona.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PersonaDialog = ({ isOpen, onOpenChange, onSubmit, title }: any) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="persona-name">Название персоны</Label>
            <Input
              id="persona-name"
              value={newPersonaName}
              onChange={(e) => setNewPersonaName(e.target.value)}
              placeholder="Введите название персоны"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona-instructions">Инструкции</Label>
            <Textarea
              id="persona-instructions"
              value={newPersonaInstructions}
              onChange={(e) => setNewPersonaInstructions(e.target.value)}
              placeholder="Введите подробные инструкции для персоны..."
              className="min-h-[300px]"
            />
          </div>
          <Button onClick={onSubmit} className="w-full">
            {title === "Создать персону" ? "Создать" : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Библиотека персон</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Создать персону
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать персону</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-persona-name">Название персоны</Label>
                  <Input
                    id="new-persona-name"
                    value={newPersonaName}
                    onChange={(e) => setNewPersonaName(e.target.value)}
                    placeholder="Введите название персоны"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-persona-instructions">Инструкции</Label>
                  <Textarea
                    id="new-persona-instructions"
                    value={newPersonaInstructions}
                    onChange={(e) => setNewPersonaInstructions(e.target.value)}
                    placeholder="Введите подробные инструкции для персоны..."
                    className="min-h-[300px]"
                  />
                </div>
                <Button onClick={handleCreatePersona} className="w-full">
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск персон..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredPersonas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "Персоны не найдены" : "Нет созданных персон"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPersonas.map((persona) => (
              <div
                key={persona.id}
                className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{persona.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {persona.instructions}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(persona)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeletePersona(persona.id)}
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

      <PersonaDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdatePersona}
        title="Редактировать персону"
      />
    </div>
  );
};
