export async function callAI(system: string, prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic';
  const model = process.env.ANTHROPIC_MODEL || 'deepseek-v4-pro';

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 未配置。请在 .env.local 中设置 DeepSeek API Key。');
  }

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API 调用失败 (${response.status}): ${errorText.slice(0, 500)}`);
  }

  const data = await response.json();

  // 兼容不同 API 的返回格式
  let text: string | undefined;

  if (Array.isArray(data.content)) {
    // DeepSeek Anthropic 格式: content 是数组，可能包含 thinking + text 块
    // 优先取 type="text" 的块，跳过 type="thinking"
    const textBlock = data.content.find(
      (b: { type: string }) => b.type === 'text'
    );
    if (textBlock?.text) {
      text = textBlock.text;
    } else {
      // 回退：取最后一个有 text 字段的块
      const lastWithText = [...data.content]
        .reverse()
        .find((b: { text?: string }) => b.text);
      text = lastWithText?.text;
    }
  } else if (typeof data.content === 'string') {
    text = data.content;
  } else if (data.choices?.[0]?.message?.content) {
    // OpenAI 格式
    text = data.choices[0].message.content;
  } else if (typeof data.message?.content === 'string') {
    text = data.message.content;
  }

  if (!text) {
    console.error('Unexpected AI response:', JSON.stringify(data).slice(0, 500));
    throw new Error(`AI 返回格式异常，无法解析内容。原始响应: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return text;
}
