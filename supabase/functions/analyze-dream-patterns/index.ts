import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DreamRecord {
  id: string;
  dream: string;
  mood: string;
  moodValue: number;
  timestamp: number;
}

// 提取关键词（简化版，用于主题分析）
function extractTopics(text: string): string[] {
  const cleaned = text.replace(/[，。！？、；：""''（）【】《》〈〉\s]/g, "");
  const topics: string[] = [];
  const charArray = cleaned.split("");
  
  // 提取2-4字词
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= charArray.length - len; i++) {
      const word = charArray.slice(i, i + len).join("");
      // 简单过滤：排除单字和常见虚词
      if (word.length >= 2 && !/^[的了我你在到]$/.test(word)) {
        topics.push(word);
      }
    }
  }
  
  return topics;
}

// 计算文本相似度（基于关键词重叠）
function calculateSimilarity(topics1: string[], topics2: string[]): number {
  if (topics1.length === 0 || topics2.length === 0) return 0;
  
  const set1 = new Set(topics1);
  const set2 = new Set(topics2);
  
  let intersection = 0;
  for (const topic of set1) {
    if (set2.has(topic)) intersection++;
  }
  
  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    // 记录请求开始
    console.log('Received request:', { method: req.method, url: req.url });
    
    let dreams;
    try {
      const body = await req.json();
      dreams = body.dreams;
      console.log('Received pattern analysis request:', { count: dreams?.length || 0 });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: '请求格式错误，请检查数据格式' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dreams || !Array.isArray(dreams) || dreams.length === 0) {
      return new Response(
        JSON.stringify({ error: '请提供梦境记录' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 至少需要2条记录才能做关联分析
    if (dreams.length < 2) {
      return new Response(
        JSON.stringify({ 
          error: '需要至少2条梦境记录才能进行关联分析',
          insights: {
            message: '继续记录梦境，积累更多数据后可以获得更深入的洞察',
            minRecords: 2,
            currentRecords: dreams.length
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API配置错误' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 主题提取和频率分析
    const topicMap = new Map<string, number>();
    const dreamTopics: { id: string; topics: string[] }[] = [];

    dreams.forEach((dream: DreamRecord) => {
      const topics = extractTopics(dream.dream);
      dreamTopics.push({ id: dream.id, topics });
      
      topics.forEach(topic => {
        topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
      });
    });

    // 获取高频主题
    const topTopics = Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count, frequency: count / dreams.length }));

    // 2. 情绪模式分析
    const moodDistribution = {
      positive: dreams.filter((d: DreamRecord) => d.moodValue > 60).length,
      neutral: dreams.filter((d: DreamRecord) => d.moodValue >= 40 && d.moodValue <= 60).length,
      negative: dreams.filter((d: DreamRecord) => d.moodValue < 40).length,
    };

    const averageMood = dreams.reduce((sum: number, d: DreamRecord) => sum + d.moodValue, 0) / dreams.length;
    
    // 情绪趋势（最近7天 vs 之前）
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentDreams = dreams.filter((d: DreamRecord) => d.timestamp >= sevenDaysAgo);
    const olderDreams = dreams.filter((d: DreamRecord) => d.timestamp < sevenDaysAgo);
    
    const recentMood = recentDreams.length > 0
      ? recentDreams.reduce((sum: number, d: DreamRecord) => sum + d.moodValue, 0) / recentDreams.length
      : averageMood;
    const olderMood = olderDreams.length > 0
      ? olderDreams.reduce((sum: number, d: DreamRecord) => sum + d.moodValue, 0) / olderDreams.length
      : averageMood;

    // 3. 梦境关联分析
    const relatedDreams: Array<{ dream1: string; dream2: string; similarity: number }> = [];
    
    for (let i = 0; i < dreamTopics.length; i++) {
      for (let j = i + 1; j < dreamTopics.length; j++) {
        const similarity = calculateSimilarity(dreamTopics[i].topics, dreamTopics[j].topics);
        if (similarity > 0.2) { // 相似度阈值
          relatedDreams.push({
            dream1: dreamTopics[i].id,
            dream2: dreamTopics[j].id,
            similarity: Math.round(similarity * 100) / 100,
          });
        }
      }
    }

    // 按相似度排序
    relatedDreams.sort((a, b) => b.similarity - a.similarity);

    // 4. 时间模式分析
    const dreamsByDay = new Map<string, number>();
    dreams.forEach((dream: DreamRecord) => {
      const date = new Date(dream.timestamp);
      const dayOfWeek = date.getDay(); // 0-6, 0是周日
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayName = dayNames[dayOfWeek];
      
      dreamsByDay.set(dayName, (dreamsByDay.get(dayName) || 0) + 1);
    });

    // 5. 调用AI生成长期洞察
    const dreamsText = dreams.map((d: DreamRecord, index: number) => 
      `梦境${index + 1}：${d.dream.substring(0, 100)}${d.dream.length > 100 ? '...' : ''}（情绪：${d.mood}）`
    ).join('\n');

    const systemPrompt = `你是一位资深的梦境分析师，擅长分析长期梦境模式和潜意识趋势。请基于用户的所有梦境记录，提供深入的长期洞察和个性化建议。

**分析重点：**
1. 识别重复出现的主题、符号和模式
2. 分析情绪变化趋势和可能的原因
3. 发现梦境之间的关联性
4. 提供个性化的自我认知建议
5. 指出值得关注的潜意识信号

**输出要求：**
- 用自然、亲切的语言，像朋友一样分享见解
- 大量使用表情符号（🌙 ✨ 💭 🔮 🧠 💡 🌟 🎭 🌈 💫）
- 字数控制在400-600字
- 结构清晰，但不要用标题，用自然过渡
- 提供具体的建议和行动方向`;

    const userPrompt = `以下是我记录的所有梦境：

${dreamsText}

**统计数据：**
- 总记录数：${dreams.length}条
- 平均情绪值：${Math.round(averageMood)}
- 高频主题：${topTopics.slice(0, 5).map(t => t.topic).join('、')}
- 情绪分布：积极${moodDistribution.positive}条，中性${moodDistribution.neutral}条，消极${moodDistribution.negative}条
- 最近情绪趋势：${recentMood > olderMood ? '上升' : recentMood < olderMood ? '下降' : '稳定'}

请为我提供全面的长期梦境分析和个性化建议。`;

    console.log('Calling OpenRouter API for pattern analysis...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dream-interpreter.lovable.app',
        'X-Title': 'Dream Chronicle',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: '分析服务暂时不可用，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse OpenRouter response:', jsonError);
      return new Response(
        JSON.stringify({ error: 'AI服务响应格式错误，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const insights = data.choices?.[0]?.message?.content || '';
    
    if (!insights || insights.trim().length === 0) {
      console.error('No insights generated from AI:', data);
      return new Response(
        JSON.stringify({ error: 'AI分析生成失败，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 构建推荐梦境（基于相似度）
    const recommendations = relatedDreams.slice(0, 5).map(rel => {
      const dream1 = dreams.find((d: DreamRecord) => d.id === rel.dream1);
      const dream2 = dreams.find((d: DreamRecord) => d.id === rel.dream2);
      return {
        dream1: dream1 ? {
          id: dream1.id,
          preview: dream1.dream.substring(0, 50) + (dream1.dream.length > 50 ? '...' : ''),
          mood: dream1.mood,
        } : null,
        dream2: dream2 ? {
          id: dream2.id,
          preview: dream2.dream.substring(0, 50) + (dream2.dream.length > 50 ? '...' : ''),
          mood: dream2.mood,
        } : null,
        similarity: rel.similarity,
        reason: `相似度${Math.round(rel.similarity * 100)}%：主题和情绪相近`,
      };
    }).filter(rec => rec.dream1 && rec.dream2);

    return new Response(
      JSON.stringify({
        insights,
        patterns: {
          topTopics,
          moodDistribution,
          averageMood: Math.round(averageMood),
          moodTrend: recentMood > olderMood ? 'up' : recentMood < olderMood ? 'down' : 'stable',
          moodChange: Math.round(Math.abs(recentMood - olderMood)),
          dreamsByDay: Array.from(dreamsByDay.entries()),
        },
        relatedDreams: recommendations,
        totalDreams: dreams.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-dream-patterns function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error) || '服务器错误，请稍后重试';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
      errorType: typeof error
    });
    
    // 确保返回的错误格式正确
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        } 
      }
    );
  }
});

