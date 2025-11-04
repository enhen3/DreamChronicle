import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, ChevronLeft, Sparkles, Users, MapPin, 
  Palette, Music, Heart, Clock, Cloud, X, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface StructuredDream {
  mainContent: string;
  people: string[];
  places: string[];
  objects: string[];
  actions: string[];
  colors: string[];
  sounds: string[];
  emotions: string[];
  timeOfDream?: string;
  weather?: string;
  ending?: string;
}

interface DreamTemplateProps {
  onComplete: (structuredDream: StructuredDream, fullText: string) => void;
  onCancel: () => void;
}

const TEMPLATE_STEPS = [
  {
    id: 1,
    title: "核心场景",
    icon: Sparkles,
    questions: [
      {
        id: "mainContent",
        label: "梦境中最主要的场景是什么？发生了什么关键事件？",
        placeholder: "例如：我在天空中飞翔，穿过了一片原始森林...",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: 2,
    title: "人物与地点",
    icon: Users,
    questions: [
      {
        id: "people",
        label: "梦境中出现了哪些人？",
        placeholder: "用逗号分隔，例如：朋友张三, 陌生人, 模糊的人影",
        type: "tags",
        required: false,
      },
      {
        id: "places",
        label: "梦境发生在什么地方？",
        placeholder: "例如：森林, 海边, 学校, 家里",
        type: "tags",
        required: false,
      },
    ],
  },
  {
    id: 3,
    title: "物品与动作",
    icon: MapPin,
    questions: [
      {
        id: "objects",
        label: "梦境中有哪些特别的物品或符号？",
        placeholder: "例如：钥匙, 花朵, 镜子, 书本",
        type: "tags",
        required: false,
      },
      {
        id: "actions",
        label: "你或其他人做了什么主要动作？",
        placeholder: "例如：飞翔, 奔跑, 对话, 观察",
        type: "tags",
        required: false,
      },
    ],
  },
  {
    id: 4,
    title: "感官细节",
    icon: Palette,
    questions: [
      {
        id: "colors",
        label: "梦境中有哪些特别的颜色？",
        placeholder: "例如：蓝色, 绿色, 金色, 灰色",
        type: "tags",
        required: false,
      },
      {
        id: "sounds",
        label: "你听到了什么声音？",
        placeholder: "例如：鸟鸣, 海浪声, 音乐, 寂静",
        type: "tags",
        required: false,
      },
    ],
  },
  {
    id: 5,
    title: "情绪与感受",
    icon: Heart,
    questions: [
      {
        id: "emotions",
        label: "在梦中你感觉如何？醒来后的第一感觉是什么？",
        placeholder: "例如：快乐, 恐惧, 平静, 紧张, 兴奋",
        type: "tags",
        required: false,
      },
    ],
  },
  {
    id: 6,
    title: "其他细节",
    icon: Clock,
    questions: [
      {
        id: "timeOfDream",
        label: "梦境中的时间是？",
        placeholder: "例如：白天, 夜晚, 黄昏, 清晨",
        type: "input",
        required: false,
      },
      {
        id: "weather",
        label: "梦境中的天气如何？",
        placeholder: "例如：晴天, 雨天, 阴天, 雾天",
        type: "input",
        required: false,
      },
      {
        id: "ending",
        label: "梦境是如何结束的？",
        placeholder: "例如：自然醒来, 被惊醒, 梦境转换",
        type: "input",
        required: false,
      },
    ],
  },
];

export const DreamTemplate = ({ onComplete, onCancel }: DreamTemplateProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<StructuredDream>>({
    mainContent: "",
    people: [],
    places: [],
    objects: [],
    actions: [],
    colors: [],
    sounds: [],
    emotions: [],
  });

  const currentStepData = TEMPLATE_STEPS[currentStep];
  const isLastStep = currentStep === TEMPLATE_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleInputChange = (questionId: string, value: string) => {
    if (questionId === "mainContent" || questionId === "timeOfDream" || questionId === "weather" || questionId === "ending") {
      setFormData((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    }
  };

  const handleTagInput = (questionId: string, value: string) => {
    // 将逗号分隔的字符串转换为数组
    const tags = value
      .split(/[,，、]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setFormData((prev) => ({
      ...prev,
      [questionId]: tags,
    }));
  };

  const handleNext = () => {
    if (currentStep < TEMPLATE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // 验证必填项
    if (!formData.mainContent || formData.mainContent.trim().length === 0) {
      return;
    }
    
    // 生成完整的梦境描述文本
    const fullText = generateDreamText(formData as StructuredDream);
    onComplete(formData as StructuredDream, fullText);
  };

  const generateDreamText = (data: StructuredDream): string => {
    let text = data.mainContent || "";

    // 如果只有核心内容，直接返回
    const hasAdditionalInfo = 
      (data.people && data.people.length > 0) ||
      (data.places && data.places.length > 0) ||
      (data.objects && data.objects.length > 0) ||
      (data.actions && data.actions.length > 0) ||
      (data.colors && data.colors.length > 0) ||
      (data.sounds && data.sounds.length > 0) ||
      (data.emotions && data.emotions.length > 0) ||
      data.timeOfDream ||
      data.weather ||
      data.ending;

    if (!hasAdditionalInfo) {
      return text.trim();
    }

    // 添加补充信息（更自然的表述）
    const details: string[] = [];

    // 添加人物
    if (data.people && data.people.length > 0) {
      details.push(`梦中出现了${data.people.join("、")}`);
    }

    // 添加地点
    if (data.places && data.places.length > 0) {
      details.push(`场景发生在${data.places.join("、")}`);
    }

    // 添加物品
    if (data.objects && data.objects.length > 0) {
      details.push(`有${data.objects.join("、")}等物品`);
    }

    // 添加动作
    if (data.actions && data.actions.length > 0) {
      details.push(`我${data.actions.join("、")}`);
    }

    // 添加颜色
    if (data.colors && data.colors.length > 0) {
      details.push(`充满了${data.colors.join("、")}等颜色`);
    }

    // 添加声音
    if (data.sounds && data.sounds.length > 0) {
      details.push(`听到了${data.sounds.join("、")}`);
    }

    // 添加情绪
    if (data.emotions && data.emotions.length > 0) {
      details.push(`感到${data.emotions.join("、")}`);
    }

    // 添加其他细节
    if (data.timeOfDream) {
      details.push(`时间是${data.timeOfDream}`);
    }
    if (data.weather) {
      details.push(`天气是${data.weather}`);
    }
    if (data.ending) {
      details.push(`梦境以${data.ending}的方式结束`);
    }

    // 将补充信息自然融入主文本
    if (details.length > 0) {
      text += " " + details.join("，") + "。";
    }

    return text.trim();
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return formData.mainContent && formData.mainContent.trim().length > 0;
    }
    return true; // 其他步骤都是可选的
  };

  return (
    <Card className="p-6 bg-card/95 border border-border/50 backdrop-blur-sm">
      {/* 进度指示 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            步骤 {currentStep + 1} / {TEMPLATE_STEPS.length}
          </span>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TEMPLATE_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 当前步骤内容 */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <currentStepData.icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
        </div>

        <div className="space-y-4">
          {currentStepData.questions.map((question) => {
            if (question.type === "textarea") {
              return (
                <div key={question.id} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {question.label}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <Textarea
                    value={
                      question.id === "mainContent"
                        ? formData.mainContent || ""
                        : ""
                    }
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    className="min-h-[120px] resize-none"
                  />
                </div>
              );
            }

            if (question.type === "tags") {
              const tags = (formData[question.id as keyof StructuredDream] as string[]) || [];
              const inputValue = tags.join("、");

              return (
                <div key={question.id} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {question.label}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <Input
                    value={inputValue}
                    onChange={(e) => handleTagInput(question.id, e.target.value)}
                    placeholder={question.placeholder}
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (question.type === "input") {
              return (
                <div key={question.id} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {question.label}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <Input
                    value={
                      (formData[question.id as keyof StructuredDream] as string) || ""
                    }
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          上一步
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleComplete}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            完成并生成描述
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

