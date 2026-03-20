import { supabase } from "@/integrations/supabase/client";

interface IntelligencePackage {
  timestamp: string;
  critical_updates: any[];
  high_impact_trends: any[];
  competitor_threats: any[];
  summary: string;
  actions_required: number;
}

interface ExternalUpdate {
  id: string;
  monitoring_id: string;
  update_type: string;
  title: string;
  impact_level: string;
  affects_our_usage: boolean;
  requires_action: boolean;
  detected_at: string;
}

interface MarketTrend {
  id: string;
  trend_name: string;
  trend_category: string;
  impact_on_us: string;
  impact_magnitude: number;
  status: string;
}

interface CompetitorBenchmark {
  id: string;
  competitor_name: string;
  competitor_type: string;
  threat_level: string;
  opportunity_score: number;
}

export class MotherBrainConnector {
  /**
   * Feed external intelligence data to Mother Brain for analysis
   */
  static async feedExternalDataToMotherBrain(): Promise<IntelligencePackage> {
    console.log('🧠 Feeding external data to Mother Brain...');
    
    // 1. Get critical external updates
    const { data: criticalUpdates } = await supabase
      .from('external_tool_updates')
      .select('*')
      .in('impact_level', ['critical', 'high'])
      .eq('status', 'new')
      .order('detected_at', { ascending: false })
      .limit(50);
    
    // 2. Get market trends with high impact
    const { data: highImpactTrends } = await supabase
      .from('market_trends')
      .select('*')
      .in('impact_on_us', ['very_positive', 'very_negative'])
      .eq('status', 'monitoring')
      .order('impact_magnitude', { ascending: false })
      .limit(20);
    
    // 3. Get competitor threats
    const { data: competitorThreats } = await supabase
      .from('competitor_benchmarks')
      .select('*')
      .in('threat_level', ['critical', 'high'])
      .order('threat_level', { ascending: false })
      .limit(10);
    
    // Combine into intelligence package
    const intelligencePackage: IntelligencePackage = {
      timestamp: new Date().toISOString(),
      critical_updates: criticalUpdates || [],
      high_impact_trends: highImpactTrends || [],
      competitor_threats: competitorThreats || [],
      summary: this.generateIntelligenceSummary(
        criticalUpdates || [], 
        highImpactTrends || [], 
        competitorThreats || []
      ),
      actions_required: (criticalUpdates || []).filter((u: any) => u.requires_action).length
    };
    
    // 4. Feed to Mother Brain (store in knowledge base)
    await supabase
      .from('extracted_knowledge')
      .insert([{
        pattern_hash: `external_intelligence_${Date.now()}`,
        pattern_name: 'External Intelligence Package',
        pattern_description: intelligencePackage.summary,
        pattern_structure: JSON.parse(JSON.stringify(intelligencePackage)),
        confidence_score: 0.9,
        applicable_services: ['all'],
        business_value_score: 95,
        learning_phase: 'validated'
      }]);
    
    // 5. Update autonomy roadmap based on external changes
    await this.updateRoadmapFromExternalData(criticalUpdates || []);
    
    // 6. Log the action
    await supabase
      .from('ecosystem_learning_logs')
      .insert([{
        action_type: 'mother_brain_feed',
        service_involved: 'mother_brain',
        tool_used: 'external_intelligence',
        input_data: { 
          updates_count: (criticalUpdates || []).length,
          trends_count: (highImpactTrends || []).length,
          threats_count: (competitorThreats || []).length
        },
        output_data: { summary: intelligencePackage.summary },
        success: true,
        quality_score: 9
      }]);
    
    console.log('✅ External intelligence fed to Mother Brain');
    return intelligencePackage;
  }
  
  /**
   * Generate a human-readable summary of intelligence findings
   */
  private static generateIntelligenceSummary(
    updates: ExternalUpdate[], 
    trends: MarketTrend[], 
    competitors: CompetitorBenchmark[]
  ): string {
    const parts: string[] = [];
    
    if (updates.length > 0) {
      const criticalCount = updates.filter(u => u.impact_level === 'critical').length;
      parts.push(`${updates.length} critical/high external updates (${criticalCount} critical)`);
    }
    
    if (trends.length > 0) {
      const positiveCount = trends.filter(t => t.impact_on_us === 'very_positive').length;
      const negativeCount = trends.filter(t => t.impact_on_us === 'very_negative').length;
      parts.push(`${trends.length} high-impact trends (${positiveCount} positive, ${negativeCount} negative)`);
    }
    
    if (competitors.length > 0) {
      parts.push(`${competitors.length} competitor threats identified`);
    }
    
    return parts.join(', ') || 'No significant external intelligence detected';
  }
  
  /**
   * Update autonomy roadmap priorities based on external changes
   */
  private static async updateRoadmapFromExternalData(updates: ExternalUpdate[]) {
    for (const update of updates) {
      if (update.affects_our_usage && update.requires_action) {
        // Find corresponding tool info
        const { data: toolInfo } = await supabase
          .from('external_tool_monitoring')
          .select('tool_name')
          .eq('id', update.monitoring_id)
          .single();
        
        if (toolInfo) {
          // Check if tool exists in roadmap
          const { data: existingRoadmap } = await supabase
            .from('autonomy_roadmap')
            .select('id, notes')
            .eq('tool_to_replace', toolInfo.tool_name)
            .single();
          
          if (existingRoadmap) {
            // Update priority based on external change
            await supabase
              .from('autonomy_roadmap')
              .update({
                manual_priority_override: 100, // Highest priority
                notes: `CRITICAL: External change detected - ${update.title}. Previous notes: ${existingRoadmap.notes || 'None'}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRoadmap.id);
          } else {
            // Create new roadmap entry for critical external tool change
            await supabase
              .from('autonomy_roadmap')
              .insert([{
                tool_to_replace: toolInfo.tool_name,
                tool_category: 'external_triggered',
                dependency_level: 'high',
                phase: 'analysis',
                calculated_priority: 90,
                manual_priority_override: 100,
                notes: `CRITICAL: External change detected - ${update.title}. Requires immediate attention.`
              }]);
          }
        }
      }
    }
  }

  /**
   * Get complete intelligence dashboard data
   */
  static async getIntelligenceDashboard() {
    const [updates, trends, competitors, tools, recentLogs] = await Promise.all([
      supabase
        .from('external_tool_updates')
        .select('*, external_tool_monitoring(tool_name, vendor)')
        .order('detected_at', { ascending: false })
        .limit(20),
      supabase
        .from('market_trends')
        .select('*')
        .eq('status', 'monitoring')
        .order('confidence_score', { ascending: false })
        .limit(10),
      supabase
        .from('competitor_benchmarks')
        .select('*')
        .order('threat_level', { ascending: true })
        .limit(10),
      supabase
        .from('external_tool_monitoring')
        .select('*')
        .eq('is_active', true),
      supabase
        .from('ecosystem_learning_logs')
        .select('*')
        .eq('action_type', 'mother_brain_feed')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    
    return {
      generated_at: new Date().toISOString(),
      summary: {
        tools_monitored: tools.data?.length || 0,
        recent_updates: updates.data?.length || 0,
        critical_updates: updates.data?.filter((u: any) => u.impact_level === 'critical').length || 0,
        high_updates: updates.data?.filter((u: any) => u.impact_level === 'high').length || 0,
        action_required: updates.data?.filter((u: any) => u.requires_action).length || 0,
        active_trends: trends.data?.length || 0,
        competitors_tracked: competitors.data?.length || 0,
        last_feed_to_mb: recentLogs.data?.[0]?.created_at || null
      },
      recent_updates: updates.data || [],
      market_trends: trends.data || [],
      competitors: competitors.data || [],
      monitored_tools: tools.data || [],
      feed_history: recentLogs.data || []
    };
  }

  /**
   * Trigger a full external monitoring cycle via edge function
   */
  static async triggerExternalMonitoringCycle() {
    const response = await fetch(
      `https://dtqqjeaadboqrhbldicj.supabase.co/functions/v1/external-brain-agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ action: 'run-cycle' })
      }
    );
    
    return response.json();
  }

  /**
   * Initialize external tool monitoring with default tools
   */
  static async initializeExternalMonitoring() {
    const response = await fetch(
      `https://dtqqjeaadboqrhbldicj.supabase.co/functions/v1/external-brain-agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ action: 'initialize' })
      }
    );
    
    return response.json();
  }
}

// Export singleton methods for convenience
export const feedExternalToMotherBrain = MotherBrainConnector.feedExternalDataToMotherBrain;
export const getIntelligenceDashboard = MotherBrainConnector.getIntelligenceDashboard;
export const triggerExternalCycle = MotherBrainConnector.triggerExternalMonitoringCycle;
export const initializeExternalMonitoring = MotherBrainConnector.initializeExternalMonitoring;
