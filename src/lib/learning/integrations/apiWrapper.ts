import { learningLogger } from '../EcosystemLearningLogger';

// Tracked API domains and their tool names
const TRACKED_APIS: Record<string, string> = {
  'api.openai.com': 'openai',
  'api.anthropic.com': 'anthropic',
  'api.stripe.com': 'stripe',
  'api.paypal.com': 'paypal',
  'hooks.slack.com': 'slack',
  'api.twilio.com': 'twilio',
  'api.sendgrid.com': 'sendgrid',
  'graph.facebook.com': 'facebook',
  'api.monday.com': 'monday',
  'app.asana.com': 'asana',
  'api.notion.com': 'notion',
  'api.airtable.com': 'airtable',
};

// Cost estimation per API (tokens/calls)
const API_COST_ESTIMATES: Record<string, number> = {
  openai: 0.002, // per 1k tokens average
  anthropic: 0.003,
  stripe: 0.0025, // per API call
  twilio: 0.0075,
  sendgrid: 0.0001,
};

/**
 * Creates a wrapped fetch function that logs API calls
 */
export function createTrackedFetch(originalFetch: typeof fetch = fetch): typeof fetch {
  return async function trackedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const toolName = getToolNameFromUrl(url);

    // If not a tracked API, just pass through
    if (!toolName) {
      return originalFetch(input, init);
    }

    const startTime = Date.now();
    let response: Response;
    let success = true;
    let errorDetails: string | undefined;

    try {
      response = await originalFetch(input, init);
      success = response.ok;
      if (!success) {
        errorDetails = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      success = false;
      errorDetails = error.message;
      
      // Log the error
      await learningLogger.logAction({
        actionType: 'api_call_error',
        serviceInvolved: 'external_apis',
        toolUsed: toolName,
        inputData: { url, method: init?.method || 'GET' },
        errorDetails,
        success: false,
        executionTimeMs: Date.now() - startTime,
      });

      throw error;
    }

    const executionTime = Date.now() - startTime;
    const estimatedCost = estimateApiCost(toolName, init?.body);

    // Log successful call
    await learningLogger.logAction({
      actionType: 'api_call',
      serviceInvolved: 'external_apis',
      toolUsed: toolName,
      inputData: {
        url: sanitizeUrl(url),
        method: init?.method || 'GET',
        hasBody: !!init?.body,
      },
      outputData: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      },
      executionTimeMs: executionTime,
      costIncurred: estimatedCost,
      success,
      errorDetails,
      qualityScore: calculateQualityScore(response.ok, executionTime),
    });

    return response;
  };
}

/**
 * Helper to get tool name from URL
 */
function getToolNameFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    for (const [domain, tool] of Object.entries(TRACKED_APIS)) {
      if (hostname.includes(domain)) {
        return tool;
      }
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Estimate cost based on tool and request body
 */
function estimateApiCost(tool: string, body?: BodyInit | null): number {
  const baseCost = API_COST_ESTIMATES[tool] || 0.001;
  
  if (body && typeof body === 'string') {
    // Rough token estimation: ~4 chars per token
    const estimatedTokens = body.length / 4;
    return baseCost * (estimatedTokens / 1000);
  }
  
  return baseCost;
}

/**
 * Calculate quality score based on response
 */
function calculateQualityScore(ok: boolean, executionTime: number): number {
  let score = ok ? 7 : 3;
  if (executionTime < 500) score += 2;
  else if (executionTime < 1000) score += 1;
  else if (executionTime > 5000) score -= 1;
  return Math.max(1, Math.min(10, score));
}

/**
 * Remove sensitive data from URLs
 */
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove API keys from query params
    parsed.searchParams.delete('api_key');
    parsed.searchParams.delete('key');
    parsed.searchParams.delete('token');
    parsed.searchParams.delete('access_token');
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Wrapper for specific API calls with typed logging
 */
export const trackedApis = {
  async openai(endpoint: string, body: any, apiKey: string) {
    const start = Date.now();
    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const executionTime = Date.now() - start;
    const tokensUsed = data.usage?.total_tokens || 0;

    await learningLogger.logAction({
      actionType: 'openai_api_call',
      serviceInvolved: 'ai_services',
      toolUsed: 'openai',
      toolConfig: { endpoint, model: body.model },
      inputData: { prompt_length: JSON.stringify(body.messages || body.prompt || '').length },
      outputData: { tokens_used: tokensUsed, finish_reason: data.choices?.[0]?.finish_reason },
      executionTimeMs: executionTime,
      costIncurred: tokensUsed * 0.00002,
      success: !data.error,
      errorDetails: data.error?.message,
      qualityScore: data.error ? 2 : 8,
    });

    return data;
  },

  async stripe(endpoint: string, method: string, body?: any) {
    const start = Date.now();
    const response = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body ? new URLSearchParams(body).toString() : undefined,
    });

    const data = await response.json();
    const executionTime = Date.now() - start;

    await learningLogger.logAction({
      actionType: 'stripe_api_call',
      serviceInvolved: 'commerce',
      toolUsed: 'stripe',
      toolConfig: { endpoint, method },
      inputData: { endpoint },
      outputData: { id: data.id, object: data.object },
      executionTimeMs: executionTime,
      costIncurred: 0.0025,
      success: !data.error,
      errorDetails: data.error?.message,
      qualityScore: data.error ? 2 : 9,
    });

    return data;
  },
};
