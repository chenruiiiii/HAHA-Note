import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ALLOWED_MODELS,
  DEFAULT_CHAT_MODEL,
  DEEPSEEK_OFFICIAL_BASE_URL,
  DEEPSEEK_V41_FLASH_API_KEY_ENV,
  DEEPSEEK_V41_FLASH_BASE_URL_ENV,
  findRegisteredModel,
  isProviderConfigurationError,
  readAllowedModels,
  readProviderConfig,
  resolveConfiguredModel,
  resolveConfiguredSummaryModel,
} from './provider-config';

describe('provider config', () => {
  it('registers model metadata used by chat, summaries and persistence', () => {
    expect(findRegisteredModel('deepseek-v4.1-flash')).toMatchObject({
      id: 'deepseek-v4.1-flash',
      name: 'DeepSeek V4.1 Flash',
      provider: 'deepseek',
      credentials: {
        type: 'scoped',
        apiKeyEnv: DEEPSEEK_V41_FLASH_API_KEY_ENV,
        baseURLEnv: DEEPSEEK_V41_FLASH_BASE_URL_ENV,
      },
    });
    expect(findRegisteredModel('deepseek-v4-flash')).toMatchObject({
      id: 'deepseek-v4-flash',
      name: 'DeepSeek V4 Flash',
      provider: 'deepseek',
      credentials: {
        type: 'legacy',
      },
    });
  });

  it('routes deepseek-v4.1-flash through its own credentials', () => {
    expect(
      readProviderConfig('deepseek-v4.1-flash', {
        AI_PROVIDER_API_KEY: 'old-key',
        AI_PROVIDER_BASE_URL: 'https://old.example.com/v1',
        [DEEPSEEK_V41_FLASH_API_KEY_ENV]: 'new-key',
        [DEEPSEEK_V41_FLASH_BASE_URL_ENV]: 'https://new.example.com/v1',
      })
    ).toEqual({
      apiKey: 'new-key',
      baseURL: 'https://new.example.com/v1',
      apiKeyEnvName: DEEPSEEK_V41_FLASH_API_KEY_ENV,
    });
  });

  it('does not fall back to global credentials for deepseek-v4.1-flash', () => {
    try {
      readProviderConfig('deepseek-v4.1-flash', {
        AI_PROVIDER_API_KEY: 'old-key',
        AI_PROVIDER_BASE_URL: 'https://old.example.com/v1',
        DEEPSEEK_API_KEY: 'legacy-key',
      });
      expect.unreachable('expected provider config to throw');
    } catch (error) {
      expect(isProviderConfigurationError(error)).toBe(true);
      expect(error).toMatchObject({
        envNames: [DEEPSEEK_V41_FLASH_API_KEY_ENV, DEEPSEEK_V41_FLASH_BASE_URL_ENV],
      });
      expect((error as Error).message).toContain(
        `${DEEPSEEK_V41_FLASH_API_KEY_ENV}, ${DEEPSEEK_V41_FLASH_BASE_URL_ENV}`
      );
    }
  });

  it('reports only the missing scoped variable', () => {
    expect(() =>
      readProviderConfig('deepseek-v4.1-flash', {
        [DEEPSEEK_V41_FLASH_API_KEY_ENV]: 'new-key',
      })
    ).toThrow(DEEPSEEK_V41_FLASH_BASE_URL_ENV);
  });

  it('keeps the existing global credentials for deepseek-v4-flash', () => {
    expect(
      readProviderConfig('deepseek-v4-flash', {
        AI_PROVIDER_API_KEY: 'old-key',
        AI_PROVIDER_BASE_URL: 'https://old.example.com/v1',
        [DEEPSEEK_V41_FLASH_API_KEY_ENV]: 'new-key',
        [DEEPSEEK_V41_FLASH_BASE_URL_ENV]: 'https://new.example.com/v1',
      })
    ).toEqual({
      apiKey: 'old-key',
      baseURL: 'https://old.example.com/v1',
      apiKeyEnvName: 'AI_PROVIDER_API_KEY',
    });
  });

  it('keeps the DEEPSEEK_API_KEY and official URL fallback for the old model', () => {
    expect(readProviderConfig('deepseek-v4-flash', { DEEPSEEK_API_KEY: 'legacy-key' })).toEqual({
      apiKey: 'legacy-key',
      baseURL: DEEPSEEK_OFFICIAL_BASE_URL,
      apiKeyEnvName: 'DEEPSEEK_API_KEY',
    });
  });

  it('defaults to deepseek-v4.1-flash and exposes both readable models', () => {
    expect(readAllowedModels({})).toEqual(DEFAULT_ALLOWED_MODELS);
    expect(resolveConfiguredModel(undefined, {})).toBe(DEFAULT_CHAT_MODEL);
    expect(findRegisteredModel('deepseek-v4.1-flash')?.name).toBe('DeepSeek V4.1 Flash');
    expect(findRegisteredModel('deepseek-v4-flash')?.name).toBe('DeepSeek V4 Flash');
  });

  it('filters unknown and duplicate models from an explicit allowlist', () => {
    const env = {
      AI_CHAT_ALLOWED_MODELS:
        'deepseek-v4-flash, unknown-model, deepseek-v4-flash, deepseek-v4.1-flash',
    };

    expect(readAllowedModels(env)).toEqual(['deepseek-v4-flash', 'deepseek-v4.1-flash']);
  });

  it('rejects unregistered and disallowed chat models', () => {
    expect(() => resolveConfiguredModel('unknown-model', {})).toThrow('is not registered');
    expect(() =>
      resolveConfiguredModel('deepseek-v4-flash', {
        AI_CHAT_ALLOWED_MODELS: 'deepseek-v4.1-flash',
      })
    ).toThrow('is not allowed');
  });

  it('validates the summary model and otherwise follows the chat model', () => {
    expect(
      resolveConfiguredSummaryModel('deepseek-v4-flash', {
        AI_SUMMARY_MODEL: 'deepseek-v4.1-flash',
      })
    ).toBe('deepseek-v4.1-flash');
    expect(resolveConfiguredSummaryModel('deepseek-v4-flash', {})).toBe('deepseek-v4-flash');
    expect(() =>
      resolveConfiguredSummaryModel('deepseek-v4-flash', {
        AI_SUMMARY_MODEL: 'unknown-summary-model',
      })
    ).toThrow('is not registered');
  });
});
