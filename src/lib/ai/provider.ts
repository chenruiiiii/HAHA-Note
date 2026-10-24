import 'server-only';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import {
  readAllowedModels,
  readProviderConfig,
  requireRegisteredModel,
  resolveConfiguredModel,
  resolveConfiguredSummaryModel,
} from '@/lib/ai/provider-config';

const providerCache = new Map<string, ReturnType<typeof createOpenAI>>();

/**
 * 获取共享的 OpenAI 兼容 Provider 实例。
 *
 * 实例按解析后的 `apiKey + baseURL` 缓存，同一模型的不同请求会复用连接配置。
 *
 * @param model - 已通过注册表与白名单校验的模型 ID。
 * @returns OpenAI 兼容 Provider 实例。
 * @throws 模型配置缺失时抛出包含环境变量名的可读错误。
 */
function getProvider(model: string) {
  const { apiKey, baseURL } = readProviderConfig(model);
  const cacheKey = JSON.stringify([apiKey, baseURL]);
  const cachedProvider = providerCache.get(cacheKey);

  if (cachedProvider) {
    return cachedProvider;
  }

  const provider = createOpenAI({
    apiKey,
    baseURL,
  });
  providerCache.set(cacheKey, provider);
  return provider;
}

/**
 * 解析并校验主对话模型名，防止前端传入未注册或未授权模型。
 *
 * @param name - 请求中携带的模型名；缺省时读取 `AI_CHAT_MODEL`，再回退默认模型。
 * @returns 通过注册表与白名单校验的模型名。
 */
export function resolveModelName(name?: string): string {
  return resolveConfiguredModel(name);
}

/**
 * 主对话模型。
 *
 * @param model - 请求携带的模型名（可选）。
 * @returns AI SDK Model。
 */
export function getChatModel(model?: string): LanguageModel {
  const modelName = resolveModelName(model);
  return getProvider(modelName)(modelName);
}

/**
 * 摘要/标题模型：默认跟随主模型，`AI_SUMMARY_MODEL` 存在时独立覆盖。
 *
 * @param model - 请求携带的模型名（可选，供主对话链路复用）。
 * @returns AI SDK Model。
 */
export function getSummaryModel(model?: string): LanguageModel {
  const summaryModel = resolveConfiguredSummaryModel(model);
  return getProvider(summaryModel)(summaryModel);
}

/**
 * 当前白名单模型列表，供前端下拉展示。
 *
 * 只暴露模型 ID 与展示名，不包含密钥或 Base URL。
 *
 * @returns 已注册且被白名单允许的模型数组。
 */
export function listAllowedModels(): Array<{ id: string; name: string }> {
  return readAllowedModels().map((id) => {
    const definition = requireRegisteredModel(id);
    return { id: definition.id, name: definition.name };
  });
}

/**
 * 返回当前生效模型的实际供应商标识，用于会话与消息落库。
 *
 * @param model - 模型名；缺省时使用默认对话模型。
 * @returns 模型注册表中的供应商标识。
 */
export function getProviderName(model?: string): string {
  const modelName = resolveModelName(model);
  return requireRegisteredModel(modelName).provider;
}
