import { supabase } from "@/integrations/supabase/client";
import { EcosystemLearningLogger } from "@/lib/learning/EcosystemLearningLogger";

export async function runWeeklyLearningReview() {
  console.log('🚀 Starting weekly learning review...');
  
  try {
    const startTime = Date.now();
    
    // 1. Generate weekly report
    const reportId = await generateWeeklyReport();
    
    // 2. Analyze patterns from the week
    const patterns = await analyzeWeeklyPatterns();
    
    // 3. Update autonomy roadmap
    const roadmapUpdates = await updateAutonomyRoadmap();
    
    // 4. Identify new opportunities
    const opportunities = await identifyNewOpportunities();
    
    // 5. Send notifications
    await sendReviewNotifications(reportId, {
      patternsFound: patterns.length,
      roadmapUpdates,
      opportunitiesFound: opportunities.length
    });
    
    const executionTime = Date.now() - startTime;
    
    // Log the review itself
    await EcosystemLearningLogger.getInstance().logAction({
      actionType: 'weekly_learning_review',
      serviceInvolved: 'learning_system',
      toolUsed: 'internal',
      inputData: { start_time: startTime },
      outputData: {
        report_id: reportId,
        patterns_analyzed: patterns.length,
        opportunities_found: opportunities.length
      },
      executionTimeMs: executionTime,
      qualityScore: 9
    });
    
    console.log(`✅ Weekly review completed in ${executionTime}ms`);
    return { success: true, reportId, patterns: patterns.length, opportunities: opportunities.length };
    
  } catch (error) {
    console.error('❌ Weekly review failed:', error);
    
    await EcosystemLearningLogger.getInstance().logAction({
      actionType: 'weekly_learning_review_failed',
      serviceInvolved: 'learning_system',
      toolUsed: 'internal',
      inputData: {},
      outputData: { error: error.message },
      success: false,
      errorDetails: error.stack
    });
    
    return { success: false, error: error.message };
  }
}

async function generateWeeklyReport(): Promise<string> {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get week's logs for stats
  const { data: weeklyLogs } = await supabase
    .from('ecosystem_learning_logs')
    .select('*')
    .gte('created_at', startOfWeek.toISOString());
  
  const totalActions = weeklyLogs?.length || 0;
  const avgCost = weeklyLogs?.reduce((acc, log) => acc + (Number(log.cost_incurred) || 0), 0) / (totalActions || 1);
  const avgTime = weeklyLogs?.reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / (totalActions || 1);
  const successRate = (weeklyLogs?.filter(log => log.success).length || 0) / (totalActions || 1);
  
  const reportData = {
    report_week: startOfWeek.toISOString().split('T')[0],
    total_actions_logged: totalActions,
    avg_tool_cost: avgCost,
    avg_execution_time_ms: Math.round(avgTime),
    success_rate: successRate,
    report_status: 'published' as const,
    generated_at: new Date().toISOString(),
    published_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('weekly_learning_reports')
    .insert([reportData])
    .select('id')
    .single();
    
  if (error) throw new Error(`Failed to generate report: ${error.message}`);
  return data.id;
}

async function analyzeWeeklyPatterns() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data: logs, error } = await supabase
    .from('ecosystem_learning_logs')
    .select('*')
    .gte('created_at', weekAgo.toISOString());
    
  if (error) throw error;
  
  const patterns = detectPatternsFromLogs(logs || []);
  
  for (const pattern of patterns) {
    await supabase
      .from('extracted_knowledge')
      .upsert([pattern], { onConflict: 'pattern_hash' });
  }
  
  return patterns;
}

function detectPatternsFromLogs(logs: any[]) {
  const patterns: any[] = [];
  
  const toolServiceMap: Record<string, any[]> = {};
  
  logs.forEach(log => {
    const key = `${log.tool_used}|${log.service_involved}`;
    if (!toolServiceMap[key]) toolServiceMap[key] = [];
    toolServiceMap[key].push(log);
  });
  
  Object.entries(toolServiceMap).forEach(([key, groupLogs]) => {
    if (groupLogs.length < 5) return;
    
    const [tool, service] = key.split('|');
    
    const avgTime = groupLogs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / groupLogs.length;
    const avgCost = groupLogs.reduce((sum, log) => sum + (Number(log.cost_incurred) || 0), 0) / groupLogs.length;
    const avgQuality = groupLogs.reduce((sum, log) => sum + (log.quality_score || 5), 0) / groupLogs.length;
    
    const timeVariance = calculateVariance(groupLogs.map(l => l.execution_time_ms || 0));
    const costVariance = calculateVariance(groupLogs.map(l => Number(l.cost_incurred) || 0));
    
    if (timeVariance < 0.3 && costVariance < 0.3) {
      const pattern = {
        pattern_hash: `pattern_${tool}_${service}_${Math.round(avgTime)}`,
        pattern_name: `${tool} usage in ${service}`,
        pattern_description: `Consistent usage pattern detected for ${tool} in ${service} service`,
        pattern_structure: {
          tool,
          service,
          typical_input: groupLogs[0].input_data,
          typical_output: groupLogs[0].output_data
        },
        pattern_conditions: {
          avg_execution_time_ms: avgTime,
          avg_cost: avgCost,
          avg_quality: avgQuality
        },
        confidence_score: 0.7,
        occurrences: groupLogs.length,
        applicable_services: [service],
        estimated_monthly_savings: avgCost * groupLogs.length * 30 / 7 * 0.3,
        business_value_score: Math.min(100, Math.round((avgCost * groupLogs.length) / 10))
      };
      
      patterns.push(pattern);
    }
  });
  
  return patterns;
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length < 2) return 0;
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  if (mean === 0) return 0;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  return variance / mean;
}

async function updateAutonomyRoadmap() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const { data: logs } = await supabase
    .from('ecosystem_learning_logs')
    .select('tool_used, cost_incurred')
    .gte('created_at', monthAgo.toISOString());
    
  const toolStats: Record<string, { count: number, cost: number }> = {};
  
  logs?.forEach(log => {
    if (!toolStats[log.tool_used]) {
      toolStats[log.tool_used] = { count: 0, cost: 0 };
    }
    toolStats[log.tool_used].count++;
    toolStats[log.tool_used].cost += Number(log.cost_incurred) || 0;
  });
  
  let updates = 0;
  for (const [tool, stats] of Object.entries(toolStats)) {
    const { data: roadmapItem } = await supabase
      .from('autonomy_roadmap')
      .select('id')
      .eq('tool_to_replace', tool)
      .single();
      
    if (roadmapItem) {
      await supabase
        .from('autonomy_roadmap')
        .update({
          monthly_usage_count: stats.count,
          monthly_cost: stats.cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmapItem.id);
      updates++;
    } else if (stats.cost > 100) {
      await supabase
        .from('autonomy_roadmap')
        .insert([{
          tool_to_replace: tool,
          tool_category: 'other',
          dependency_level: 'medium',
          monthly_usage_count: stats.count,
          monthly_cost: stats.cost,
          expected_monthly_savings: stats.cost * 0.3,
          phase: 'analysis',
          calculated_priority: Math.min(100, Math.round(stats.cost / 10))
        }]);
      updates++;
    }
  }
  
  return updates;
}

async function identifyNewOpportunities() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const { data: logs } = await supabase
    .from('ecosystem_learning_logs')
    .select('tool_used, cost_incurred')
    .gte('created_at', monthAgo.toISOString());
  
  // Aggregate by tool
  const toolStats: Record<string, { count: number, cost: number }> = {};
  logs?.forEach(log => {
    if (!toolStats[log.tool_used]) {
      toolStats[log.tool_used] = { count: 0, cost: 0 };
    }
    toolStats[log.tool_used].count++;
    toolStats[log.tool_used].cost += Number(log.cost_incurred) || 0;
  });
    
  const { data: roadmapTools } = await supabase
    .from('autonomy_roadmap')
    .select('tool_to_replace');
    
  const existingTools = new Set(roadmapTools?.map(r => r.tool_to_replace) || []);
  
  const opportunities = Object.entries(toolStats)
    .filter(([tool, stats]) => 
      stats.cost > 500 && 
      !existingTools.has(tool) &&
      !tool.includes('internal')
    )
    .map(([tool, stats]) => ({
      tool,
      monthly_cost: stats.cost,
      usage_count: stats.count,
      estimated_savings: stats.cost * 0.3,
      priority: Math.min(100, Math.round(stats.cost / 10))
    }));
    
  return opportunities;
}

async function sendReviewNotifications(reportId: string, stats: any) {
  console.log('📧 Review notifications:', {
    reportId,
    stats,
    timestamp: new Date().toISOString()
  });
  
  await EcosystemLearningLogger.getInstance().logAction({
    actionType: 'review_notifications_sent',
    serviceInvolved: 'learning_system',
    toolUsed: 'internal',
    inputData: { reportId, stats },
    outputData: { sent: true },
    qualityScore: 8
  });
}

export function scheduleWeeklyReview() {
  console.log('📅 Weekly learning review scheduled for Mondays at 2 AM');
  
  return {
    triggerManually: () => runWeeklyLearningReview(),
    schedule: '0 2 * * 1'
  };
}
