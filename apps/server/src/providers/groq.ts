export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export async function callGroqStream(
  messages: GroqMessage[],
  apiKey: string,
  model: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  jsonMode = false,
  maxTokens = 5000
): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const bodyPayload: any = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens,
    stream: true,
  };

  if (jsonMode) {
    bodyPayload.response_format = { type: 'json_object' };
  }
  if (model.startsWith('openai/gpt-oss-')) {
    bodyPayload.reasoning_effort = 'low';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error('Groq response body is empty.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch {
          // ignore partial JSON parse error in stream
        }
      }
    }
  }

  return fullContent;
}

export async function callGroqNonStreaming(
  messages: GroqMessage[],
  apiKey: string,
  model: string,
  signal?: AbortSignal,
  jsonMode = false,
  maxTokens = 5000
): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const bodyPayload: any = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    bodyPayload.response_format = { type: 'json_object' };
  }
  if (model.startsWith('openai/gpt-oss-')) {
    bodyPayload.reasoning_effort = 'low';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}
