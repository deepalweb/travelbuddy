// Resolves which chat-completions provider to use (Azure OpenAI or NVIDIA's
// OpenAI-compatible API) based on env config, so callers don't need to branch.
export function getAiProviderConfig() {
  const provider = String(process.env.AI_PROVIDER || '').toLowerCase();
  const useNvidia = provider === 'nvidia' || (!provider && Boolean(process.env.NVIDIA_API_KEY));

  if (useNvidia) {
    return {
      isNvidia: true,
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      model: process.env.NVIDIA_MODEL || 'openai/gpt-oss-120b',
    };
  }

  return {
    isNvidia: false,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  };
}

export function getAiProviderName() {
  return getAiProviderConfig().isNvidia ? 'nvidia' : 'azure_openai';
}

export function isAiProviderConfigured() {
  const config = getAiProviderConfig();
  return Boolean(config.apiKey && config.baseURL && config.model);
}

export function buildChatCompletionRequestUrl(config) {
  if (config.isNvidia) {
    return `${config.baseURL}/chat/completions`;
  }
  return `${config.baseURL}/openai/deployments/${config.model}/chat/completions?api-version=2024-02-01`;
}

export function buildChatCompletionRequestHeaders(config) {
  if (config.isNvidia) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };
  }
  return {
    'Content-Type': 'application/json',
    'api-key': config.apiKey,
  };
}
