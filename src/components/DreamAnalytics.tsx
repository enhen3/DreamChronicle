import { DreamStats } from "./DreamStats";
import { MoodTrendChart } from "./MoodTrendChart";
import { DreamTopicCloud } from "./DreamTopicCloud";
import { DreamPatternAnalysis } from "./DreamPatternAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
        <TabsTrigger value="basic">基础分析</TabsTrigger>
        <TabsTrigger value="patterns">关联分析</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-6 mt-0">
        {/* 统计卡片 */}
        <DreamStats history={history} />

        {/* 情绪趋势图 */}
        <MoodTrendChart history={history} days={30} />

        {/* 主题云 */}
        <DreamTopicCloud history={history} maxTopics={15} />
      </TabsContent>
      
      <TabsContent value="patterns" className="mt-0">
        {/* 关联分析与长期洞察 */}
        <DreamPatternAnalysis history={history} />
      </TabsContent>
    </Tabs>
  );
};

