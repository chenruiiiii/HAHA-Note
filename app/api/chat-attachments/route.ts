import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import { extractText } from 'unpdf';
import { isPrismaBackend } from '@/server/auth/backend';
import { requireUser } from '@/server/dal/require-user';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 50_000;
const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.docx', '.doc', '.pdf']);

type ParsedAttachment = {
  fileName: string;
  extension: string;
  text: string;
  truncated: boolean;
};

function jsonError(status: number, message: string) {
  return NextResponse.json({ code: status, data: null, message }, { status });
}

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim();
}

async function extractDocumentText(file: File, extension: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === '.txt' || extension === '.md') {
    return buffer.toString('utf8');
  }

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (extension === '.doc') {
    const document = await new WordExtractor().extract(buffer);
    return document.getBody();
  }

  if (extension === '.pdf') {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    return result.text;
  }

  throw new Error('不支持的附件格式');
}

export async function POST(request: Request) {
  if (isPrismaBackend()) {
    try {
      await requireUser(request);
    } catch {
      return jsonError(401, '未登录或登录已过期');
    }
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, '附件上传格式不正确');
  }

  const file = formData.get('file');

  if (!(file instanceof File)) {
    return jsonError(400, '请选择要上传的附件');
  }

  const extension = getExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return jsonError(400, '仅支持 txt、md、docx、doc、pdf 文件');
  }

  if (file.size > MAX_FILE_BYTES) {
    return jsonError(413, '附件大小不能超过 10 MB');
  }

  try {
    const extracted = normalizeText(await extractDocumentText(file, extension));

    if (!extracted) {
      return jsonError(422, '附件中没有可读取的文字内容');
    }

    const truncated = extracted.length > MAX_TEXT_LENGTH;
    const data: ParsedAttachment = {
      fileName: file.name,
      extension,
      text: truncated ? extracted.slice(0, MAX_TEXT_LENGTH) : extracted,
      truncated,
    };

    return NextResponse.json({ code: 200, data, message: 'success' });
  } catch (error) {
    console.error('chat attachment parse error', error);
    return jsonError(422, '附件解析失败，请确认文件未损坏或已加密');
  }
}
