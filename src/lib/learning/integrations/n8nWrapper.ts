import { learningLogger } from '../EcosystemLearningLogger';

export interface N8nWorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  executionId?: string;
}

export interface N8nWorkflowConfig {
  webhookUrl: string;
  workflowId?: string;
  workflowName?: string;
}

/**
 * Execute n8n workflow with automatic logging
 */
export async function executeN8nWorkflow(
  config: N8nWorkflowConfig,
  inputData: Record<string, any>
): Promise<N8nWorkflowResult> {
  const startTime = Date.now();
  let result: N8nWorkflowResult = { success: false };

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData),
    });

    const responseData = await response.json().catch(() => ({}));
    const executionTime = Date.now() - startTime;

    result = {
      success: response.ok,
      data: responseData,
      executionId: responseData.executionId || response.headers.get('x-execution-id'),
    };

    // Log successful workflow execution
    await learningLogger.logAction({
      actionType: 'n8n_workflow_execution',
      serviceInvolved: 'automation',
      toolUsed: 'n8n',
      toolConfig: {
        workflowId: config.workflowId,
        workflowName: config.workflowName,
      },
      inputData: sanitizeInput(inputData),
      outputData: {
        success: result.success,
        executionId: result.executionId,
        hasData: !!result.data,
      },
      executionTimeMs: executionTime,
      costIncurred: calculateN8nCost(executionTime),
      success: result.success,
      qualityScore: result.success ? 8 : 3,
    });

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    result = {
      success: false,
      error: error.message,
    };

    // Log failed workflow execution
    await learningLogger.logAction({
      actionType: 'n8n_workflow_error',
      serviceInvolved: 'automation',
      toolUsed: 'n8n',
      toolConfig: {
        workflowId: config.workflowId,
        workflowName: config.workflowName,
      },
      inputData: sanitizeInput(inputData),
      outputData: { error: error.message },
      executionTimeMs: executionTime,
      costIncurred: calculateN8nCost(executionTime),
      success: false,
      errorDetails: error.stack || error.message,
      qualityScore: 1,
    });

    return result;
  }
}

/**
 * Create a typed n8n workflow executor with preset configuration
 */
export function createN8nWorkflow<TInput extends Record<string, any>, TOutput = any>(
  config: N8nWorkflowConfig
) {
  return {
    execute: async (input: TInput): Promise<N8nWorkflowResult & { data?: TOutput }> => {
      return executeN8nWorkflow(config, input);
    },
    
    config,
    
    // Helper for chained workflows
    then: <TNextOutput>(
      nextConfig: N8nWorkflowConfig,
      transform?: (data: TOutput) => Record<string, any>
    ) => {
      return async (input: TInput): Promise<N8nWorkflowResult & { data?: TNextOutput }> => {
        const firstResult = await executeN8nWorkflow(config, input);
        if (!firstResult.success) return firstResult;
        
        const nextInput = transform ? transform(firstResult.data) : firstResult.data;
        return executeN8nWorkflow(nextConfig, nextInput);
      };
    },
  };
}

/**
 * Batch execute multiple workflows
 */
export async function batchExecuteN8nWorkflows(
  workflows: Array<{ config: N8nWorkflowConfig; input: Record<string, any> }>
): Promise<N8nWorkflowResult[]> {
  const results = await Promise.allSettled(
    workflows.map(({ config, input }) => executeN8nWorkflow(config, input))
  );

  return results.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : { success: false, error: (result.reason as Error).message }
  );
}

// Utility functions
function sanitizeInput(input: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'secret', 'token', 'api_key', 'apiKey', 'auth'];
  const sanitized = { ...input };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

function calculateN8nCost(executionTimeMs: number): number {
  // n8n Cloud pricing: ~$0.001 per execution + time-based
  const baseCost = 0.001;
  const timeCost = (executionTimeMs / 1000) * 0.0001; // $0.0001 per second
  return baseCost + timeCost;
}

// Pre-configured workflow examples
export const n8nWorkflows = {
  // Example: Create a workflow for processing payments
  processPayment: createN8nWorkflow<
    { amount: number; currency: string; customerId: string },
    { paymentId: string; status: string }
  >({
    webhookUrl: '', // Set your webhook URL
    workflowId: 'payment-processing',
    workflowName: 'Process Payment',
  }),

  // Example: Create a workflow for sending notifications
  sendNotification: createN8nWorkflow<
    { userId: string; message: string; channel: 'email' | 'slack' | 'sms' },
    { sent: boolean; messageId: string }
  >({
    webhookUrl: '', // Set your webhook URL
    workflowId: 'send-notification',
    workflowName: 'Send Notification',
  }),

  // Example: Create a workflow for data sync
  syncData: createN8nWorkflow<
    { source: string; destination: string; data: any },
    { synced: boolean; recordCount: number }
  >({
    webhookUrl: '', // Set your webhook URL
    workflowId: 'data-sync',
    workflowName: 'Sync Data',
  }),
};
