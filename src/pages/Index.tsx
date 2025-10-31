import { useState, useEffect, useMemo, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { 
  Loader2, Sparkles, Heart, Calendar as CalendarIcon, X,
  Skull, AlertTriangle, Frown, Meh, Smile, Laugh, Heart as HeartIcon,
  Cloud, CloudRain, Sun, Moon, Star, Zap, Flame, Snowflake,
  Bug, Flower, Leaf, Waves, Mountain, Droplet, Wind
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";
import MoodVisualizer from "@/components/MoodVisualizer";

interface DreamHistory {
  id: string;
  dream: string;
  mood: string;
  moodValue: number; // 0-100 的心情值
  moodColor: string; // 心情对应的颜色
  moodIcon?: string; // 心情对应的图标名称
  interpretation: string;
  timestamp: number;
}

// 心情图标配置
type MoodIconType = {
  name: string;
  component: ComponentType<{ className?: string }>;
  emoji: string;
};

const MOOD_ICONS: MoodIconType[] = [
  { name: "skull", component: Skull, emoji: "💀" },
  { name: "alert", component: AlertTriangle, emoji: "⚠️" },
  { name: "frown", component: Frown, emoji: "☹️" },
  { name: "meh", component: Meh, emoji: "😐" },
  { name: "smile", component: Smile, emoji: "😊" },
  { name: "laugh", component: Laugh, emoji: "😄" },
  { name: "heart", component: HeartIcon, emoji: "❤️" },
  { name: "cloud", component: Cloud, emoji: "☁️" },
  { name: "cloud-rain", component: CloudRain, emoji: "🌧️" },
  { name: "sun", component: Sun, emoji: "☀️" },
  { name: "moon", component: Moon, emoji: "🌙" },
  { name: "star", component: Star, emoji: "⭐" },
  { name: "zap", component: Zap, emoji: "⚡" },
  { name: "flame", component: Flame, emoji: "🔥" },
  { name: "snowflake", component: Snowflake, emoji: "❄️" },
  { name: "bug", component: Bug, emoji: "🐛" },
  { name: "flower", component: Flower, emoji: "🌸" },
  { name: "leaf", component: Leaf, emoji: "🍃" },
  { name: "waves", component: Waves, emoji: "🌊" },
  { name: "mountain", component: Mountain, emoji: "⛰️" },
  { name: "droplet", component: Droplet, emoji: "💧" },
  { name: "wind", component: Wind, emoji: "💨" },
];

// 根据心情值获取默认图标
const getDefaultIconForMood = (value: number): string => {
  if (value <= 5) return "skull";
  if (value <= 10) return "alert";
  if (value <= 15) return "frown";
  if (value <= 25) return "cloud-rain";
  if (value <= 30) return "cloud";
  if (value <= 35) return "meh";
  if (value <= 40) return "droplet";
  if (value <= 45) return "wind";
  if (value <= 50) return "moon";
  if (value <= 55) return "bug";
  if (value <= 60) return "snowflake";
  if (value <= 65) return "leaf";
  if (value <= 70) return "mountain";
  if (value <= 75) return "sun";
  if (value <= 80) return "flower";
  if (value <= 85) return "star";
  if (value <= 90) return "smile";
  if (value <= 95) return "heart";
  return "laugh";
};

// 获取图标组件
const getIconComponent = (iconName: string) => {
  const icon = MOOD_ICONS.find(i => i.name === iconName);
  return icon ? icon.component : Sparkles;
};

// 获取图标emoji
const getIconEmoji = (iconName: string) => {
  const icon = MOOD_ICONS.find(i => i.name === iconName);
  return icon ? icon.emoji : "✨";
};

// 根据心情值获取颜色和标签 - 扩展版（每5个单位一个心情）
const getMoodFromValue = (value: number, iconName?: string): { 
  label: string; 
  emoji: string; 
  icon: string;
  color: string; 
  gradient: string 
} => {
  const icon = iconName || getDefaultIconForMood(value);
  
  if (value <= 5) {
    return {
      label: "极度恐惧",
      emoji: getIconEmoji(icon),
      icon,
      color: "#7C3AED", // 深紫色
      gradient: "from-purple-700 to-purple-900"
    };
  } else if (value <= 10) {
    return {
      label: "惊恐慌乱",
      emoji: getIconEmoji(icon),
      icon,
      color: "#8B5CF6", // 紫色
      gradient: "from-purple-600 to-red-700"
    };
  } else if (value <= 15) {
    return {
      label: "恐惧害怕",
      emoji: getIconEmoji(icon),
      icon,
      color: "#A855F7", // 浅紫色
      gradient: "from-purple-500 to-red-600"
    };
  } else if (value <= 20) {
    return {
      label: "紧张不安",
      emoji: getIconEmoji(icon),
      icon,
      color: "#C084FC", // 更浅紫色
      gradient: "from-purple-400 to-pink-600"
    };
  } else if (value <= 25) {
    return {
      label: "焦虑困扰",
      emoji: getIconEmoji(icon),
      icon,
      color: "#EC4899", // 粉色
      gradient: "from-pink-600 to-purple-600"
    };
  } else if (value <= 30) {
    return {
      label: "忧虑担心",
      emoji: getIconEmoji(icon),
      icon,
      color: "#F472B6", // 浅粉色
      gradient: "from-pink-500 to-purple-500"
    };
  } else if (value <= 35) {
    return {
      label: "沉闷低落",
      emoji: getIconEmoji(icon),
      icon,
      color: "#94A3B8", // 灰蓝色
      gradient: "from-slate-400 to-blue-500"
    };
  } else if (value <= 40) {
    return {
      label: "不安烦躁",
      emoji: getIconEmoji(icon),
      icon,
      color: "#64748B", // 灰色
      gradient: "from-slate-500 to-blue-500"
    };
  } else if (value <= 45) {
    return {
      label: "困惑疑惑",
      emoji: getIconEmoji(icon),
      icon,
      color: "#7683A8", // 蓝灰色
      gradient: "from-slate-500 to-indigo-500"
    };
  } else if (value <= 50) {
    return {
      label: "平淡中性",
      emoji: getIconEmoji(icon),
      icon,
      color: "#64748B", // 灰色
      gradient: "from-slate-500 to-blue-500"
    };
  } else if (value <= 55) {
    return {
      label: "轻微忧郁",
      emoji: getIconEmoji(icon),
      icon,
      color: "#60A5FA", // 浅蓝色
      gradient: "from-blue-400 to-slate-500"
    };
  } else if (value <= 60) {
    return {
      label: "悲伤难过",
      emoji: getIconEmoji(icon),
      icon,
      color: "#3B82F6", // 蓝色
      gradient: "from-blue-500 to-slate-500"
    };
  } else if (value <= 65) {
    return {
      label: "平静温和",
      emoji: getIconEmoji(icon),
      icon,
      color: "#22C55E", // 绿色
      gradient: "from-green-500 to-emerald-500"
    };
  } else if (value <= 70) {
    return {
      label: "平静安详",
      emoji: getIconEmoji(icon),
      icon,
      color: "#10B981", // 绿色
      gradient: "from-green-500 to-emerald-500"
    };
  } else if (value <= 75) {
    return {
      label: "舒适放松",
      emoji: getIconEmoji(icon),
      icon,
      color: "#34D399", // 浅绿色
      gradient: "from-green-400 to-teal-500"
    };
  } else if (value <= 80) {
    return {
      label: "轻松愉快",
      emoji: getIconEmoji(icon),
      icon,
      color: "#FBBF24", // 金色
      gradient: "from-yellow-400 to-orange-400"
    };
  } else if (value <= 85) {
    return {
      label: "开心愉快",
      emoji: getIconEmoji(icon),
      icon,
      color: "#F59E0B", // 橙色
      gradient: "from-orange-400 to-yellow-400"
    };
  } else if (value <= 90) {
    return {
      label: "非常开心",
      emoji: getIconEmoji(icon),
      icon,
      color: "#FCD34D", // 浅金色
      gradient: "from-yellow-300 to-orange-300"
    };
  } else if (value <= 95) {
    return {
      label: "极度愉悦",
      emoji: getIconEmoji(icon),
      icon,
      color: "#FBBF24", // 金色
      gradient: "from-yellow-400 to-amber-400"
    };
  } else {
    return {
      label: "兴奋狂喜",
      emoji: getIconEmoji(icon),
      icon,
      color: "#FCD34D", // 浅金色
      gradient: "from-yellow-300 to-amber-300"
    };
  }
};

// Hex 颜色转 rgba 字符串
const hexToRgba = (hex: string, alpha: number): string => {
  const value = hex.replace('#', '');
  const bigint = parseInt(value.length === 3 ? value.split('').map(c => c + c).join('') : value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 获取心情颜色的渐变
const getMoodGradient = (value: number, iconName?: string): string => {
  const mood = getMoodFromValue(value, iconName);
  return mood.gradient;
};

// 获取心情颜色
const getMoodColor = (value: number, iconName?: string): string => {
  const mood = getMoodFromValue(value, iconName);
  return mood.color;
};

// 格式化解读文本，去除 Markdown 格式并改善排版
const formatInterpretation = (text: string): { sections: { title?: string; content: string }[] } => {
  if (!text) return { sections: [] };

  // 去除常见的 Markdown 符号
  let cleaned = text
    .replace(/^#{1,6}\s+/gm, "") // 去除标题标记 (#)
    .replace(/\*\*(.*?)\*\*/g, "$1") // 去除粗体标记 (**)
    .replace(/\*(.*?)\*/g, "$1") // 去除斜体标记 (*)
    .replace(/~~(.*?)~~/g, "$1") // 去除删除线标记
    .replace(/`(.*?)`/g, "$1") // 去除代码标记
    .replace(/^\s*[-*+]\s+/gm, "") // 去除列表标记
    .replace(/^\s*\d+\.\s+/gm, "") // 去除有序列表标记
    .trim();

  // 按数字分段（如 "1. **玄学角度**" 或 "1. 玄学角度"）
  const sections: { title?: string; content: string }[] = [];
  const lines = cleaned.split("\n");
  let currentSection: { title?: string; content: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      // 空行作为段落分隔
      if (currentSection && currentSection.content) {
        currentSection.content += "\n\n";
      }
      continue;
    }

    // 检查是否是标题行（包含"角度"、"解读"、"分析"等关键词，或数字开头）
    const titlePattern = /^[一二三四五六七八九十\d]+[\.、．]?\s*(.*角度|.*解读|.*分析|.*视角|.*心理学|.*玄学)/;
    const simpleNumberPattern = /^[一二三四五六七八九十\d]+[\.、．]\s*(.{0,20})$/;
    
    const isTitle = titlePattern.test(trimmedLine) || 
                   (simpleNumberPattern.test(trimmedLine) && trimmedLine.length < 30);

    if (isTitle) {
      // 保存前一个段落
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      // 提取标题（去除数字和符号）
      const title = trimmedLine
        .replace(/^[一二三四五六七八九十\d]+[\.、．]?\s*/, "")
        .replace(/^[*•-]\s*/, "")
        .replace(/^\*\*/, "")
        .replace(/\*\*$/, "")
        .trim();
      
      // 如果标题太长，可能是内容而不是标题
      if (title.length > 40 || (!title.includes("角度") && !title.includes("解读") && !title.includes("分析"))) {
        // 当作内容处理
        if (currentSection) {
          currentSection.content += (currentSection.content ? "\n\n" : "") + trimmedLine;
        } else {
          currentSection = { content: trimmedLine };
        }
      } else {
        currentSection = { title, content: "" };
      }
    } else {
      // 清理内容行
      const cleanedLine = trimmedLine
        .replace(/^[*•-]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .trim();
      
      if (currentSection) {
        currentSection.content += (currentSection.content && !currentSection.content.endsWith("\n\n") ? "\n\n" : "") + cleanedLine;
      } else {
        // 如果没有当前段落，创建一个
        currentSection = { content: cleanedLine };
      }
    }
  }

  // 添加最后一个段落
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // 如果没有分段，返回整段文本
  if (sections.length === 0) {
    sections.push({ content: cleaned });
  }

  // 清理每个段落的内容
  sections.forEach(section => {
    section.content = section.content
      .replace(/\n{3,}/g, "\n\n") // 多个换行合并为两个
      .trim();
  });

  return { sections };
};

const Index = () => {
  const [dream, setDream] = useState("");
  const [moodValue, setMoodValue] = useState<number[]>([50]); // 默认中性心情
  const [selectedMoodIcon, setSelectedMoodIcon] = useState<string | undefined>(undefined); // 选中的图标
  const [showIconPicker, setShowIconPicker] = useState(false); // 是否显示图标选择器
  const [interpretation, setInterpretation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<DreamHistory[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem("dreamHistory");
    if (saved) {
      const parsed = JSON.parse(saved);
      // 迁移旧数据格式
      const migrated = parsed.map((item: any) => {
        if (!item.moodValue || !item.moodColor) {
          // 兼容旧数据，根据 mood 文本推断
          let moodValue = 50;
          if (item.mood === "开心愉快") moodValue = 85;
          else if (item.mood === "焦虑不安") moodValue = 30;
          else if (item.mood === "悲伤难过") moodValue = 55;
          else if (item.mood === "恐惧害怕") moodValue = 15;
          else if (item.mood === "平静安详") moodValue = 70;
          else if (item.mood === "困惑疑惑") moodValue = 45;
          
          return {
            ...item,
            moodValue,
            moodColor: getMoodColor(moodValue)
          };
        }
        return item;
      });
      setHistory(migrated);
      localStorage.setItem("dreamHistory", JSON.stringify(migrated));
    }
  }, []);

  // 获取有记录的日期集合（格式：YYYY-MM-DD）及其心情颜色
  const datesWithRecords = useMemo(() => {
    const datesMap = new Map<string, { color: string; value: number; timestamp: number }>();
    history.forEach((item) => {
      const date = format(new Date(item.timestamp), "yyyy-MM-dd");
      // 如果同一天有多条记录，使用最新记录的心情
      const existing = datesMap.get(date);
      if (!existing || item.timestamp > existing.timestamp) {
        datesMap.set(date, {
          color: item.moodColor || getMoodColor(item.moodValue || 50),
          value: item.moodValue || 50,
          timestamp: item.timestamp
        });
      }
    });
    return datesMap;
  }, [history]);

  // 获取特定日期的心情颜色
  const getDateMoodColor = (date: Date): string | null => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = datesWithRecords.get(dateStr);
    return record ? record.color : null;
  };

  // 日历日期修饰符
  const modifiers = useMemo(() => ({
    hasRecord: (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return datesWithRecords.has(dateStr);
    },
  }), [datesWithRecords]);

  // 动态生成日期样式类名
  const getDayClassName = (date: Date): string => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = datesWithRecords.get(dateStr);
    if (record) {
      return `relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full`;
    }
    return "";
  };

  const modifiersClassNames = {
    hasRecord: "relative",
  };

  // 获取选中日期的记录
  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return history.filter((item) => {
      const itemDateStr = format(new Date(item.timestamp), "yyyy-MM-dd");
      return itemDateStr === dateStr;
    });
  }, [selectedDate, history]);

  const showRecordsPanel = selectedDate && selectedDateRecords.length > 0;

  // 控制记录面板的进入动画
  const [panelVisible, setPanelVisible] = useState(false);
  useEffect(() => {
    if (showRecordsPanel) {
      // 下一帧再显示，保证过渡效果从 0 -> 1
      const id = requestAnimationFrame(() => setPanelVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setPanelVisible(false);
  }, [showRecordsPanel]);

  // 处理日期点击
  const handleDayClick = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    const hasRecords = datesWithRecords.has(dateStr);
    
    // 如果点击的是当前选中的日期，取消选择
    if (selectedDate && format(selectedDate, "yyyy-MM-dd") === dateStr) {
      setSelectedDate(undefined);
      return;
    }
    
    // 如果点击的日期有记录，选中它
    if (hasRecords) {
      setSelectedDate(date);
    } else {
      // 如果点击的日期没有记录，清空选择
      setSelectedDate(undefined);
    }
  };

  const saveToHistory = (dream: string, moodValue: number, interpretation: string, iconName?: string) => {
    const moodInfo = getMoodFromValue(moodValue, iconName);
    const newEntry: DreamHistory = {
      id: Date.now().toString(),
      dream,
      mood: moodInfo.label,
      moodValue,
      moodColor: moodInfo.color,
      moodIcon: moodInfo.icon,
      interpretation,
      timestamp: Date.now(),
    };
    const newHistory = [newEntry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("dreamHistory", JSON.stringify(newHistory));
  };

  const handleSubmit = async () => {
    if (!dream.trim() || moodValue[0] === undefined) {
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
      const moodInfo = getMoodFromValue(moodValue[0], selectedMoodIcon);
      const { data, error } = await supabase.functions.invoke("interpret-dream", {
        body: { dream: dream.trim(), mood: moodInfo.label },
      });

      if (error) throw error;

      if (data.interpretation) {
        setInterpretation(data.interpretation);
        saveToHistory(dream, moodValue[0], data.interpretation, selectedMoodIcon);
        toast({
          title: "解梦完成",
          description: "已为您生成梦境解读",
        });
      } else {
        throw new Error("解读结果为空");
      }
    } catch (error) {
      console.error("Error:", error);
      const message = error instanceof Error ? error.message : String(error ?? "");
      toast({
        title: "解梦失败",
        description: message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDream("");
    setMoodValue([50]);
    setSelectedMoodIcon(undefined);
    setShowIconPicker(false);
    setInterpretation("");
  };

  // 当前心情信息
  const currentMood = useMemo(() => {
    return getMoodFromValue(moodValue[0], selectedMoodIcon);
  }, [moodValue, selectedMoodIcon]);

  const deleteHistory = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("dreamHistory", JSON.stringify(newHistory));
    
    // 如果删除后该日期没有记录了，关闭面板
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const hasRemainingRecords = newHistory.some((item) => {
        const itemDateStr = format(new Date(item.timestamp), "yyyy-MM-dd");
        return itemDateStr === dateStr;
      });
      if (!hasRemainingRecords) {
        setSelectedDate(undefined);
      }
    }
  };

  return (
    <div className="min-h-screen mystical-background relative overflow-hidden">

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Header */}
        <header className="text-center mb-20 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Sparkles className="w-6 h-6 text-primary/60" />
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              夜梦录 · DreamChronicle
            </h1>
            <Sparkles className="w-6 h-6 text-primary/60" />
          </div>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed tracking-tight">
            让每一次梦境，都有迹可循
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto md:flex md:gap-6 items-start">
          {/* Left column: compact calendar (desktop only) */}
          <div className="hidden md:block md:w-[320px]">
            <div className="flex flex-col items-start gap-2 my-2">
              <Calendar
                locale={zhCN}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                selected={selectedDate}
                onSelect={handleDayClick}
                mode="single"
                className="rounded-xl text-xs shadow bg-card/80 p-2 [&_table]:my-0 [&_th]:py-1 [&_td]:py-0 [&_td]:px-1 [&_button]:h-7 [&_button]:w-7 min-w-[280px]"
                components={{
                  Day: (props: any) => {
                    const { date, onClick, className, ...restProps } = props;
                    const dateStr = format(date, "yyyy-MM-dd");
                    const record = datesWithRecords.get(dateStr);
                    const clickable = Boolean(record);
                    const dayStyle: Record<string, string | number> = {};
                    if (record) {
                      dayStyle.color = record.color;
                      dayStyle.fontWeight = 600;
                    }
                    const handleClick = (e: any) => {
                      if (typeof onClick === 'function') onClick(e);
                      if (record) handleDayClick(date);
                    };
                    return (
                      <button
                        {...restProps}
                        onClick={handleClick}
                        className={`${className} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                        style={Object.keys(dayStyle).length > 0 ? dayStyle : undefined}
                        aria-label={format(date, 'yyyy-MM-dd')}
                      >
                        <span className="relative z-10">{format(date, 'd')}</span>
                        {record && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: record.color }} aria-hidden="true" />
                        )}
                      </button>
                    );
                  },
                }}
              />
              {/* Records under calendar (desktop) */}
              <div className={`transition-all duration-300 ease-out ${showRecordsPanel ? 'max-h-[480px] opacity-100 mt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                {showRecordsPanel && (
                  <Card className={`p-4 md:p-5 border border-border/50 bg-card/95 shadow-sm transition-all duration-300 ${panelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary">
                        {format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })} 的记录
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedDate(undefined)}>
                        关闭
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {selectedDateRecords.map((item) => (
                        <div key={item.id} className="p-3 rounded bg-muted border border-border/50">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span>{item.mood}</span>
                            <Button variant="ghost" size="sm" onClick={() => deleteHistory(item.id)} className="h-6 px-2 text-destructive">删除</Button>
                          </div>
                          <div className="mb-1 text-xs text-muted-foreground">梦境：{item.dream}</div>
                          <div className="mb-1 text-xs text-muted-foreground">解读：
                            <div>{formatInterpretation(item.interpretation).sections.map((section)=> <div key={section.title}>{section.title && <b>{section.title}</b>}{section.content}</div>)}</div>
                          </div>
                        </div>
                      ))}
          </div>
            </Card>
                )}
              </div>
            </div>
          </div>

          {/* Right column: mood + dream + submit */}
          <div className="flex-1 space-y-8">
          {/* 先显示心情选择（合并为紧凑单卡片） */}
                <div className="space-y-3">
            <label className="sr-only">醒来后的心情</label>
            <div className="rounded-2xl border border-white/8 bg-black/15 backdrop-blur-sm p-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/25 border border-white/10 hover:border-primary/40 transition-all"
                  title="选择图标"
                >
                  {(() => {
                    const IconComponent = getIconComponent(currentMood.icon);
                    return <IconComponent className="w-5 h-5 text-primary/70" />;
                  })()}
                </button>
                <div className="min-w-0 flex-1">
                  {/* 中心可视化（灵感源于苹果心情花瓣） */}
                  <div className="flex items-center justify-center py-4">
                    <MoodVisualizer value={moodValue[0]} color={currentMood.color} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-tight truncate">{currentMood.label}</div>
                    <div className="text-xs text-muted-foreground ml-3 shrink-0">{moodValue[0]}/100</div>
                  </div>
                  <div className="relative mt-2">
                    <div
                      className="absolute inset-0 h-4 rounded-full"
                      style={{
                        background: (() => {
                          const percent = Math.max(0, Math.min(100, moodValue[0] ?? 0));
                          const active = currentMood.color;
                          const inactive = hexToRgba('#FFFFFF', 0.08);
                          return `linear-gradient(to right, ${active} 0%, ${active} ${percent}%, ${inactive} ${percent}%, ${inactive} 100%)`;
                        })()
                      }}
                    />
                    <Slider
                      value={moodValue}
                      onValueChange={setMoodValue}
                      min={0}
                      max={100}
                      step={1}
                      disabled={isLoading}
                      className="relative z-10 [&>div]:h-4 [&>div>div]:bg-transparent [&>div>div>div]:bg-transparent"
                    />
                    <div className="absolute -top-5 left-0 text-[11px] text-muted-foreground select-none">😨</div>
                    <div className="absolute -top-5 right-0 text-[11px] text-muted-foreground select-none">😄</div>
                  </div>
                </div>
                <div className="text-xl leading-none ml-1">{currentMood.emoji}</div>
              </div>
              {showIconPicker && (
                <div className="mt-3 p-3 rounded-xl bg-black/25 border border-white/8">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">选择图标</div>
                  <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                    {MOOD_ICONS.map((icon) => {
                      const IconComponent = icon.component;
                      const isSelected = currentMood.icon === icon.name;
                      return (
                        <button
                          key={icon.name}
                          type="button"
                          onClick={() => {
                            setSelectedMoodIcon(icon.name);
                            setShowIconPicker(false);
                          }}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                            isSelected ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/20 hover:border-primary/30'
                          }`}
                          title={icon.name}
                        >
                          <IconComponent className={`w-4 h-4 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="text-[10px]">{icon.emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* 梦境描述输入区 */}
          <div className="space-y-4">
            <label className="text-base font-medium flex items-center gap-2.5 tracking-tight">
              <Sparkles className="w-4 h-4 text-primary/70" /> 请描述您昨晚的梦境
                  </label>
                  <Textarea
                    placeholder="在这里输入您的梦境... 例如：我梦见自己在天空中飞翔..."
                    value={dream}
                    onChange={(e) => setDream(e.target.value)}
              className="min-h-[160px] resize-none bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-300 placeholder:text-muted-foreground/50 text-[15px] leading-relaxed"
                    disabled={isLoading}
                  />
                </div>
          {/* Mobile calendar (below content) */}
          <div className="md:hidden flex flex-col items-start gap-2 my-6">
            <Calendar
              locale={zhCN}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              selected={selectedDate}
              onSelect={handleDayClick}
              mode="single"
              className="rounded-xl text-xs shadow bg-card/80 p-2 [&_table]:my-0 [&_th]:py-1 [&_td]:py-0 [&_td]:px-1 [&_button]:h-7 [&_button]:w-7 min-w-fit"
              components={{
                Day: (props: any) => {
                  const { date, onClick, className, ...restProps } = props;
                  const dateStr = format(date, "yyyy-MM-dd");
                  const record = datesWithRecords.get(dateStr);
                  const clickable = Boolean(record);
                  const dayStyle: Record<string, string | number> = {};
                  if (record) {
                    dayStyle.color = record.color;
                    dayStyle.fontWeight = 600;
                  }
                  const handleClick = (e: any) => {
                    if (typeof onClick === 'function') onClick(e);
                    if (record) handleDayClick(date);
                  };
                  return (
                      <button
                      {...restProps}
                      onClick={handleClick}
                      className={`${className} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                      style={Object.keys(dayStyle).length > 0 ? dayStyle : undefined}
                      aria-label={format(date, 'yyyy-MM-dd')}
                    >
                      <span className="relative z-10">{format(date, 'd')}</span>
                      {record && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: record.color }} aria-hidden="true" />
                      )}
                      </button>
                  );
                },
              }}
            />
            {/* 平滑展开的当天记录卡片 ... 用 showRecordsPanel/panelVisible+动画过渡 ... */}
            <div className={`transition-all duration-300 ease-out ${showRecordsPanel ? 'max-h-[480px] opacity-100 mt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              {showRecordsPanel && (
                <Card className={`p-4 md:p-5 border border-border/50 bg-card/95 shadow-sm transition-all duration-300 ${panelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">
                      {format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })} 的记录
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedDate(undefined)}>
                      关闭
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {selectedDateRecords.map((item) => (
                      <div key={item.id} className="p-3 rounded bg-muted border border-border/50">
                        {/* 心情、梦境、解读 显示同现有样式... */}
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span>{item.mood}</span>
                          <Button variant="ghost" size="sm" onClick={() => deleteHistory(item.id)} className="h-6 px-2 text-destructive">删除</Button>
                        </div>
                        <div className="mb-1 text-xs text-muted-foreground">梦境：{item.dream}</div>
                        <div className="mb-1 text-xs text-muted-foreground">解读：
                          <div>{formatInterpretation(item.interpretation).sections.map((section)=> <div key={section.title}>{section.title && <b>{section.title}</b>}{section.content}</div>)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
                  </div>
                </div>
          {/* Mobile calendar end */}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
            disabled={isLoading || !dream.trim() || moodValue[0] === undefined}
            className="w-full h-14 text-base font-medium btn-primary-elegant disabled:opacity-40 disabled:cursor-not-allowed tracking-tight"
                >
                  {isLoading ? (
                    <>
                <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                      解读中...
                    </>
                  ) : (
                    <>
                <Sparkles className="mr-2.5 h-5 w-5" />
                      开始解梦
                    </>
                  )}
                </Button>
          </div>
              </div>
      {/* 解梦结果卡片等 */}
      {interpretation && (
        <Card className="p-8 md:p-10 glass-card animate-fade-in">
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary/70" />
                梦境解读
              </h2>
              <Button 
                variant="ghost" 
                onClick={handleReset} 
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300"
              >
                    再解一梦
                  </Button>
                </div>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">您的梦境</div>
                <p className="text-foreground/90 text-[15px] leading-relaxed">{dream}</p>
                  </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/3 to-primary/5 border border-primary/10">
                <div className="space-y-8">
                  {formatInterpretation(interpretation).sections.map((section, index) => (
                    <div key={index} className="space-y-4">
                      {section.title && (
                        <div className="flex items-center gap-3 pb-3 border-b border-primary/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          <h3 className="text-lg font-semibold text-primary/90 tracking-tight">
                            {section.title}
                          </h3>
                        </div>
                      )}
                      <div className="text-foreground/90 leading-relaxed text-[15px] space-y-3">
                        {section.content.split(/\n\n+/).map((paragraph, pIndex) => (
                          paragraph.trim() && (
                            <p key={pIndex} className="indent-0 first:mt-0 tracking-tight">
                              {paragraph.trim()}
                            </p>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
            </Card>
          )}
        </div>
      </div>
  );
}

export default Index;
