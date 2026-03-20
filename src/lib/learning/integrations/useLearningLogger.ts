import { useCallback, useRef } from 'react';
import { learningLogger, type LearningLogAction } from '../EcosystemLearningLogger';

interface UseLearningLoggerOptions {
  service: string;
  defaultTool?: string;
}

/**
 * React hook for easy learning logging in components
 */
export function useLearningLogger(options: UseLearningLoggerOptions) {
  const { service, defaultTool = 'internal' } = options;
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

  /**
   * Log a single action
   */
  const logAction = useCallback(
    async (
      actionType: string,
      data?: Partial<Omit<LearningLogAction, 'actionType' | 'serviceInvolved'>> & { toolUsed?: string }
    ) => {
      const { toolUsed, ...rest } = data || {};
      return learningLogger.logAction({
        actionType,
        serviceInvolved: service,
        toolUsed: toolUsed || defaultTool,
        sessionId: sessionIdRef.current,
        ...rest,
      });
    },
    [service, defaultTool]
  );

  /**
   * Wrap an async function with automatic logging
   */
  const withLogging = useCallback(
    <TArgs extends any[], TResult>(
      fn: (...args: TArgs) => Promise<TResult>,
      actionType: string,
      options?: {
        getInputData?: (...args: TArgs) => any;
        getOutputData?: (result: TResult) => any;
        toolUsed?: string;
      }
    ): ((...args: TArgs) => Promise<TResult>) => {
      return async (...args: TArgs): Promise<TResult> => {
        const startTime = Date.now();
        let success = true;
        let errorDetails: string | undefined;
        let result: TResult;

        try {
          result = await fn(...args);
        } catch (error) {
          success = false;
          errorDetails = error.message;
          throw error;
        } finally {
          const executionTime = Date.now() - startTime;

          learningLogger.logAction({
            actionType,
            serviceInvolved: service,
            toolUsed: options?.toolUsed || defaultTool,
            sessionId: sessionIdRef.current,
            inputData: options?.getInputData?.(...args),
            outputData: result! ? options?.getOutputData?.(result!) : undefined,
            executionTimeMs: executionTime,
            success,
            errorDetails,
          }).catch(console.error);
        }

        return result!;
      };
    },
    [service, defaultTool]
  );

  /**
   * Log a user interaction
   */
  const logInteraction = useCallback(
    async (action: string, metadata?: Record<string, any>) => {
      return logAction(`user_${action}`, {
        inputData: metadata,
        qualityScore: 7,
      });
    },
    [logAction]
  );

  /**
   * Log an error
   */
  const logError = useCallback(
    async (error: Error, context?: Record<string, any>) => {
      return logAction('error', {
        inputData: context,
        errorDetails: error.stack || error.message,
        success: false,
        qualityScore: 2,
      });
    },
    [logAction]
  );

  /**
   * Log a performance metric
   */
  const logPerformance = useCallback(
    async (metric: string, value: number, unit: string = 'ms') => {
      return logAction('performance_metric', {
        inputData: { metric, value, unit },
        executionTimeMs: unit === 'ms' ? value : undefined,
        qualityScore: value < 1000 ? 8 : value < 3000 ? 6 : 4,
      });
    },
    [logAction]
  );

  return {
    logAction,
    withLogging,
    logInteraction,
    logError,
    logPerformance,
    sessionId: sessionIdRef.current,
  };
}

// Example usage in a component:
/*
function PaymentForm() {
  const { logAction, withLogging, logError } = useLearningLogger({ 
    service: 'commerce',
    defaultTool: 'stripe' 
  });

  const processPayment = withLogging(
    async (amount: number) => {
      const result = await stripe.createPayment(amount);
      return result;
    },
    'process_payment',
    {
      getInputData: (amount) => ({ amount }),
      getOutputData: (result) => ({ paymentId: result.id }),
    }
  );

  const handleSubmit = async () => {
    try {
      await processPayment(100);
      logAction('payment_success', { inputData: { step: 'completed' } });
    } catch (error) {
      logError(error as Error, { step: 'payment' });
    }
  };

  return <button onClick={handleSubmit}>Pay</button>;
}
*/
