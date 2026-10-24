type EnvMap = Record<string, string | undefined>;

interface ScopedModelCredentials {
  type: 'scoped';
  apiKeyEnv: string;
  baseURLEnv: string;
}

interface LegacyModelCredentials {
  type: 'legacy';
  apiKeyEnvs: readonly string[];
  baseURLEnv: string;
  defaultBaseURL: string;
}

type ModelCredentials = ScopedModelCredentials | LegacyModelCredentials;

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  credentials: ModelCredentials;
}

export interface ProviderConfig {
  apiKey: string;
  baseURL: string;
  apiKeyEnvName: string;
}

export class ProviderConfigurationError extends Error {
  constructor(
    message: string,
    readonly envNames: string[]
  ) {
    super(message);
    this.name = 'ProviderConfigurationError';
  }
}

export function isProviderConfigurationError(error: unknown): error is ProviderConfigurationError {
  return error instanceof ProviderConfigurationError;
}

export const DEFAULT_CHAT_MODEL = 'deepseek-v4.1-flash';
export const DEFAULT_ALLOWED_MODELS: readonly string[] = [
  'deepseek-v4.1-flash',
  'deepseek-v4-flash',
];
export const DEEPSEEK_V41_FLASH_API_KEY_ENV = 'AI_MODEL_DEEPSEEK_V41_FLASH_API_KEY';
export const DEEPSEEK_V41_FLASH_BASE_URL_ENV = 'AI_MODEL_DEEPSEEK_V41_FLASH_BASE_URL';

// DEEPSEEK_API_KEY 回退时的官方 API 地址（与旧配置语义保持一致）
export const DEEPSEEK_OFFICIAL_BASE_URL = 'https://api.deepseek.com';

const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  'deepseek-v4.1-flash': {
    id: 'deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash',
    provider: 'deepseek',
    credentials: {
      type: 'scoped',
      apiKeyEnv: DEEPSEEK_V41_FLASH_API_KEY_ENV,
      baseURLEnv: DEEPSEEK_V41_FLASH_BASE_URL_ENV,
    },
  },
  'deepseek-v4-flash': {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    credentials: {
      type: 'legacy',
      apiKeyEnvs: ['AI_PROVIDER_API_KEY', 'DEEPSEEK_API_KEY'],
      baseURLEnv: 'AI_PROVIDER_BASE_URL',
      defaultBaseURL: DEEPSEEK_OFFICIAL_BASE_URL,
    },
  },
};

function readEnv(env: EnvMap, name: string): string {
  return env[name]?.trim() || '';
}

/**
 * 查询已注册模型，未注册的模型不会暴露给请求链路。
 *
 * @param model - 模型 ID。
 * @returns 模型元数据；未注册时返回 `undefined`。
 */
export function findRegisteredModel(model: string): ModelDefinition | undefined {
  return MODEL_REGISTRY[model];
}

/**
 * 获取已注册模型，未知模型直接拒绝。
 *
 * @param model - 模型 ID。
 * @returns 模型元数据。
 * @throws 模型未注册时抛出可读错误。
 */
export function requireRegisteredModel(model: string): ModelDefinition {
  const definition = findRegisteredModel(model);

  if (!definition) {
    throw new Error(`model "${model}" is not registered`);
  }

  return definition;
}

/**
 * 读取并过滤白名单。环境变量中的未知模型会被忽略，重复模型只保留一次。
 *
 * @param env - 环境变量映射。
 * @returns 去重后的已注册模型 ID。
 */
export function readAllowedModels(env: EnvMap = process.env): string[] {
  const raw = env.AI_CHAT_ALLOWED_MODELS?.trim();
  const candidates = raw ? raw.split(',') : DEFAULT_ALLOWED_MODELS;
  const seen = new Set<string>();

  return candidates
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item) || !findRegisteredModel(item)) {
        return false;
      }

      seen.add(item);
      return true;
    });
}

/**
 * 解析主对话模型并同时校验注册信息与白名单。
 *
 * @param name - 请求指定的模型；缺省时读取 `AI_CHAT_MODEL`。
 * @param env - 环境变量映射。
 * @returns 最终使用的模型 ID。
 */
export function resolveConfiguredModel(name?: string, env: EnvMap = process.env): string {
  const model = name?.trim() || env.AI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;

  requireRegisteredModel(model);

  if (!readAllowedModels(env).includes(model)) {
    throw new Error(`model "${model}" is not allowed`);
  }

  return model;
}

/**
 * 解析摘要模型：配置了 `AI_SUMMARY_MODEL` 时只要求已注册，否则跟随主模型。
 *
 * @param model - 主对话模型。
 * @param env - 环境变量映射。
 * @returns 最终使用的摘要模型 ID。
 */
export function resolveConfiguredSummaryModel(model?: string, env: EnvMap = process.env): string {
  const configuredSummaryModel = env.AI_SUMMARY_MODEL?.trim();

  if (!configuredSummaryModel) {
    return resolveConfiguredModel(model, env);
  }

  return requireRegisteredModel(configuredSummaryModel).id;
}

/**
 * 读取模型对应的 Provider 配置。
 *
 * 专属模型缺少任一变量时直接抛错；旧模型继续使用原有全局 Key/Base URL
 * 回退语义，避免新增模型改变旧模型行为。
 *
 * @param model - 模型 ID。
 * @param env - 环境变量映射。
 * @returns 已解析的 API Key、Base URL 和 Key 变量名。
 */
export function readProviderConfig(model: string, env: EnvMap = process.env): ProviderConfig {
  const definition = requireRegisteredModel(model);
  const { credentials } = definition;

  if (credentials.type === 'scoped') {
    const apiKey = readEnv(env, credentials.apiKeyEnv);
    const baseURL = readEnv(env, credentials.baseURLEnv);
    const missingEnvNames = [
      !apiKey ? credentials.apiKeyEnv : '',
      !baseURL ? credentials.baseURLEnv : '',
    ].filter(Boolean);

    if (missingEnvNames.length > 0) {
      throw new ProviderConfigurationError(
        `model "${model}" is missing required environment variables: ${missingEnvNames.join(', ')}`,
        missingEnvNames
      );
    }

    return {
      apiKey,
      baseURL,
      apiKeyEnvName: credentials.apiKeyEnv,
    };
  }

  const apiKeyEnvName = credentials.apiKeyEnvs.find((name) => readEnv(env, name));
  const apiKey = apiKeyEnvName ? readEnv(env, apiKeyEnvName) : '';

  if (!apiKey) {
    throw new ProviderConfigurationError(
      `model "${model}" requires one of: ${credentials.apiKeyEnvs.join(', ')}`,
      [...credentials.apiKeyEnvs]
    );
  }

  return {
    apiKey,
    baseURL: readEnv(env, credentials.baseURLEnv) || credentials.defaultBaseURL,
    apiKeyEnvName: apiKeyEnvName || credentials.apiKeyEnvs.join(' / '),
  };
}
