import fetch from 'node-fetch';
import { TRIP_PLAN_SYSTEM_PROMPT } from '../../lib/ai/buildTripPlanPrompt.js';
import {
  getAiProviderConfig,
  isAiProviderConfigured,
  buildChatCompletionRequestUrl,
  buildChatCompletionRequestHeaders,
} from '../../config/ai-provider.js';

export const AI_GENERATION_TIMEOUT_MS = Math.max(
  60000,
  Number(process.env.TRIP_PLAN_AI_TIMEOUT_MS) || 120000
);
export const AI_REPAIR_TIMEOUT_MS = Math.max(
  30000,
  Number(process.env.TRIP_PLAN_REPAIR_TIMEOUT_MS) || 60000
);
export const AI_REQUEST_ATTEMPTS = 2;
export const DEFAULT_GENERATION_MAX_TOKENS = 6500;
export const DEFAULT_REPAIR_MAX_TOKENS = 4500;

export function isAIConfigured() {
  return isAiProviderConfigured();
}

function extractMessageText(message) {
  if (!message) {
    return '';
  }

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('');
  }

  return '';
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function callTripPlanningAI(prompt, options = {}) {
  const providerConfig = getAiProviderConfig();
  const requestBody = {
    model: providerConfig.model,
    messages: [
      {
        role: 'system',
        content: TRIP_PLAN_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: options.maxTokens || DEFAULT_GENERATION_MAX_TOKENS,
    response_format: {
      type: 'json_object',
    },
  };

  const maxAttempts = options.maxAttempts || AI_REQUEST_ATTEMPTS;
  const timeoutMs = options.timeoutMs || AI_GENERATION_TIMEOUT_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        buildChatCompletionRequestUrl(providerConfig),
        {
          method: 'POST',
          headers: buildChatCompletionRequestHeaders(providerConfig),
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const choice = data?.choices?.[0];
        return {
          text: extractMessageText(choice?.message),
          finishReason: choice?.finish_reason || null,
        };
      }

      const errorText = await response.text();
      if (response.status === 400 && /content_filter|ResponsibleAIPolicyViolation/i.test(errorText)) {
        const error = new Error(
          'The trip request was blocked by the AI safety filter. Remove unusual instructions from the notes and try again.'
        );
        error.code = 'AI_CONTENT_FILTER';
        throw error;
      }
      const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === maxAttempts) {
        throw new Error(`AI request failed with status ${response.status}: ${errorText}`);
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error(`Trip planning AI request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
      }

      if (attempt === maxAttempts) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    const backoff = 750 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
    await wait(backoff);
  }

  throw new Error('Trip planning AI request failed.');
}

export function safeParseAIJson(raw) {
  if (!raw) {
    throw new Error('Empty AI response');
  }

  const cleaned = String(raw)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in AI response');
  }

  const candidate = jsonMatch[0];

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const repaired = candidate
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/ /g, ' ');

    try {
      return JSON.parse(repaired);
    } catch (repairError) {
      throw new Error(`Failed to parse AI JSON: ${repairError.message}`);
    }
  }
}

export async function repairTripPlanJson(rawJson, parseError) {
  const repairPrompt = `Repair the malformed JSON below.

Rules:
- Return one valid JSON object only.
- Preserve all existing travel content and keys.
- Fix syntax only: missing commas, quotes, brackets, braces, or truncated endings.
- Do not add markdown or commentary.
- If the ending is truncated, close the current object and all open arrays/objects with the smallest valid completion.

Parser error:
${parseError.message}

Malformed JSON:
${rawJson}`;

  const repaired = await callTripPlanningAI(repairPrompt, {
    maxTokens: DEFAULT_REPAIR_MAX_TOKENS,
    maxAttempts: 1,
    timeoutMs: AI_REPAIR_TIMEOUT_MS,
  });
  if (repaired.finishReason === 'length') {
    throw new Error('AI JSON repair was truncated.');
  }

  return safeParseAIJson(repaired.text);
}
