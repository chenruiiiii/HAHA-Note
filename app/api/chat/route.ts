import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });

  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
