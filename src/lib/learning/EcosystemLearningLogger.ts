import { supabase } from "@/integrations/supabase/client";

export type LearningLogAction = {
  // Required fields
  actionType: string;
  serviceInvolved: string;
  toolUsed: string;
  
  // Optional fields
  subService?: string;
  countryCode?: string;
  inputData?: any;
  inputMetadata?: any;
  toolCategory?: 'automation' | 'ai' | 'analytics' | 'payment' | 'infra' | 'other';
  toolConfig?: any;
  toolVersion?: string;
  outputData?: any;
  outputMetadata?: any;
  executionTimeMs?: number;
  costIncurred?: number;
  success?: boolean;
  errorDetails?: string;
  qualityScore?: number;
  efficiencyScore?: number;
  userSatisfactionScore?: number;
  manualNotes?: string;
  learningTags?: string[];
  createdBy?: string;
  sessionId?: string;
  parentActionId?: string;
};

export class EcosystemLearningLogger {
  private static instance: EcosystemLearningLogger;
  
  static getInstance(): EcosystemLearningLogger {
    if (!EcosystemLearningLogger.instance) {
      EcosystemLearningLogger.instance = new EcosystemLearningLogger();
    }
    return EcosystemLearningLogger.instance;
  }
  
  async logAction(action: LearningLogAction): Promise<string> {
    try {
      const logEntry = {
        action_type: action.actionType,
        service_involved: action.serviceInvolved,
        sub_service: action.subService || null,
        country_code: action.countryCode || 'GL',
        input_data: action.inputData || {},
        input_metadata: action.inputMetadata || {},
        tool_used: action.toolUsed,
        tool_category: action.toolCategory || this.categorizeTool(action.toolUsed),
        tool_config: action.toolConfig || {},
        tool_version: action.toolVersion || '1.0',
        output_data: action.outputData || {},
        output_metadata: action.outputMetadata || {},
        execution_time_ms: action.executionTimeMs || null,
        cost_incurred: action.costIncurred || 0,
        success: action.success !== false,
        error_details: action.errorDetails || null,
        quality_score: action.qualityScore || this.calculateDefaultQuality(action),
        efficiency_score: action.efficiencyScore || 5,
        user_satisfaction_score: action.userSatisfactionScore || 5,
        manual_notes: action.manualNotes || null,
        learning_tags: action.learningTags || [],
        created_by: action.createdBy || null,
        session_id: action.sessionId || null,
        parent_action_id: action.parentActionId || null
      };
      
      const { data, error } = await supabase
        .from('ecosystem_learning_logs')
        .insert([logEntry])
        .select('id')
        .single();
      
      if (error) {
        console.error('Failed to log action:', error);
        this.saveToLocalFallback(logEntry);
        return 'fallback';
      }
      
      // Trigger async pattern analysis
      this.triggerPatternAnalysis(data.id).catch(console.error);
      
      // Update autonomy roadmap metrics
      this.updateToolMetrics(action.toolUsed).catch(console.error);
      
      return data.id;
    } catch (error) {
      console.error('Learning logger error:', error);
      return 'error';
    }
  }
  
  async logBatchActions(actions: LearningLogAction[]): Promise<string[]> {
    const logEntries = actions.map(action => ({
      action_type: action.actionType,
      service_involved: action.serviceInvolved,
      sub_service: action.subService || null,
      country_code: action.countryCode || 'GL',
      input_data: action.inputData || {},
      input_metadata: action.inputMetadata || {},
      tool_used: action.toolUsed,
      tool_category: action.toolCategory || this.categorizeTool(action.toolUsed),
      tool_config: action.toolConfig || {},
      tool_version: action.toolVersion || '1.0',
      output_data: action.outputData || {},
      output_metadata: action.outputMetadata || {},
      execution_time_ms: action.executionTimeMs || null,
      cost_incurred: action.costIncurred || 0,
      success: action.success !== false,
      error_details: action.errorDetails || null,
      quality_score: action.qualityScore || this.calculateDefaultQuality(action),
      efficiency_score: action.efficiencyScore || 5,
      user_satisfaction_score: action.userSatisfactionScore || 5,
      manual_notes: action.manualNotes || null,
      learning_tags: action.learningTags || [],
      created_by: action.createdBy || null,
      session_id: action.sessionId || null,
      parent_action_id: action.parentActionId || null
    }));
    
    try {
      const { data, error } = await supabase
        .from('ecosystem_learning_logs')
        .insert(logEntries)
        .select('id');
      
      if (error) {
        console.error('Failed to log batch actions:', error);
        return actions.map(() => 'batch_error');
      }
      
      data?.forEach(entry => {
        this.triggerPatternAnalysis(entry.id).catch(console.error);
      });
      
      const uniqueTools = [...new Set(actions.map(a => a.toolUsed))];
      uniqueTools.forEach(tool => {
        this.updateToolMetrics(tool).catch(console.error);
      });
      
      return data?.map(entry => entry.id) || [];
    } catch (error) {
      console.error('Batch learning logger error:', error);
      return actions.map(() => 'error');
    }
  }
  
  private categorizeTool(toolName: string): 'automation' | 'ai' | 'analytics' | 'payment' | 'infra' | 'other' {
    const toolCategories: Record<string, 'automation' | 'ai' | 'analytics' | 'payment' | 'infra' | 'other'> = {
      'n8n': 'automation',
      'make': 'automation',
      'zapier': 'automation',
      'openai': 'ai',
      'anthropic': 'ai',
      'google-ai': 'ai',
      'stripe': 'payment',
      'paypal': 'payment',
      'wise': 'payment',
      'google-analytics': 'analytics',
      'mixpanel': 'analytics',
      'amplitude': 'analytics',
      'aws': 'infra',
      'google-cloud': 'infra',
      'azure': 'infra',
    };
    
    const lowerTool = toolName.toLowerCase();
    for (const [key, category] of Object.entries(toolCategories)) {
      if (lowerTool.includes(key)) {
        return category;
      }
    }
    
    return 'other';
  }
  
  private calculateDefaultQuality(action: LearningLogAction): number {
    let score = 5;
    
    if (action.success === false) score = 2;
    if (action.executionTimeMs && action.executionTimeMs < 1000) score += 2;
    if (action.costIncurred && action.costIncurred < 0.01) score += 1;
    
    return Math.min(10, Math.max(1, score));
  }
  
  private async triggerPatternAnalysis(logId: string): Promise<void> {
    await supabase
      .from('ecosystem_learning_logs')
      .update({ 
        ai_generated_insights: 'Pending analysis',
        updated_at: new Date().toISOString()
      })
      .eq('id', logId);
  }
  
  private async updateToolMetrics(toolName: string): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('ecosystem_learning_logs')
      .select('id', { count: 'exact', head: true })
      .eq('tool_used', toolName)
      .gte('created_at', thirtyDaysAgo);
    
    if (count && count > 0) {
      await supabase
        .from('autonomy_roadmap')
        .update({ 
          monthly_usage_count: count,
          updated_at: new Date().toISOString()
        })
        .eq('tool_to_replace', toolName);
    }
  }
  
  private saveToLocalFallback(logEntry: any): void {
    try {
      const fallbackLogs = JSON.parse(localStorage.getItem('ecosystem_learning_fallback') || '[]');
      fallbackLogs.push({
        ...logEntry,
        saved_locally_at: new Date().toISOString()
      });
      localStorage.setItem('ecosystem_learning_fallback', JSON.stringify(fallbackLogs.slice(-100)));
    } catch (e) {
      console.error('Failed to save to local fallback:', e);
    }
  }
  
  // Utility methods for common logging patterns
  static async logN8nWorkflow(workflowId: string, input: any, output: any, executionTime: number): Promise<string> {
    const logger = EcosystemLearningLogger.getInstance();
    return logger.logAction({
      actionType: 'n8n_workflow_execution',
      serviceInvolved: 'automation',
      toolUsed: 'n8n',
      toolCategory: 'automation',
      toolConfig: { workflowId },
      inputData: input,
      outputData: output,
      executionTimeMs: executionTime,
      costIncurred: executionTime * 0.0001,
      qualityScore: output?.success ? 8 : 3
    });
  }
  
  static async logAIApiCall(provider: string, model: string, input: any, output: any, tokensUsed: number): Promise<string> {
    const logger = EcosystemLearningLogger.getInstance();
    const cost = tokensUsed * 0.00002;
    
    return logger.logAction({
      actionType: 'ai_api_call',
      serviceInvolved: 'ai_services',
      toolUsed: provider,
      toolCategory: 'ai',
      toolConfig: { model },
      inputData: { prompt_length: input?.length || 0, tokens_estimated: tokensUsed },
      outputData: { response_length: output?.length || 0, tokens_used: tokensUsed },
      costIncurred: cost,
      qualityScore: 7
    });
  }
  
  static async logPaymentTransaction(provider: string, amount: number, currency: string, success: boolean): Promise<string> {
    const logger = EcosystemLearningLogger.getInstance();
    const fee = amount * 0.029 + 0.30;
    
    return logger.logAction({
      actionType: 'payment_processing',
      serviceInvolved: 'commerce',
      toolUsed: provider,
      toolCategory: 'payment',
      inputData: { amount, currency },
      outputData: { success, fee_charged: fee },
      costIncurred: fee,
      success,
      qualityScore: success ? 9 : 2
    });
  }
}

// Export singleton instance
export const learningLogger = EcosystemLearningLogger.getInstance();
