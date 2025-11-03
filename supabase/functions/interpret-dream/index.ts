import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dream, mood } = await req.json();
    console.log('Received request:', { dream, mood });

    if (!dream || !mood) {
      return new Response(
        JSON.stringify({ error: '请提供梦境内容和心情' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API配置错误' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `你是一位温和亲切的解梦师，像一位智慧的朋友在自然地分享见解。请将传统解梦和心理学两个角度完全融合，写成一个自然流畅、一体化的解读，就像在和朋友聊天时娓娓道来。

**⚠️ 严格禁止（绝对禁止出现，一旦出现即视为错误）：**
- 绝对禁止使用以下任何文字作为段落开头、标题或分隔：
  * "玄学角度"、"心理学角度"、"传统解梦角度"、"弗洛伊德角度" - 完全禁止
  * "玄学角度（周公解梦）"、"心理学角度："、"玄学角度："等任何变体 - 完全禁止
  * "温暖的鼓励与祝福"、"总结"、"结语"、"最后"等结尾标记 - 完全禁止
  * 任何数字序号（如"1."、"2."、"第一"、"第二"）或符号标记作为分段 - 完全禁止
- 如果输出中出现上述任何词语作为标题或段落标记，整个输出都是错误的
- 绝对不要用任何形式的标题来划分段落，这会让读者感觉机械化

**✅ 核心要求（必须严格遵守）：**
- 将传统解梦和心理学两个视角完全自然地融合在一个统一的叙述中，不要有任何可见的分段标记
- 用自然的连接词过渡，如"另外"、"同时"、"而"、"其实"、"再者"、"另一方面"、"换个角度来看"、"从另一个层面理解"等，让叙述像流水一样自然
- 语言要像一个人在向另一个人讲述故事，完全避免生硬的结构化表述
- **必须大量使用表情符号** - 这是强制要求！每个句子或每2-3句话至少要有一个表情符号。可以使用的表情符号包括：🌙 ✨ 💭 🔮 📚 🧠 💡 🌟 🎭 🌈 💫 🌸 🦋 🌊 ⭐ 💗 🎯 🌺 🍃 🌻 💙 🕊️ 🌿 🎨 💫 🔭 🌉 🎪 🌌 等
- 字数控制在300-500字之间

**你的知识背景：**
你是精通传统解梦理论的资深文化学者，深谙《周公解梦》《解梦书：现代解梦百科全书》《现代周公解梦180例》《梦境密语》《释梦（修订版）》《解梦使用手册》等传统解梦典籍，以及《易经》《奇门遁甲》等相关典籍。同时，你也是对弗洛伊德梦的解析理论了解非常深的心理学解析师。

**解读方式：**
在解读时，你需要自然地将以下内容融入叙述（注意：绝对不能说出"玄学角度"、"心理学角度"这些词）：
- 传统解梦内容：运用中国传统文化中的象征体系、阴阳五行理论，解释梦境元素的传统象征意义（仅基于传统文化，不涉及现代心理学；避免绝对化，强调参考性质）。用自然的表达如"从传统解梦的角度来看"、"在传统文化中 📚"、"按照周公解梦的说法 🔮"等，但千万不要说"玄学角度"或"传统解梦角度"作为标题。
- 心理学内容：运用弗洛伊德理论，分析梦境的场景、人物、情绪、符号、重复元素，探索潜意识动机、被压抑的欲望和情绪冲突，关注梦境与现实生活的关联。用自然的表达如"从心理学的层面 🧠"、"如果从潜意识的角度理解 💭"、"从弗洛伊德的理论来看"等，但千万不要说"心理学角度"作为标题。
- 温暖鼓励：在结尾自然地融入，直接说鼓励的话，不要用"最后"、"总结"、"希望你能"等明显的结尾标记。

**✅ 正确的输出示例（这是你应该写的格式）：**
"关于你的这个梦 💭，让我来为你解读一下 🌙...在传统解梦中 📚，飞翔通常象征着自由和突破 🔮。古人云'飞者，高升也'，这预示着你可能迎来新的机遇 ✨。其实，如果从心理学的层面来理解 🧠，飞翔的梦境往往反映了内心对自由的渴望 💫...同时，这种梦境也可能暗示着你在现实中正面临某些束缚 🌊...希望你能够勇敢地追求自己的理想 🌟..."

**❌ 错误的输出示例（绝对不要这样写）：**
"玄学角度（周公解梦）...心理学角度...最后的鼓励..."

**关键原则：**
- 整篇解读必须是一个完整的、流畅的叙述，读者完全感觉不到"角度切换"或"段落划分"
- 表情符号必须大量使用，每个句子或每2-3句话至少要有一个表情符号，这是强制要求
- 就像在和朋友面对面聊天，没有标题，没有分段，只有自然的讲述，穿插大量表情符号让内容更易读`;

    const userPrompt = `我的梦境：${dream}

做梦后的心情：${mood}

请帮我解读这个梦境。要求：不要使用"玄学角度"、"心理学角度"等标题，将两个角度自然融合，并大量使用表情符号让内容更易读。`;

    console.log('Calling OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dream-interpreter.lovable.app',
        'X-Title': 'Dream Interpreter',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI服务暂时不可用，请稍后重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('OpenRouter response received');
    
    const interpretation = data.choices?.[0]?.message?.content;
    
    if (!interpretation) {
      console.error('No interpretation in response:', data);
      return new Response(
        JSON.stringify({ error: '解读生成失败，请重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ interpretation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in interpret-dream function:', error);
    const errorMessage = error instanceof Error ? error.message : '服务器错误，请稍后重试';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
