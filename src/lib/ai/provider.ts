import 'server-only';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// 模型与 Provider 配置（多模型统一封装，切换只需改环境变量）
const DEFAULT_CHAT_MODEL = 'deepseek-v4-flash';
const DEFAULT_ALLOWED_MODELS = ['deepseek-v4-flash'];

// 落库用的供应商标识（OpenAI 兼容网关，未来接其他厂商时按模型归属维护）
const DEFAULT_PROVIDER = 'deepseek';

let providerCache: ReturnType<typeof createOpenAI> | null = null;
let providerCacheKey = '';

function readApiKey(): string {
  return process.env.AI_PROVIDER_API_KEY || process.env.DEEPSEEK_API_KEY || '';
}

function readBaseURL(): string {
  const baseURL = process.env.AI_PROVIDER_BASE_URL;

  if (!baseURL) {
    throw new Error('AI_PROVIDER_BASE_URL is not configured');
  }

  return baseURL;
}

function readAllowedModels(): string[] {
  const raw = process.env.AI_CHAT_ALLOWED_MODELS;

  if (!raw || !raw.trim()) {
    return DEFAULT_ALLOWED_MODELS;
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 获取共享的 OpenAI 兼容 Provider 实例（自有网关）。
 *
 * 通过 `createOpenAI` 统一封装 OpenAI 兼容接口（DeepSeek 等），
 * 切换模型/供应商只需更换 `apiKey` + `baseURL`，API key 只存在于服务端。
 * 实例按（apiKey + baseURL）缓存，避免每次请求重建。
 *
 * @returns OpenAI 兼容的 Provider 实例。
 * @throws 当 apiKey 或 `AI_PROVIDER_BASE_URL` 未配置时抛出可读错误。
 */
function getProvider() {
  const apiKey = readApiKey();

  if (!apiKey) {
    throw new Error('AI_PROVIDER_API_KEY (or DEEPSEEK_API_KEY) is not configured');
  }

  const baseURL = readBaseURL();
  const cacheKey = `${apiKey}|${baseURL}`;

  if (!providerCache || providerCacheKey !== cacheKey) {
    providerCache = createOpenAI({
      apiKey,
      baseURL,
    });
    providerCacheKey = cacheKey;
  }

  return providerCache;
}

/**
 * 解析并校验模型名，防止前端传入任意模型。
 *
 * @param name - 请求中携带的模型名；缺省时读取 `AI_CHAT_MODEL`，再回退默认模型。
 * @returns 通过白名单校验的模型名。
 * @throws 当模型名不在白名单中时抛出错误。
 */
export function resolveModelName(name?: string): string {
  const model = name || process.env.AI_CHAT_MODEL || DEFAULT_CHAT_MODEL;

  if (!readAllowedModels().includes(model)) {
    throw new Error(`model "${model}" is not allowed`);
  }

  return model;
}

/**
 * 主对话模型：校验入参后返回 AI SDK Model。
 *
 * @param model - 请求携带的模型名（可选）。
 * @returns AI SDK Model。
 */
export function getChatModel(model?: string): LanguageModel {
  return getProvider()(resolveModelName(model));
}

/**
 * 摘要/标题模型：默认跟随主模型，`AI_SUMMARY_MODEL` 存在时独立覆盖。
 *
 * @param model - 请求携带的模型名（可选，供主对话链路复用）。
 * @returns AI SDK Model。
 */
export function getSummaryModel(model?: string): LanguageModel {
  const summaryModel = process.env.AI_SUMMARY_MODEL || resolveModelName(model);
  return getProvider()(summaryModel);
}

/**
 * 当前白名单模型列表，供前端下拉展示（只暴露 id/name，不含密钥/baseURL）。
 *
 * @returns 白名单模型数组。
 */
export function listAllowedModels(): Array<{ id: string; name: string }> {
  return readAllowedModels().map((id) => ({ id, name: id }));
}

/**
 * 当前生效的供应商标识，用于会话/消息落库。
 *
 * @returns 供应商标识字符串。
 */
export function getProviderName(): string {
  return DEFAULT_PROVIDER;
}
