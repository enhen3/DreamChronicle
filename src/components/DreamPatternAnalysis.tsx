import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Link2, Sparkles, Lightbulb, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface DreamHistory {
  id: string;
  dream: string;
  mood: string;
  moodValue: number;
  moodColor: string;
  moodIcon?: string;
  interpretation: string;
  imageUrl?: string;
  timestamp: number;
}

interface DreamPatternAnalysisProps {
  history: DreamHistory[];
}

interface PatternAnalysisResult {
  insights: string;
  patterns: {
    topTopics: Array<{ topic: string; count: number; frequency: number }>;
    moodDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    averageMood: number;
    moodTrend: 'up' | 'down' | 'stable';
    moodChange: number;
    dreamsByDay: Array<[string, number]>;
  };
  relatedDreams: Array<{
    dream1: { id: string; preview: string; mood: string } | null;
    dream2: { id: string; preview: string; mood: string } | null;
    similarity: number;
    reason: string;
  }>;
  totalDreams: number;
}

export const DreamPatternAnalysis = ({ history }: DreamPatternAnalysisProps) => {
  const [analysis, setAnalysis] = useState<PatternAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (history.length >= 2) {
      loadAnalysis();
    } else {
      setAnalysis(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]);

  const loadAnalysis = async () => {
    if (history.length < 2) {
      setError('需要至少2条梦境记录才能进行关联分析');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 准备梦境数据
      const dreamsData = history.map(item => ({
        id: item.id,
        dream: item.dream,
        mood: item.mood,
        moodValue: item.moodValue,
        timestamp: item.timestamp,
      }));

      const { data, error: apiError } = await supabase.functions.invoke("analyze-dream-patterns", {
        body: { dreams: dreamsData },
      });

      if (apiError) throw apiError;

      if (data.error) {
        // 记录数不足的情况
        setError(data.error);
        setAnalysis(null);
        return;
      }

      if (!data.insights || !data.patterns) {
        throw new Error("分析结果格式错误");
      }

      setAnalysis(data);
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      const message = error instanceof Error ? error.message : String(error ?? "");
      setError(message);
      toast({
        title: "分析失败",
        description: message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (history.length < 2) {
    return (
      <Card className="p-6 bg-card/95 border border-border/50">
        <div className="text-center text-muted-foreground py-8">
          <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">需要更多数据</p>
          <p className="text-xs mt-2">记录至少2条梦境后，将为您提供关联分析和长期洞察</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-card/95 border border-border/50">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">正在分析您的梦境模式...</p>
        </div>
      </Card>
    );
  }

  if (error && !analysis) {
    return (
      <Card className="p-6 bg-card/95 border border-border/50">
        <div className="text-center text-muted-foreground py-8">
          <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm mb-2">{error}</p>
          {history.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalysis}
              className="mt-4"
            >
              重新分析
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 长期洞察 */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">长期洞察</h3>
            <p className="text-xs text-muted-foreground mt-1">
              基于您的 {analysis.totalDreams} 条梦境记录
            </p>
          </div>
        </div>
        <div className="prose prose-sm max-w-none">
          <div className="text-foreground/90 leading-relaxed text-[15px]">
            {analysis.insights.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-3 last:mb-0">
                  {paragraph.trim()}
                </p>
              )
            ))}
          </div>
        </div>
      </Card>

      {/* 模式统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 高频主题 */}
        <Card className="p-5 bg-card/95 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary/70" />
            <h4 className="text-sm font-semibold">高频主题</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.patterns.topTopics.slice(0, 8).map((topic, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs"
              >
                {topic.topic}
                <span className="ml-1.5 text-muted-foreground">({topic.count})</span>
              </Badge>
            ))}
          </div>
        </Card>

        {/* 情绪趋势 */}
        <Card className="p-5 bg-card/95 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary/70" />
            <h4 className="text-sm font-semibold">情绪趋势</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">平均情绪</span>
              <span className="font-semibold">{analysis.patterns.averageMood}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">最近趋势</span>
              <span className={`font-semibold ${
                analysis.patterns.moodTrend === 'up' ? 'text-green-500' :
                analysis.patterns.moodTrend === 'down' ? 'text-red-500' :
                'text-muted-foreground'
              }`}>
                {analysis.patterns.moodTrend === 'up' ? '↑ 上升' :
                 analysis.patterns.moodTrend === 'down' ? '↓ 下降' :
                 '→ 稳定'}
                {analysis.patterns.moodChange > 0 && ` (${analysis.patterns.moodChange}分)`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>积极: {analysis.patterns.moodDistribution.positive}</span>
              <span>中性: {analysis.patterns.moodDistribution.neutral}</span>
              <span>消极: {analysis.patterns.moodDistribution.negative}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 相关梦境推荐 */}
      {analysis.relatedDreams && analysis.relatedDreams.length > 0 && (
        <Card className="p-6 bg-card/95 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="w-5 h-5 text-primary/70" />
            <h3 className="text-lg font-semibold">相关梦境</h3>
            <Badge variant="outline" className="text-xs">
              {analysis.relatedDreams.length}组
            </Badge>
          </div>
          <div className="space-y-4">
            {analysis.relatedDreams.slice(0, 5).map((related, index) => {
              if (!related.dream1 || !related.dream2) return null;
              
              const dream1Record = history.find(h => h.id === related.dream1!.id);
              const dream2Record = history.find(h => h.id === related.dream2!.id);
              
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          相似度 {Math.round(related.similarity * 100)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">{related.reason}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground">梦境1：</span>
                          <span className="text-foreground/90">{related.dream1.preview}</span>
                          {dream1Record && (
                            <span className="text-xs text-muted-foreground">
                              ({format(new Date(dream1Record.timestamp), 'MM/dd', { locale: zhCN })})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground">梦境2：</span>
                            <span className="text-foreground/90">{related.dream2.preview}</span>
                            {dream2Record && (
                              <span className="text-xs text-muted-foreground">
                                ({format(new Date(dream2Record.timestamp), 'MM/dd', { locale: zhCN })})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 时间模式 */}
      {analysis.patterns.dreamsByDay && analysis.patterns.dreamsByDay.length > 0 && (
        <Card className="p-5 bg-card/95 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-primary/70" />
            <h4 className="text-sm font-semibold">记录时间分布</h4>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((day) => {
              const count = analysis.patterns.dreamsByDay.find(([d]) => d === day)?.[1] || 0;
              const maxCount = Math.max(...analysis.patterns.dreamsByDay.map(([, c]) => c), 1);
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className="text-xs text-muted-foreground">{day}</div>
                  <div className="w-full h-20 bg-muted rounded-t flex items-end">
                    <div
                      className="w-full bg-primary rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                      title={`${count}条记录`}
                    />
                  </div>
                  <div className="text-xs font-medium">{count}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 刷新按钮 */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={loadAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              重新分析
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

