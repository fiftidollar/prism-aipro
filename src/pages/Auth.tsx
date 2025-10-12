import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email({ message: "Неверный формат email" }),
  password: z.string().min(6, { message: "Пароль должен быть не менее 6 символов" }),
  fullName: z.string().optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/chat");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/chat");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationData = authSchema.parse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
      });

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validationData.email,
          password: validationData.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Ошибка входа",
              description: "Неверный email или пароль",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Успешный вход",
            description: "Добро пожаловать!",
          });
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: validationData.email,
          password: validationData.password,
          options: {
            data: {
              full_name: validationData.fullName || "",
            },
            emailRedirectTo: `${window.location.origin}/chat`,
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Пользователь уже существует",
              description: "Попробуйте войти или используйте другой email",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Регистрация успешна",
            description: "Добро пожаловать в AI Hub!",
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Ошибка валидации",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Auth error:", error);
        toast({
          title: "Ошибка",
          description: error instanceof Error ? error.message : "Произошла ошибка",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="glass-card p-8 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center mb-8">
          <Sparkles className="w-12 h-12 text-primary animate-glow-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          {isLogin ? "Вход в AI Hub" : "Регистрация"}
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {isLogin
            ? "Войдите, чтобы продолжить работу с AI"
            : "Создайте аккаунт для доступа к 50+ AI моделям"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Полное имя</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-background/50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin
              ? "Нет аккаунта? Зарегистрируйтесь"
              : "Уже есть аккаунт? Войдите"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
