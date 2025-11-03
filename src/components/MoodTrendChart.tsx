import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

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

interface MoodTrendChartProps {
  history: DreamHistory[];
  days?: number; // 显示最近多少天的数据，默认30天
}

export const MoodTrendChart = ({ history, days = 30 }: MoodTrendChartProps) => {
  const chartData = useMemo(() => {
    if (history.length === 0) {
      return [];
    }

    // 获取日期范围
    const now = new Date();
    const startDate = subDays(now, days);
    
    // 按日期分组数据，取每天的平均情绪值
    const dateMap = new Map<string, { sum: number; count: number }>();
    
    history.forEach((item) => {
      const itemDate = new Date(item.timestamp);
      if (itemDate >= startDate) {
        const dateKey = format(itemDate, "yyyy-MM-dd");
        const existing = dateMap.get(dateKey);
        if (existing) {
          existing.sum += item.moodValue;
          existing.count += 1;
        } else {
          dateMap.set(dateKey, { sum: item.moodValue, count: 1 });
        }
      }
    });

    // 生成完整日期序列（即使某天没有记录也显示）
    const data: Array<{ date: string; mood: number; dateLabel: string }> = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i);
      const dateKey = format(date, "yyyy-MM-dd");
      const dateLabel = format(date, "MM/dd", { locale: zhCN });
      
      const dayData = dateMap.get(dateKey);
      if (dayData) {
        data.push({
          date: dateKey,
          mood: Math.round(dayData.sum / dayData.count),
          dateLabel,
        });
      } else {
        // 没有记录的日期显示为空（null），这样图表会跳过这些点
        // 但我们仍然保留日期以保持连续性
        data.push({
          date: dateKey,
          mood: NaN, // 使用 NaN 让图表跳过这个点
          dateLabel,
        });
      }
    }

    return data;
  }, [history, days]);

  if (history.length === 0) {
    return (
      <Card className="p-6 bg-card/95 border border-border/50">
        <div className="text-center text-muted-foreground py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">暂无数据</p>
          <p className="text-xs mt-2">记录梦境后可查看情绪趋势</p>
        </div>
      </Card>
    );
  }

  // 计算平均情绪值用于参考线
  const validData = chartData.filter((d) => !isNaN(d.mood));
  const averageMood =
    validData.length > 0
      ? Math.round(
          validData.reduce((sum, d) => sum + d.mood, 0) / validData.length
        )
      : 50;

  return (
    <Card className="p-6 bg-card/95 border border-border/50">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary/70" />
            情绪趋势 ({days}天)
          </h3>
          <div className="text-xs text-muted-foreground">
            平均: <span className="font-semibold text-foreground">{averageMood}</span>
          </div>
        </div>
      </div>
      
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="dateLabel"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", marginBottom: "4px" }}
              formatter={(value: number) => {
                if (isNaN(value)) return "无记录";
                return [
                  `${value} (${value > 60 ? "积极" : value < 40 ? "消极" : "中性"})`,
                  "情绪值",
                ];
              }}
            />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#moodGradient)"
              dot={{ fill: "hsl(var(--primary))", r: 3 }}
              activeDot={{ r: 5 }}
            />
            {/* 参考线：平均值 */}
            {validData.length > 0 && (
              <ReferenceLine
                y={averageMood}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{ value: "平均值", position: "right", fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

