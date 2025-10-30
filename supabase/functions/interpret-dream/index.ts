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

    const systemPrompt = `你是一位专业的解梦大师，精通周公解梦和心理学。请从以下两个角度解读用户的梦境：

1. **玄学角度**（周公解梦）：根据中国传统文化和周公解梦的智慧，解读梦境的象征意义和预示。
2. **心理学角度**：从现代心理学的视角，分析梦境反映的潜意识、情绪和心理状态。

请用温暖、专业且易懂的语言进行解读。解读内容应该：
- 结构清晰，分别从玄学和心理学两个角度展开
- 语言优美，充满智慧
- 在最后给予用户温暖的鼓励和祝福
- 字数控制在300-500字之间
- 使用优雅的中文表达`;

    const userPrompt = `我的梦境：${dream}

做梦后的心情：${mood}

请帮我解读这个梦境。`;

    console.log('Calling OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dream-interpreter.lovable.app',
        'X-Title': '周公解梦',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
