import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [messages, setMessages] = useState<Array<{ role: string; content: string; model?: string }>>([]);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");

    toast({
      title: "Отправка сообщения",
      description: `Используется модель: ${selectedModel}`,
    });

    // Здесь будет интеграция с OpenRouter API
    const aiResponse = {
      role: "assistant",
      content: "Интеграция с OpenRouter будет добавлена после настройки backend...",
      model: selectedModel,
    };

    setTimeout(() => {
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent gradient-primary">
              AI Chat Hub
            </h1>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-64 glass-card">
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                <SelectItem value="perplexity">Perplexity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4 animate-slide-up">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
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
            messages.map((msg, idx) => (
              <div
                key={idx}
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

        {/* Input Area */}
        <div className="glass-card p-4 rounded-xl animate-slide-up">
          <div className="flex gap-4">
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
            />
            <Button
              onClick={handleSend}
              size="lg"
              className="gradient-primary hover:opacity-90 transition-opacity"
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
