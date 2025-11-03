import { DreamStats } from "./DreamStats";
import { MoodTrendChart } from "./MoodTrendChart";
import { DreamTopicCloud } from "./DreamTopicCloud";

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

interface DreamAnalyticsProps {
  history: DreamHistory[];
}

export const DreamAnalytics = ({ history }: DreamAnalyticsProps) => {
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <DreamStats history={history} />

      {/* 情绪趋势图 */}
      <MoodTrendChart history={history} days={30} />

      {/* 主题云 */}
      <DreamTopicCloud history={history} maxTopics={15} />
    </div>
  );
};

