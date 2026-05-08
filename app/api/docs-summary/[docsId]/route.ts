import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';
import clientPromise from '@/lib/mongodb';
import { DocumentDetail } from '@/models/docs';
import { NextResponse } from 'next/server';

const DB_NAME = 'repository';
const COLLECTION_NAME = 'docs_detail';

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function generateDocumentSummary(title: string, contentHtml: string) {
  const plainText = stripHtml(contentHtml);

  if (!plainText) {
    return '';
  }

  const truncatedContent = plainText.slice(0, 6000);

  try {
    const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });
    const result = await generateText({
      model: deepseek('deepseek-chat'),
      prompt: [
        '请根据下面的文档内容生成一段中文总结。',
        '要求：',
        '1. 输出 80 到 140 个中文字符',
        '2. 总结要覆盖主题、关键观点和结论',
        '3. 只输出总结内容本身，不要加标题、前缀或列表符号',
        '',
        `文档标题：${title || '未命名文档'}`,
        `文档内容：${truncatedContent}`,
      ].join('\n'),
    });

    return result.text.trim().slice(0, 180);
  } catch {
    return truncatedContent.slice(0, 180);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ docsId: string }> }
): Promise<Response> {
  const { docsId } = await context.params;

  try {
    const body = (await request.json()) as {
      title?: string;
      content_html?: string;
      repository_id?: string;
      author?: string;
      persist?: boolean;
    };

    const summary = await generateDocumentSummary(body.title?.trim() || '新建文档', body.content_html ?? '');

    if (!body.persist) {
      return NextResponse.json({
        code: 200,
        data: {
          summary,
        },
        message: '总结成功',
      });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<DocumentDetail>(COLLECTION_NAME);
    const existing = await collection.findOne({ _id: docsId });

    if (!existing) {
      if (!body.repository_id?.trim()) {
        return NextResponse.json(
          {
            code: 400,
            data: null,
            message: '新建文档时 repository_id 不能为空',
          },
          { status: 400 }
        );
      }

      const nextDoc: DocumentDetail = {
        _id: docsId,
        repository_id: body.repository_id.trim(),
        title: body.title?.trim() || '新建文档',
        content_html: body.content_html ?? '',
        summary,
        author: body.author?.trim() || '当前用户',
        updated_at: new Date().toISOString(),
      };

      await collection.insertOne(nextDoc);

      return NextResponse.json({
        code: 200,
        data: nextDoc,
        message: '总结并创建成功',
      });
    }

    const nextDoc: DocumentDetail = {
      ...existing,
      title: body.title?.trim() || existing.title,
      content_html: body.content_html ?? existing.content_html,
      summary,
      updated_at: new Date().toISOString(),
    };

    await collection.updateOne({ _id: docsId }, { $set: nextDoc });

    return NextResponse.json({
      code: 200,
      data: nextDoc,
      message: '总结并保存成功',
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        data: error,
        message: '总结失败',
      },
      { status: 500 }
    );
  }
}
