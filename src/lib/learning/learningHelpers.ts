import { supabase } from "@/integrations/supabase/client";
import { EcosystemLearningLogger, LearningLogAction } from "./EcosystemLearningLogger";

/**
 * Higher-order function to wrap any async function with learning logging
 */
export function withLearningLog<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: {
    actionType: string;
    serviceInvolved: string;
    toolUsed: string;
    toolCategory?: LearningLogAction['toolCategory'];
    getInputData?: (...args: Parameters<T>) => any;
    getOutputData?: (result: Awaited<ReturnType<T>>) => any;
    calculateCost?: (...args: Parameters<T>) => number;
  }
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const startTime = Date.now();
    let success = true;
    let errorDetails: string | undefined;
    let result: Awaited<ReturnType<T>>;
    
    try {
      result = await fn(...args);
    } catch (error) {
      success = false;
      errorDetails = error.message;
      throw error;
    } finally {
      const executionTime = Date.now() - startTime;
      
      EcosystemLearningLogger.getInstance().logAction({
        actionType: config.actionType,
        serviceInvolved: config.serviceInvolved,
        toolUsed: config.toolUsed,
        toolCategory: config.toolCategory,
        inputData: config.getInputData?.(...args),
        outputData: config.getOutputData?.(result!),
        executionTimeMs: executionTime,
        costIncurred: config.calculateCost?.(...args),
        success,
        errorDetails
      }).catch(console.error);
    }
    
    return result!;
  };
}

/**
 * Initialize learning for a specific service
 */
export function initializeServiceLearning(serviceName: string) {
  return {
    logAction: (actionType: string, data: any) => {
      return EcosystemLearningLogger.getInstance().logAction({
        actionType: `${serviceName}_${actionType}`,
        serviceInvolved: serviceName,
        toolUsed: 'internal',
        inputData: data,
        qualityScore: 8
      });
    },
    
    wrapFunction: function <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      actionName: string,
      getInputData?: (...args: Parameters<T>) => any
    ) {
      return withLearningLog(fn, {
        actionType: `${serviceName}_${actionName}`,
        serviceInvolved: serviceName,
        toolUsed: 'internal',
        getInputData
      });
    }
  };
}

/**
 * Get learning insights for a specific service
 */
export async function getServiceInsights(serviceName: string, days: number = 30) {
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: logs } = await supabase
    .from('ecosystem_learning_logs')
    .select('*')
    .eq('service_involved', serviceName)
    .gte('created_at', dateThreshold)
    .order('created_at', { ascending: false });
  
  const { data: knowledge } = await supabase
    .from('extracted_knowledge')
    .select('*')
    .contains('applicable_services', [serviceName])
    .order('business_value_score', { ascending: false });
  
  const totalActions = logs?.length || 0;
  
  return {
    totalActions,
    avgExecutionTime: logs?.reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / (totalActions || 1),
    avgQualityScore: logs?.reduce((acc, log) => acc + (log.quality_score || 5), 0) / (totalActions || 1),
    topTools: [...new Set(logs?.map(log => log.tool_used) || [])],
    discoveredPatterns: knowledge?.length || 0,
    highValuePatterns: knowledge?.filter(k => (k.business_value_score || 0) > 70) || []
  };
}

/**
 * Get autonomy roadmap summary
 */
export async function getAutonomyRoadmapSummary() {
  const { data: roadmap } = await supabase
    .from('autonomy_roadmap')
    .select('*')
    .order('final_priority', { ascending: false });
  
  if (!roadmap) return null;
  
  const totalMonthlyCost = roadmap.reduce((acc, item) => acc + (Number(item.monthly_cost) || 0), 0);
  const totalExpectedSavings = roadmap.reduce((acc, item) => acc + (Number(item.expected_monthly_savings) || 0), 0);
  
  const byPhase = roadmap.reduce((acc, item) => {
    acc[item.phase] = (acc[item.phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalTools: roadmap.length,
    totalMonthlyCost,
    totalExpectedSavings,
    potentialSavingsPercent: totalMonthlyCost > 0 ? (totalExpectedSavings / totalMonthlyCost) * 100 : 0,
    byPhase,
    topPriority: roadmap.slice(0, 5),
    criticalDependencies: roadmap.filter(item => item.dependency_level === 'critical')
  };
}

/**
 * Generate weekly learning report
 */
export async function generateWeeklyLearningReport(): Promise<string> {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data: weeklyLogs } = await supabase
    .from('ecosystem_learning_logs')
    .select('*')
    .gte('created_at', startOfWeek.toISOString());
  
  const { data: newPatterns } = await supabase
    .from('extracted_knowledge')
    .select('*')
    .gte('created_at', startOfWeek.toISOString());
  
  const totalActions = weeklyLogs?.length || 0;
  const avgCost = weeklyLogs?.reduce((acc, log) => acc + (Number(log.cost_incurred) || 0), 0) / (totalActions || 1);
  const avgTime = weeklyLogs?.reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / (totalActions || 1);
  const successRate = (weeklyLogs?.filter(log => log.success).length || 0) / (totalActions || 1);
  
  const toolUsage: Record<string, number> = {};
  weeklyLogs?.forEach(log => {
    toolUsage[log.tool_used] = (toolUsage[log.tool_used] || 0) + 1;
  });
  
  const topTools = Object.entries(toolUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tool, count]) => ({ tool, count }));
  
  const highValuePatterns = newPatterns
    ?.filter(p => (p.business_value_score || 0) > 70)
    .slice(0, 3) || [];
  
  const report = {
    report_week: startOfWeek.toISOString().split('T')[0],
    total_actions_logged: totalActions,
    new_patterns_discovered: newPatterns?.length || 0,
    tools_analyzed: Object.keys(toolUsage).length,
    estimated_opportunities_value: highValuePatterns.reduce((acc, p) => acc + (Number(p.estimated_monthly_savings) || 0), 0),
    avg_tool_cost: avgCost,
    avg_execution_time_ms: Math.round(avgTime),
    avg_quality_score: weeklyLogs?.reduce((acc, log) => acc + (log.quality_score || 5), 0) / (totalActions || 1),
    success_rate: successRate,
    top_patterns: highValuePatterns.map(p => ({
      name: p.pattern_name,
      value: p.estimated_monthly_savings,
      confidence: p.confidence_score
    })),
    top_opportunities: topTools.map(t => ({
      tool: t.tool,
      usage_count: t.count,
      estimated_savings: t.count * avgCost * 0.3
    })),
    report_status: 'draft' as const,
    generated_at: new Date().toISOString()
  };
  
  const { data: savedReport, error } = await supabase
    .from('weekly_learning_reports')
    .insert([report])
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to save weekly report:', error);
    return 'error';
  }
  
  return savedReport?.id || 'error';
}

/**
 * Get tool benchmarks summary
 */
export async function getToolBenchmarksSummary() {
  const { data: benchmarks } = await supabase
    .from('tool_benchmarks')
    .select('*')
    .eq('benchmark_status', 'completed')
    .order('overall_advantage_score', { ascending: false });
  
  if (!benchmarks) return null;
  
  return {
    totalBenchmarks: benchmarks.length,
    benchmarks: benchmarks.map(b => ({
      name: b.benchmark_name,
      externalTool: b.tool_external,
      internalTool: b.tool_internal,
      costAdvantage: b.cost_advantage_percent,
      timeAdvantage: b.time_advantage_percent,
      overallScore: b.overall_advantage_score
    })),
    readyForReplacement: benchmarks.filter(b => (b.overall_advantage_score || 0) > 30),
    needsImprovement: benchmarks.filter(b => (b.overall_advantage_score || 0) < 0)
  };
}

/**
 * Sync fallback logs from localStorage to database
 */
export async function syncFallbackLogs(): Promise<number> {
  try {
    const fallbackLogs = JSON.parse(localStorage.getItem('ecosystem_learning_fallback') || '[]');
    
    if (fallbackLogs.length === 0) return 0;
    
    const { error } = await supabase
      .from('ecosystem_learning_logs')
      .insert(fallbackLogs);
    
    if (error) {
      console.error('Failed to sync fallback logs:', error);
      return 0;
    }
    
    localStorage.removeItem('ecosystem_learning_fallback');
    return fallbackLogs.length;
  } catch (e) {
    console.error('Error syncing fallback logs:', e);
    return 0;
  }
}
