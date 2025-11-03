import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tag } from "lucide-react";

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

interface DreamTopicCloudProps {
  history: DreamHistory[];
  maxTopics?: number; // 最多显示的主题数量，默认15
  minCount?: number; // 关键词最少出现次数，默认2
}

// 虚词（无实义，不能单独成词）
const FUNCTION_WORDS = new Set([
  // 助词
  "的", "地", "得", "了", "着", "过",
  // 介词
  "在", "从", "向", "往", "朝", "到", "于", "对", "给", "为", "被", "让", "使", "由", "把", "跟", "和", "与", "同",
  // 连词
  "和", "或", "但", "而", "且", "以及", "以及", "因为", "所以", "如果", "虽然",
  // 语气词
  "吗", "呢", "吧", "啊", "呀", "啦",
  // 代词（部分）
  "我", "你", "他", "她", "它", "这", "那", "哪",
  // 副词（部分）
  "很", "非常", "也", "还", "就", "都", "只", "才", "刚", "已", "曾", "将", "要", "能", "会", "可", "该", "应", "再", "又",
  // 数量词（部分）
  "一", "二", "三", "几", "多", "少",
]);

// 无意义结尾字（这些字结尾的词通常是片段）
const WEAK_ENDINGS = new Set([
  "的", "了", "着", "到", "在", "中", "里", "上", "下", "来", "去",
  "见", "看", "听", "说", "想", "感", "觉",
]);

// 无意义开头字（这些字开头的词通常是片段，除非是常见词）
const WEAK_STARTS = new Set([
  "见", "己", "自", "的", "在", "到", "我", "你", "他", "她",
  "了", "着", "过", "从", "向", "往", "朝", "于", "对", "给",
]);

// 常见有意义的中文双字词（白名单，优先级高）
const COMMON_WORDS_2 = new Set([
  // 自然
  "天空", "大地", "海洋", "森林", "山峰", "河流", "湖泊", "星星", "月亮", "太阳",
  // 动物
  "鸟", "鱼", "猫", "狗", "龙", "虎", "蛇", "马", "牛", "羊",
  // 身体
  "眼睛", "手指", "头发", "心脏", "血液",
  // 动作
  "飞翔", "游泳", "跑步", "跳跃", "行走", "奔跑", "跳跃", "坠落", "上升", "下降",
  // 情感
  "快乐", "悲伤", "恐惧", "惊讶", "愤怒", "平静", "紧张", "放松",
  // 时间
  "白天", "夜晚", "清晨", "黄昏", "春天", "夏天", "秋天", "冬天",
  // 地点
  "房间", "学校", "公园", "街道", "城市", "乡村", "海边", "山顶",
  // 物品
  "书本", "花朵", "树木", "建筑", "车辆", "衣服", "食物",
]);

// 常见有意义的三字词
const COMMON_WORDS_3 = new Set([
  "原始森林", "天空中", "大海边", "小河边", "山顶上", "房间里",
]);

// 判断是否为有效关键词
function isValidKeyword(word: string): boolean {
  // 必须是2-4个中文字符
  if (!/^[\u4e00-\u9fa5]{2,4}$/.test(word)) {
    return false;
  }

  // 单字词必须不在虚词列表中（虽然我们已经限定2-4字，这里作为保险）
  if (word.length === 1 && FUNCTION_WORDS.has(word)) {
    return false;
  }

  // 检查是否以虚词开头（2字以上时）
  if (word.length >= 2) {
    const firstChar = word[0];
    // 如果以虚词开头，且不在常见词列表中，很可能是片段
    if (WEAK_STARTS.has(firstChar)) {
      // 检查是否在白名单中
      if (word.length === 2 && COMMON_WORDS_2.has(word)) {
        return true;
      }
      if (word.length === 3 && COMMON_WORDS_3.has(word)) {
        return true;
      }
      // 常见的有意义组合
      if (word === "自己" || word === "现在" || word === "以后" || word === "以前") {
        return true;
      }
      // 其他以虚词开头的很可能不是完整词
      return false;
    }

    // 检查是否以虚词结尾（更容易产生无意义片段）
    const lastChar = word[word.length - 1];
    if (WEAK_ENDINGS.has(lastChar)) {
      // 如果结尾是虚词，且不在常见词列表中，很可能是片段
      if (word.length === 2 && COMMON_WORDS_2.has(word)) {
        return true;
      }
      if (word.length === 3 && COMMON_WORDS_3.has(word)) {
        return true;
      }
      // 排除常见的有意义组合
      if (word === "找到" || word === "看到" || word === "听到" || word === "感到") {
        return false; // 这些是动词+助词，不是名词性关键词
      }
      // 其他以虚词结尾的很可能是片段
      return false;
    }
  }

  // 检查是否全部是虚词（如"和我"、"从到"等）
  let allFunctionWords = true;
  for (const char of word) {
    if (!FUNCTION_WORDS.has(char)) {
      allFunctionWords = false;
      break;
    }
  }
  if (allFunctionWords && word.length >= 2) {
    return false;
  }

  // 检查是否包含连续的虚词（如"我了"、"的在"等）
  for (let i = 0; i < word.length - 1; i++) {
    if (FUNCTION_WORDS.has(word[i]) && FUNCTION_WORDS.has(word[i + 1])) {
      // 如果两个连续的虚词，且不在白名单中，很可能是片段
      const twoChar = word[i] + word[i + 1];
      if (twoChar === "自己" || twoChar === "现在" || twoChar === "以后" || twoChar === "以前") {
        continue;
      }
      return false;
    }
  }

  return true;
}

// 提取关键词（重新设计版）
function extractKeywords(text: string): string[] {
  // 移除标点符号和特殊字符，保留中文
  const cleaned = text
    .replace(/[，。！？、；：""''（）【】《》〈〉【】『』「」\s]/g, "")
    .trim();

  if (!cleaned || cleaned.length < 2) return [];

  const words: string[] = [];
  const charArray = cleaned.split("");
  
  // 优先匹配已知的常见词（白名单策略）
  const matchedIndices = new Set<number>();
  
  // 先匹配三字词（从长到短）
  for (let i = 0; i <= charArray.length - 3; i++) {
    const word3 = charArray.slice(i, i + 3).join("");
    if (COMMON_WORDS_3.has(word3) || isValidKeyword(word3)) {
      words.push(word3);
      matchedIndices.add(i);
      matchedIndices.add(i + 1);
      matchedIndices.add(i + 2);
    }
  }
  
  // 再匹配双字词（跳过已被匹配的位置）
  for (let i = 0; i <= charArray.length - 2; i++) {
    // 如果这个位置已经被长词匹配了，跳过（避免重复）
    if (matchedIndices.has(i) || matchedIndices.has(i + 1)) {
      continue;
    }
    
    const word2 = charArray.slice(i, i + 2).join("");
    // 优先检查白名单
    if (COMMON_WORDS_2.has(word2) || isValidKeyword(word2)) {
      words.push(word2);
    }
  }
  
  // 最后匹配四字词（较少，作为补充）
  for (let i = 0; i <= charArray.length - 4; i++) {
    // 检查是否已被匹配
    let alreadyMatched = false;
    for (let j = i; j < i + 4; j++) {
      if (matchedIndices.has(j)) {
        alreadyMatched = true;
        break;
      }
    }
    if (alreadyMatched) continue;
    
    const word4 = charArray.slice(i, i + 4).join("");
    if (isValidKeyword(word4)) {
      words.push(word4);
    }
  }

  return words;
}

export const DreamTopicCloud = ({ history, maxTopics = 15, minCount = 2 }: DreamTopicCloudProps) => {
  const topics = useMemo(() => {
    if (history.length === 0) {
      return [];
    }

    // 收集所有梦境文本中的关键词
    const keywordMap = new Map<string, number>();

    history.forEach((item) => {
      const keywords = extractKeywords(item.dream);
      keywords.forEach((keyword) => {
        keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
      });
    });

    // 转换为数组，过滤掉出现次数少于 minCount 的词，然后排序
    const topicsArray = Array.from(keywordMap.entries())
      .map(([word, count]) => ({ word, count }))
      .filter(({ count }) => count >= minCount) // 过滤低频词
      .sort((a, b) => {
        // 先按出现次数降序排序
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // 次数相同则按词长度升序（优先显示短词，更有意义）
        return a.word.length - b.word.length;
      })
      .slice(0, maxTopics);

    return topicsArray;
  }, [history, maxTopics, minCount]);

  if (history.length === 0 || topics.length === 0) {
    return (
      <Card className="p-6 bg-card/95 border border-border/50">
        <div className="text-center text-muted-foreground py-8">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">暂无数据</p>
          <p className="text-xs mt-2">记录更多梦境以查看主题分析</p>
        </div>
      </Card>
    );
  }

  // 计算最大频率用于确定字体大小
  const maxCount = Math.max(...topics.map((t) => t.count));
  const minTopicCount = Math.min(...topics.map((t) => t.count));
  const countRange = maxCount - minTopicCount || 1;

  return (
    <Card className="p-6 bg-card/95 border border-border/50">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary/70" />
          主题分析
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          根据梦境内容提取的高频关键词
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-center min-h-[200px] py-4">
        {topics.map((topic, index) => {
          // 根据频率计算字体大小 (14px - 32px)
          const fontSize = 14 + (topic.count - minTopicCount) / countRange * 18;
          // 根据频率计算透明度 (0.6 - 1.0)
          const opacity = 0.6 + (topic.count - minTopicCount) / countRange * 0.4;
          // 根据索引循环使用颜色
          const colors = [
            "hsl(var(--primary))",
            "hsl(var(--accent))",
            "hsl(217, 91%, 60%)",
            "hsl(280, 70%, 60%)",
            "hsl(350, 80%, 60%)",
            "hsl(40, 90%, 60%)",
            "hsl(160, 80%, 60%)",
          ];
          const color = colors[index % colors.length];

          return (
            <span
              key={topic.word}
              className="inline-block px-3 py-1.5 rounded-full transition-all hover:scale-110 cursor-default"
              style={{
                fontSize: `${fontSize}px`,
                color: color,
                opacity: opacity,
                backgroundColor: `${color}15`,
                border: `1px solid ${color}40`,
                fontWeight: topic.count === maxCount ? 600 : 500,
              }}
              title={`出现 ${topic.count} 次`}
            >
              {topic.word}
              <span className="ml-1.5 text-xs opacity-70">({topic.count})</span>
            </span>
          );
        })}
      </div>
    </Card>
  );
};

