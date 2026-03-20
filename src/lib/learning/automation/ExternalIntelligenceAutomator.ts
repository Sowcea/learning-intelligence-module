import { supabase } from '@/integrations/supabase/client';

export interface AutomatedResponse {
  update_id: string;
  tool_name: string;
  analysis_timestamp: string;
  actions: AutomationAction[];
  notifications: NotificationConfig[];
  tasks: TaskConfig[];
  roadmap_updates: RoadmapUpdate[];
}

export interface AutomationAction {
  type: string;
  priority?: string;
  parameters?: Record<string, any>;
  recommendations?: string[];
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'in_app';
  channel?: string;
  recipients?: string[];
  message: string;
  subject?: string;
}

export interface TaskConfig {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  title?: string;
  deadline_days?: number;
  deadline_hours?: number;
}

export interface RoadmapUpdate {
  tool_name: string;
  priority_override?: number;
  notes: string;
}

export class ExternalIntelligenceAutomator {
  
  /**
   * Process a critical update and execute automated responses
   */
  static async processCriticalUpdate(updateId: string): Promise<AutomatedResponse | null> {
    const { data: update, error } = await supabase
      .from('external_tool_updates')
      .select(`
        *,
        external_tool_monitoring:monitoring_id(tool_name, tool_category, vendor)
      `)
      .eq('id', updateId)
      .single();
    
    if (error || !update) {
      console.error('Failed to fetch update:', error);
      return null;
    }
    
    // Skip if not critical/high
    if (!['critical', 'high'].includes(update.impact_level)) {
      return null;
    }
    
    // Analyze and create response
    const analysis = await this.analyzeUpdateContent(update);
    const response = await this.createAutomatedResponse(update, analysis);
    
    // Execute response
    await this.executeResponse(response);
    
    // Log automation execution
    await this.logAutomationExecution(update, response);
    
    return response;
  }
  
  /**
   * Analyze update content using keyword-based analysis
   */
  static async analyzeUpdateContent(update: any) {
    const content = (update.description || '') + ' ' + (update.title || '');
    const lowerContent = content.toLowerCase();
    
    const analysis = {
      impactLevel: update.impact_level || 'low',
      affectsOurUsage: update.affects_our_usage || false,
      requiresAction: update.requires_action || false,
      costImpact: update.estimated_cost_impact || 0,
      summary: '',
      immediate_actions: [] as string[],
      long_term_implications: [] as string[]
    };
    
    const keywords = {
      pricing: ['price', 'cost', 'fee', 'tier', 'plan', 'subscription', 'billing'],
      breaking: ['breaking', 'deprecated', 'removed', 'discontinued', 'sunset', 'eol'],
      security: ['security', 'vulnerability', 'patch', 'fix', 'cve', 'exploit'],
      feature: ['feature', 'release', 'new', 'announcing', 'launch', 'beta'],
      api: ['api', 'endpoint', 'rate limit', 'quota', 'version']
    };
    
    // Check categories and build recommendations
    if (keywords.pricing.some(k => lowerContent.includes(k))) {
      analysis.affectsOurUsage = true;
      analysis.requiresAction = true;
      analysis.immediate_actions.push('Review new pricing structure');
      analysis.immediate_actions.push('Calculate cost impact');
      analysis.long_term_implications.push('May need to find alternative');
    }
    
    if (keywords.breaking.some(k => lowerContent.includes(k))) {
      analysis.impactLevel = 'high';
      analysis.affectsOurUsage = true;
      analysis.requiresAction = true;
      analysis.immediate_actions.push('Identify affected integrations');
      analysis.immediate_actions.push('Plan migration path');
    }
    
    if (keywords.security.some(k => lowerContent.includes(k))) {
      analysis.impactLevel = 'critical';
      analysis.affectsOurUsage = true;
      analysis.requiresAction = true;
      analysis.immediate_actions.push('Verify our systems are not affected');
      analysis.immediate_actions.push('Apply patches if available');
    }
    
    if (keywords.api.some(k => lowerContent.includes(k))) {
      analysis.immediate_actions.push('Check API version compatibility');
      analysis.immediate_actions.push('Review rate limit changes');
    }
    
    analysis.summary = `${analysis.impactLevel.toUpperCase()} impact update for ${update.external_tool_monitoring?.tool_name || 'unknown tool'}. ${analysis.immediate_actions.length} immediate actions recommended.`;
    
    return analysis;
  }
  
  /**
   * Create automated response based on update and analysis
   */
  static async createAutomatedResponse(update: any, analysis: any): Promise<AutomatedResponse> {
    const toolName = update.external_tool_monitoring?.tool_name || 'Unknown Tool';
    
    const response: AutomatedResponse = {
      update_id: update.id,
      tool_name: toolName,
      analysis_timestamp: new Date().toISOString(),
      actions: [],
      notifications: [],
      tasks: [],
      roadmap_updates: []
    };
    
    // Get matching automation rules
    const { data: rules } = await supabase
      .from('external_automation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    // Process each matching rule
    for (const rule of rules || []) {
      if (this.ruleMatchesUpdate(rule, update)) {
        const ruleActions = rule.actions as any[];
        
        for (const action of ruleActions) {
          switch (action.type) {
            case 'create_task':
              response.tasks.push({
                type: 'automated_task',
                priority: action.priority || 'high',
                title: `${toolName}: ${update.title}`,
                deadline_days: action.deadline_days || 3,
                deadline_hours: action.deadline_hours
              });
              break;
              
            case 'send_notification':
              const channels = action.channels || ['in_app'];
              for (const channel of channels) {
                response.notifications.push({
                  type: channel,
                  message: `[${update.impact_level.toUpperCase()}] ${toolName}: ${update.title}`,
                  subject: `External Update Alert: ${toolName}`
                });
              }
              break;
              
            case 'update_roadmap':
              response.roadmap_updates.push({
                tool_name: toolName,
                priority_override: update.impact_level === 'critical' ? 100 : 80,
                notes: `Auto-updated due to external change: ${update.title}`
              });
              break;
              
            case 'trigger_cost_analysis':
              response.actions.push({
                type: 'cost_analysis',
                parameters: { tool: toolName, timeframe: 'next_quarter' }
              });
              break;
              
            case 'scan_integrations':
              response.actions.push({
                type: 'integration_scan',
                parameters: { tool: toolName }
              });
              break;
              
            case 'ai_analysis':
              response.actions.push({
                type: 'ai_recommendations',
                recommendations: analysis.immediate_actions
              });
              break;
          }
        }
        
        // Update rule trigger count
        await supabase
          .from('external_automation_rules')
          .update({
            last_triggered_at: new Date().toISOString(),
            trigger_count: (rule.trigger_count || 0) + 1
          })
          .eq('id', rule.id);
      }
    }
    
    return response;
  }
  
  /**
   * Check if a rule matches the update
   */
  static ruleMatchesUpdate(rule: any, update: any): boolean {
    const conditions = rule.trigger_conditions as Record<string, any>;
    
    switch (rule.trigger_type) {
      case 'on_critical_update':
        return conditions.impact_level === update.impact_level;
        
      case 'on_pricing_change':
        return update.update_type === 'pricing_change' && 
               (!conditions.affects_our_usage || update.affects_our_usage);
               
      case 'on_security_alert':
        return update.update_type === 'security_alert';
        
      case 'on_trend_detected':
        const magnitude = conditions.impact_magnitude?.$gte;
        return update.relevance_score >= (magnitude || 0);
        
      case 'on_competitor_move':
        return conditions.threat_level?.includes(update.threat_level);
        
      default:
        return false;
    }
  }
  
  /**
   * Execute the automated response
   */
  static async executeResponse(response: AutomatedResponse) {
    console.log('🤖 Executing automated response:', response.tool_name);
    
    // Create tasks in automation_tasks table
    for (const task of response.tasks) {
      const deadlineDate = new Date();
      if (task.deadline_hours) {
        deadlineDate.setHours(deadlineDate.getHours() + task.deadline_hours);
      } else if (task.deadline_days) {
        deadlineDate.setDate(deadlineDate.getDate() + task.deadline_days);
      }
      
      await supabase
        .from('automation_tasks')
        .insert({
          task_id: `ext-intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: task.title || `External Intelligence Task: ${response.tool_name}`,
          description: `Automated response to external update`,
          priority: task.priority,
          status: 'pending',
          deadline: deadlineDate.toISOString(),
          category: 'external_intelligence',
          metadata: { 
            response_update_id: response.update_id,
            tool_name: response.tool_name
          },
          auto_generated: true
        });
    }
    
    // Update autonomy roadmap
    for (const roadmapUpdate of response.roadmap_updates) {
      await supabase
        .from('autonomy_roadmap')
        .update({
          manual_priority_override: roadmapUpdate.priority_override,
          notes: roadmapUpdate.notes,
          updated_at: new Date().toISOString()
        })
        .eq('tool_to_replace', roadmapUpdate.tool_name);
    }
    
    // Update the original update record
    await supabase
      .from('external_tool_updates')
      .update({
        status: 'action_required',
        ai_recommendations: JSON.parse(JSON.stringify(response.actions)),
        updated_at: new Date().toISOString()
      })
      .eq('id', response.update_id);
    
    // Log notifications (actual sending would require external integration)
    for (const notification of response.notifications) {
      console.log(`📢 Notification [${notification.type}]: ${notification.message}`);
    }
  }
  
  /**
   * Log automation execution
   */
  static async logAutomationExecution(update: any, response: AutomatedResponse) {
    await supabase
      .from('automation_execution_log')
      .insert([{
        trigger_type: update.update_type,
        execution_status: 'completed',
        actions_executed: JSON.parse(JSON.stringify(response.actions)),
        execution_result: JSON.parse(JSON.stringify({
          tasks_created: response.tasks.length,
          notifications_sent: response.notifications.length,
          roadmap_updates: response.roadmap_updates.length,
          update_id: update.id
        })),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }]);
  }
  
  /**
   * Get automation rules
   */
  static async getAutomationRules() {
    const { data, error } = await supabase
      .from('external_automation_rules')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Create new automation rule
   */
  static async createAutomationRule(rule: {
    rule_name: string;
    rule_description?: string;
    trigger_type: string;
    trigger_conditions: Record<string, any>;
    actions: any[];
    priority?: number;
  }) {
    const { data, error } = await supabase
      .from('external_automation_rules')
      .insert({
        rule_name: rule.rule_name,
        rule_description: rule.rule_description,
        trigger_type: rule.trigger_type,
        trigger_conditions: rule.trigger_conditions,
        actions: rule.actions,
        priority: rule.priority || 50,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Toggle automation rule
   */
  static async toggleAutomationRule(ruleId: string, isActive: boolean) {
    const { error } = await supabase
      .from('external_automation_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId);
    
    if (error) throw error;
  }
  
  /**
   * Get execution logs
   */
  static async getExecutionLogs(limit = 50) {
    const { data, error } = await supabase
      .from('automation_execution_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Process all pending critical updates
   */
  static async processAllPendingUpdates() {
    const { data: updates } = await supabase
      .from('external_tool_updates')
      .select('id')
      .in('impact_level', ['critical', 'high'])
      .eq('status', 'new');
    
    const results = [];
    for (const update of updates || []) {
      const result = await this.processCriticalUpdate(update.id);
      if (result) results.push(result);
    }
    
    return results;
  }
}
