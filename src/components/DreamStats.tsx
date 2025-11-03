import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

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

interface DreamStatsProps {
  history: DreamHistory[];
}

export const DreamStats = ({ history }: DreamStatsProps) => {
  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        total: 0,
        recentCount: 0,
        averageMood: 50,
        moodDistribution: {
          positive: 0, // > 60
          neutral: 0, // 40-60
          negative: 0, // < 40
        },
        lastRecordDate: null as Date | null,
      };
    }

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentCount = history.filter(
      (item) => item.timestamp >= sevenDaysAgo
    ).length;

    const totalMood = history.reduce((sum, item) => sum + item.moodValue, 0);
    const averageMood = Math.round(totalMood / history.length);

    const moodDistribution = {
      positive: history.filter((item) => item.moodValue > 60).length,
      neutral: history.filter(
        (item) => item.moodValue >= 40 && item.moodValue <= 60
      ).length,
      negative: history.filter((item) => item.moodValue < 40).length,
    };

    const lastRecord = history[0]; // 历史记录按时间倒序排列
    const lastRecordDate = lastRecord ? new Date(lastRecord.timestamp) : null;

    return {
      total: history.length,
      recentCount,
      averageMood,
      moodDistribution,
      lastRecordDate,
    };
  }, [history]);

  if (stats.total === 0) {
    return (
      <Card className="p-6 bg-card/95 border border-border/50">
        <div className="text-center text-muted-foreground py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">暂无数据</p>
          <p className="text-xs mt-2">开始记录梦境以查看统计数据</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 总记录数 */}
      <Card className="p-5 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            总记录数
          </div>
          <Sparkles className="w-4 h-4 text-primary/60" />
        </div>
        <div className="text-3xl font-semibold text-foreground">{stats.total}</div>
        <div className="text-xs text-muted-foreground mt-1">
          条梦境记录
        </div>
      </Card>

      {/* 最近7天 */}
      <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            最近7天
          </div>
          <Clock className="w-4 h-4 text-blue-500/60" />
        </div>
        <div className="text-3xl font-semibold text-foreground">{stats.recentCount}</div>
        <div className="text-xs text-muted-foreground mt-1">
          条新记录
        </div>
      </Card>

      {/* 平均情绪 */}
      <Card className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            平均情绪
          </div>
          <TrendingUp className="w-4 h-4 text-green-500/60" />
        </div>
        <div className="text-3xl font-semibold text-foreground">{stats.averageMood}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {stats.averageMood > 60 ? "积极" : stats.averageMood < 40 ? "消极" : "中性"}
        </div>
      </Card>

      {/* 情绪分布 */}
      <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            情绪分布
          </div>
          <BarChart3 className="w-4 h-4 text-purple-500/60" />
        </div>
        <div className="space-y-1.5 mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-500/80">积极</span>
            <span className="font-semibold">{stats.moodDistribution.positive}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500/80">中性</span>
            <span className="font-semibold">{stats.moodDistribution.neutral}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-red-500/80">消极</span>
            <span className="font-semibold">{stats.moodDistribution.negative}</span>
          </div>
        </div>
      </Card>

      {/* 最后记录时间 */}
      {stats.lastRecordDate && (
        <Card className="p-5 bg-card/95 border border-border/50 md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                最后记录
              </span>
            </div>
            <span className="text-sm font-medium">
              {format(stats.lastRecordDate, "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};

