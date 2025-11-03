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
    const { dream } = await req.json();
    console.log('Received image generation request:', { dream });

    if (!dream || dream.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: '请提供梦境描述' }),
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

    // 构建图像生成的 prompt
    // 限制梦境描述长度，确保生成质量
    const dreamDescription = dream.length > 500 ? dream.substring(0, 500) + '...' : dream;
    const imagePrompt = `A beautiful, artistic, dreamlike visualization of the following dream: ${dreamDescription}. 
    Style: surreal, ethereal, mystical, with soft lighting and dreamy atmosphere. 
    Avoid realistic photography, use artistic illustration style with flowing colors and abstract elements.`;

    console.log('Calling OpenRouter API for image generation...');
    
    // 使用 OpenRouter 调用图像生成模型
    // 尝试使用支持图像生成的模型，如 flux-pro 或其他图像生成模型
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dream-interpreter.lovable.app',
        'X-Title': 'Dream Chronicle',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-pro', // 或者使用 'openai/dall-e-3' 如果可用
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: imagePrompt
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      // 如果第一个模型失败，尝试使用 DALL-E 3
      console.log('First model failed, trying DALL-E 3...');
      const altResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dream-interpreter.lovable.app',
          'X-Title': 'Dream Chronicle',
        },
        body: JSON.stringify({
          model: 'openai/dall-e-3',
          messages: [
            {
              role: 'user',
              content: imagePrompt
            }
          ],
        }),
      });

      if (!altResponse.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: '图像生成服务暂时不可用，请稍后重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const altData = await altResponse.json();
      // 检查响应格式，可能是直接包含 URL 或嵌套在 data 中
      const imageUrl = altData.data?.[0]?.url || altData.image_url || altData.url || altData.choices?.[0]?.message?.content;
      
      if (!imageUrl) {
        console.error('No image URL in response:', altData);
        return new Response(
          JSON.stringify({ error: '图像生成失败，请重试' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('OpenRouter response received');
    
    // 尝试多种可能的响应格式
    const imageUrl = data.data?.[0]?.url || data.image_url || data.url || data.choices?.[0]?.message?.content;
    
    if (!imageUrl) {
      console.error('No image URL in response:', data);
      return new Response(
        JSON.stringify({ error: '图像生成失败，请重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-dream-image function:', error);
    const errorMessage = error instanceof Error ? error.message : '服务器错误，请稍后重试';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

