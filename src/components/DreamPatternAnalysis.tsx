import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Link2, Sparkles, Lightbulb, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
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

      console.log("Calling analyze-dream-patterns with:", { 
        dreamsCount: dreamsData.length,
        sampleDream: dreamsData[0]?.dream?.substring(0, 50)
      });

      const response = await fetch('/api/analyze-dream-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dreams: dreamsData }),
      });

      console.log("API Response received:", { 
        status: response.status,
        ok: response.ok,
      });

      // 检查HTTP状态码
      if (!response.ok) {
        let errorMessage = "分析服务暂时不可用，请稍后重试";
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : String(errorData.error);
          } else {
            // 根据状态码提供默认错误消息
            if (response.status === 404) {
              errorMessage = "分析功能暂未配置，请稍后重试";
            } else if (response.status === 500) {
              errorMessage = "服务器内部错误，请稍后重试";
            } else {
              errorMessage = `请求失败 (状态码: ${response.status})`;
            }
          }
        } catch (e) {
          // 如果无法解析错误响应，使用状态码
          if (response.status === 404) {
            errorMessage = "分析功能暂未配置，请稍后重试";
          } else if (response.status === 500) {
            errorMessage = "服务器内部错误，请稍后重试";
          }
        }
        
        throw new Error(errorMessage);
      }

      // 解析响应数据
      const data = await response.json();

      // 检查数据中是否有error字段（业务错误）
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        console.log("Function returned error:", data.error);
        const errorMsg = typeof data.error === 'string' ? data.error : String(data.error);
        setError(errorMsg);
        setAnalysis(null);
        return;
      }

      // 验证返回的数据结构
      if (!data || typeof data !== 'object' || !('insights' in data) || !('patterns' in data)) {
        console.error("Invalid response structure:", {
          hasInsights: data && 'insights' in data,
          hasPatterns: data && 'patterns' in data,
          dataKeys: data ? Object.keys(data) : null,
          data: data
        });
        throw new Error("分析结果格式错误，请稍后重试");
      }

      console.log("Analysis successful, setting data");
      setAnalysis(data as PatternAnalysisResult);
    } catch (error) {
      console.error("=== Error in loadAnalysis catch block ===");
      console.error("Error:", error);
      console.error("Error type:", typeof error);
      console.error("Error instanceof Error:", error instanceof Error);
      
      // 使用与interpret-dream相同的简单错误处理逻辑
      let message = "分析服务暂时不可用，请稍后重试";
      
      if (error instanceof Error) {
        message = error.message || String(error);
        console.error("Error message:", message);
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        console.error("Error object:", errorObj);
        if (errorObj.message) {
          message = String(errorObj.message);
        } else if (errorObj.error) {
          message = String(errorObj.error);
        } else {
          message = String(error);
        }
      } else {
        message = String(error ?? "");
      }
      
      console.error("Extracted message:", message);
      
      // 根据错误消息内容提供更友好的提示
      const lowerMessage = message.toLowerCase();
      let friendlyMessage = message;
      
      console.log("Processing error message:", { original: message, lower: lowerMessage });
      
      // 优先检查是否是404错误（API未找到）
      if (lowerMessage.includes("404") || 
          lowerMessage.includes("not found") ||
          lowerMessage.includes("暂未配置") ||
          lowerMessage.includes("无法找到") ||
          lowerMessage.includes("未找到")) {
        friendlyMessage = "分析功能暂未配置，请稍后重试";
        console.log("✅ Detected 404 error");
      } 
      // 检查是否是服务器错误（500）
      else if (lowerMessage.includes("500") || 
               lowerMessage.includes("server error") ||
               lowerMessage.includes("内部错误")) {
        friendlyMessage = "服务器内部错误，请稍后重试";
        console.log("✅ Detected server error (500)");
      }
      // 检查是否是真正的网络错误（只有在明确是网络错误且不是函数调用失败时）
      // 注意：必须排除"Failed to send"、"edge function"等关键词，避免误判
      else if ((lowerMessage.includes("failed to fetch") ||
               lowerMessage.includes("networkerror") ||
               lowerMessage.includes("network request failed") ||
               lowerMessage.includes("net::err") ||
               lowerMessage.includes("typeerror: failed to fetch")) &&
               !lowerMessage.includes("404") && 
               !lowerMessage.includes("not found") &&
               !lowerMessage.includes("edge function") &&
               !lowerMessage.includes("failed to send")) {
        friendlyMessage = "无法连接到分析服务，请检查网络连接或稍后重试";
        console.log("✅ Detected network error");
      }
      // 如果错误消息包含"连接"但没有404或not found，可能是其他问题
      else if (lowerMessage.includes("连接") && 
               !lowerMessage.includes("网络") &&
               !lowerMessage.includes("404") &&
               !lowerMessage.includes("not found")) {
        friendlyMessage = "分析服务暂时不可用，请稍后重试";
        console.log("✅ Detected connection-related error (not network, not 404)");
      }
      // 检查是否是超时错误
      else if (lowerMessage.includes("timeout") || lowerMessage.includes("超时")) {
        friendlyMessage = "请求超时，请稍后重试";
        console.log("Detected timeout error");
      }
      // 检查是否是CORS错误
      else if (lowerMessage.includes("cors") || lowerMessage.includes("跨域")) {
        friendlyMessage = "跨域请求失败，请检查服务器配置";
        console.log("Detected CORS error");
      }
      // 检查是否是空消息
      else if (!message || message.trim() === "" || message === "undefined" || message === "null") {
        friendlyMessage = "分析服务暂时不可用，请稍后重试";
        console.log("Detected empty message");
      }
      // 其他情况，保持原消息但添加说明
      else {
        // 如果消息看起来像是错误但不确定类型，使用通用提示
        friendlyMessage = message || "分析服务暂时不可用，请稍后重试";
        console.log("Using original message:", friendlyMessage);
      }
      
      console.error("Final friendly message:", friendlyMessage);
      setError(friendlyMessage);
      toast({
        title: "分析失败",
        description: friendlyMessage,
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
    const isDeploymentError = error.includes("Edge Function已部署") || error.includes("暂未配置");
    
    return (
      <Card className="p-6 bg-card/95 border border-border/50">
        <div className="text-center text-muted-foreground py-8">
          <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm mb-2 font-medium">{error}</p>
          {isDeploymentError && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs text-left max-w-md mx-auto space-y-3">
              <p className="font-semibold mb-2 text-foreground">💡 提示：</p>
              <p className="text-muted-foreground">
                如果这是第一次部署，请确保：
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground mt-2">
                <li>已在 Vercel 部署项目</li>
                <li>已在 Vercel 设置环境变量 <code className="bg-background px-1 rounded">OPENROUTER_API_KEY</code></li>
                <li>重新部署后功能将自动生效</li>
              </ol>
            </div>
          )}
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

