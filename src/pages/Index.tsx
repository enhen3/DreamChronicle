import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Heart, Cloud, Moon, Stars } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DreamHistory {
  id: string;
  dream: string;
  mood: string;
  interpretation: string;
  timestamp: number;
}

const MOODS = [
  { emoji: "😊", label: "开心", value: "开心愉快" },
  { emoji: "😰", label: "焦虑", value: "焦虑不安" },
  { emoji: "😢", label: "悲伤", value: "悲伤难过" },
  { emoji: "😨", label: "恐惧", value: "恐惧害怕" },
  { emoji: "😌", label: "平静", value: "平静安详" },
  { emoji: "🤔", label: "困惑", value: "困惑疑惑" },
];

const Index = () => {
  const [dream, setDream] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<DreamHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dreamHistory");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (dream: string, mood: string, interpretation: string) => {
    const newEntry: DreamHistory = {
      id: Date.now().toString(),
      dream,
      mood,
      interpretation,
      timestamp: Date.now(),
    };
    const newHistory = [newEntry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("dreamHistory", JSON.stringify(newHistory));
  };

  const handleSubmit = async () => {
    if (!dream.trim() || !selectedMood) {
      toast({
        title: "请填写完整信息",
        description: "请输入您的梦境并选择心情",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setInterpretation("");

    try {
      const { data, error } = await supabase.functions.invoke("interpret-dream", {
        body: { dream: dream.trim(), mood: selectedMood },
      });

      if (error) throw error;

      if (data.interpretation) {
        setInterpretation(data.interpretation);
        saveToHistory(dream, selectedMood, data.interpretation);
        toast({
          title: "解梦完成",
          description: "已为您生成梦境解读",
        });
      } else {
        throw new Error("解读结果为空");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "解梦失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDream("");
    setSelectedMood("");
    setInterpretation("");
  };

  const deleteHistory = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("dreamHistory", JSON.stringify(newHistory));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 opacity-20 animate-pulse">
        <Moon className="w-20 h-20 text-primary" />
      </div>
      <div className="absolute top-32 right-20 opacity-15 animate-pulse delay-700">
        <Stars className="w-24 h-24 text-primary" />
      </div>
      <div className="absolute bottom-20 left-1/4 opacity-10 animate-pulse delay-1000">
        <Cloud className="w-32 h-32 text-primary" />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              周公解梦
            </h1>
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            探索梦境的奥秘，聆听内心的声音
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto space-y-6">
          {!interpretation ? (
            <Card className="p-6 md:p-8 backdrop-blur-sm bg-card/95 shadow-lg border-border/50 animate-fade-in-up">
              <div className="space-y-6">
                {/* Dream Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Moon className="w-4 h-4 text-primary" />
                    请描述您昨晚的梦境
                  </label>
                  <Textarea
                    placeholder="在这里输入您的梦境... 例如：我梦见自己在天空中飞翔..."
                    value={dream}
                    onChange={(e) => setDream(e.target.value)}
                    className="min-h-[150px] resize-none bg-background/50 border-border/80 focus:border-primary transition-colors"
                    disabled={isLoading}
                  />
                </div>

                {/* Mood Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    醒来后的心情
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(mood.value)}
                        disabled={isLoading}
                        className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 ${
                          selectedMood === mood.value
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border/50 bg-background/50 hover:border-primary/50"
                        }`}
                      >
                        <div className="text-3xl mb-1">{mood.emoji}</div>
                        <div className="text-xs font-medium">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !dream.trim() || !selectedMood}
                  className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      解读中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      开始解梦
                    </>
                  )}
                </Button>

                {/* History Button */}
                {history.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full border-primary/30 hover:bg-primary/5"
                  >
                    {showHistory ? "隐藏" : "查看"}历史记录 ({history.length})
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 md:p-8 backdrop-blur-sm bg-card/95 shadow-lg border-border/50 animate-fade-in">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    梦境解读
                  </h2>
                  <Button variant="ghost" onClick={handleReset} className="text-primary">
                    再解一梦
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-2">您的梦境</div>
                    <p className="text-foreground/90">{dream}</p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                    <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {interpretation}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* History */}
          {showHistory && history.length > 0 && (
            <Card className="p-6 backdrop-blur-sm bg-card/95 shadow-lg border-border/50 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                历史记录
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.timestamp).toLocaleDateString("zh-CN")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHistory(item.id)}
                        className="h-6 px-2 text-destructive hover:text-destructive"
                      >
                        删除
                      </Button>
                    </div>
                    <p className="text-sm line-clamp-2 text-foreground/80">{item.dream}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
