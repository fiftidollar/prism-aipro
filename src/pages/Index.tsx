import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Zap, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "50+ AI Моделей",
      description: "Доступ к GPT-4, Claude, Gemini, Perplexity и многим другим в одном интерфейсе",
    },
    {
      icon: Zap,
      title: "Мгновенное переключение",
      description: "Меняйте модели в процессе общения без потери контекста разговора",
    },
    {
      icon: Users,
      title: "Совместная работа",
      description: "Работайте в команде с общим доступом к чатам и персонализированным инструкциям",
    },
    {
      icon: Shield,
      title: "Безопасность данных",
      description: "Ваши данные защищены и хранятся с соблюдением всех стандартов безопасности",
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-block">
            <span className="px-4 py-2 rounded-full glass-card text-sm font-medium text-primary">
              Все AI модели в одном месте
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Объедините силу
            <br />
            <span className="bg-clip-text text-transparent gradient-accent">
              всех нейросетей
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Работайте с более чем 50 моделями ИИ одновременно. Переключайтесь между GPT-4, Claude, Gemini 
            и другими в процессе общения. Создавайте персонализированные инструкции и работайте в команде.
          </p>

          <div className="flex gap-4 justify-center pt-4 animate-slide-up">
            <Button
              size="lg"
              className="gradient-primary hover:opacity-90 transition-opacity glow-primary text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Начать работу
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glass-card text-lg px-8"
            >
              Узнать больше
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 pb-32">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="glass-card p-6 hover:border-primary/50 transition-all duration-300 hover:glow-primary"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 pb-32">
        <div className="glass-card rounded-2xl p-12 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                50+
              </div>
              <div className="text-muted-foreground">AI моделей</div>
            </div>
            <div>
              <div className="text-5xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                ∞
              </div>
              <div className="text-muted-foreground">Без ограничений</div>
            </div>
            <div>
              <div className="text-5xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-muted-foreground">Поддержка</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-32">
        <div className="glass-card rounded-2xl p-12 text-center animate-slide-up">
          <h2 className="text-4xl font-bold mb-4">
            Готовы начать работу с AI?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам пользователей, которые уже используют все возможности 
            искусственного интеллекта в одном месте.
          </p>
          <Button
            size="lg"
            className="gradient-primary hover:opacity-90 transition-opacity glow-primary text-lg px-8"
            onClick={() => navigate("/auth")}
          >
            Начать бесплатно
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
