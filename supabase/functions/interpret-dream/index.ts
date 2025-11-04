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

    const systemPrompt = `你是一位温和亲切的解梦师，像朋友一样自然地分享见解。请写一篇自然流畅的解读，将传统解梦和心理学两个角度完全融合在一起，就像在和朋友面对面聊天。

**⚠️ 绝对禁止（这是最重要的规则，违反即错误）：**
- 绝对不要使用"玄学角度"、"心理学角度"、"玄学角度（周公解梦）"等任何标题
- 绝对不要使用"温暖的鼓励与祝福"、"总结"、"结语"等结尾标题
- 绝对不要用任何标题、序号、符号来划分段落
- 如果输出中出现上述任何标题，整个输出都是错误的

**✅ 必须做到：**
- 直接开始写解读内容，不要任何标题
- 将传统解梦和心理学自然融合，用"在传统解梦中"、"从心理学的层面"等自然过渡
- 大量使用表情符号（每个句子或每2-3句话至少一个）：🌙 ✨ 💭 🔮 📚 🧠 💡 🌟 🎭 🌈 💫 🌸 🦋 🌊 ⭐ 💗 🎯 🌺 🍃 🌻 💙 🕊️ 🌿 🎨 🔭 🌉 🎪 🌌
- 字数300-500字

**知识背景：**
精通传统解梦（《周公解梦》等）和弗洛伊德心理学理论。

**如何写：**
- 开头直接写解读，如"关于你的这个梦 💭..."
- 自然融入传统解梦内容：用"在传统解梦中 📚"、"按照周公解梦的说法 🔮"等，不要用"玄学角度"作为标题
- 自然融入心理学内容：用"从心理学的层面 🧠"、"如果从潜意识理解 💭"等，不要用"心理学角度"作为标题
- 结尾自然融入鼓励，直接说鼓励的话，不要用"最后"、"总结"等标记

**正确示例：**
"关于你的这个梦 💭，让我来为你解读一下 🌙...在传统解梦中 📚，飞翔通常象征着自由和突破 🔮。古人云'飞者，高升也'，这预示着你可能迎来新的机遇 ✨。其实，如果从心理学的层面来理解 🧠，飞翔的梦境往往反映了内心对自由的渴望 💫...希望你能够勇敢地追求自己的理想 🌟..."

**错误示例（绝对不要）：**
"玄学角度（周公解梦）...心理学角度...最后的鼓励..."`;

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
    
    let interpretation = data.choices?.[0]?.message?.content;
    
    if (!interpretation) {
      console.error('No interpretation in response:', data);
      return new Response(
        JSON.stringify({ error: '解读生成失败，请重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 后处理：彻底移除所有禁止的标题和段落标记
    // 移除所有可能的标题（不限制位置，匹配文本中任何位置的标题）
    // 包括标题本身及其后面的空格、换行等
    const forbiddenPatterns = [
      // 匹配"玄学角度（周公解梦）"及其变体，包括后面的空格和换行
      /玄学角度\s*(?:（周公解梦）|\(周公解梦\)|：)?\s*/gi,
      // 匹配"心理学角度"及其变体
      /心理学角度\s*(?:：)?\s*/gi,
      // 匹配"传统解梦角度"
      /传统解梦角度\s*(?:：)?\s*/gi,
      // 匹配"弗洛伊德角度"
      /弗洛伊德角度\s*(?:：)?\s*/gi,
      // 匹配结尾标题
      /温暖的鼓励与祝福\s*(?:：)?\s*/gi,
      /总结\s*(?:：)?\s*/gi,
      /结语\s*(?:：)?\s*/gi,
      // 匹配数字序号开头的标题
      /[一二三四五六七八九十\d]+[\.、．]\s*(?:玄学|心理学|传统|弗洛伊德|总结|结语|鼓励|祝福)/gi,
    ];
    
    forbiddenPatterns.forEach(regex => {
      interpretation = interpretation.replace(regex, '');
    });
    
    // 移除标题后面的空行和多余空白
    interpretation = interpretation
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/gm, '') // 移除每行首尾空白
      .trim();

    // 强制添加表情符号 - 确保足够的表情符号
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = ['💭', '✨', '🔮', '📚', '🧠', '💡', '🌟', '🌈', '💫', '🦋', '🌊', '⭐', '💗', '🎯', '🌺', '🍃', '🌻', '💙', '🌙'];
    
    // 计算当前表情符号数量
    const currentEmojis = interpretation.match(emojiPattern) || [];
    const emojiCount = currentEmojis.length;
    
    // 如果表情符号少于8个，强制在句号、感叹号、问号后添加
    if (emojiCount < 8) {
      let emojiIndex = 0;
      let addedCount = 0;
      
      // 先保存原始文本用于检查
      const originalText = interpretation;
      
      // 在句号、感叹号、问号后添加表情符号
      interpretation = interpretation.replace(/([。！？])(\s*)/g, (match, punct, space, offset) => {
        // 检查这个标点后面是否已经有表情符号（使用原始文本检查）
        const afterText = originalText.substring(offset + match.length, offset + match.length + 10);
        const hasEmojiAfter = emojiPattern.test(afterText);
        
        if (!hasEmojiAfter && addedCount < 12) {
          addedCount++;
          return punct + ' ' + emojis[emojiIndex++ % emojis.length] + space;
        }
        return match;
      });
      
      // 如果还是不够，在逗号后也添加一些
      const finalEmojiCount = (interpretation.match(emojiPattern) || []).length;
      if (finalEmojiCount < 6) {
        emojiIndex = 0;
        let commaCount = 0;
        interpretation = interpretation.replace(/([，,])(\s+)/g, (match, punct, space) => {
          if (commaCount < 4) {
            commaCount++;
            return punct + ' ' + emojis[emojiIndex++ % emojis.length] + space;
          }
          return match;
        });
      }
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
