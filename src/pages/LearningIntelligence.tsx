import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardCard from '@/components/learning/DashboardCard';
import PatternInsights from '@/components/learning/PatternInsights';
import AutonomyRoadmap from '@/components/learning/AutonomyRoadmap';
import WeeklyReports from '@/components/learning/WeeklyReports';
import { generateWeeklyLearningReport, syncFallbackLogs } from '@/lib/learning';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/LearningLayout';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Brain,
  Target,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

interface DashboardMetrics {
  totalActions: number;
  totalCost: number;
  avgTime: number;
  avgQuality: number;
  successRate: number;
  uniqueTools: number;
  uniqueServices: number;
  estimatedMonthlySavings: number;
}

interface ToolStats {
  tool: string;
  count: number;
  cost: number;
  avgCost: number;
}

interface KpiChange {
  kpi_name: string;
  current_value: number;
  previous_value: number;
  change_pct: number | null;
  change_direction: string;
}

export default function LearningIntelligenceDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [generating, setGenerating] = useState(false);
  const [kpiChanges, setKpiChanges] = useState<Record<string, KpiChange>>({});

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  useEffect(() => {
    const fetchKpiChanges = async () => {
      try {
        const { data, error } = await supabase.rpc('get_learning_kpi_changes') as { data: KpiChange[] | null; error: any };
        if (error) throw error;
        if (data) {
          const mapped: Record<string, KpiChange> = {};
          data.forEach((row) => {
            mapped[row.kpi_name] = row;
          });
          setKpiChanges(mapped);
        }
      } catch (err) {
        console.warn('KPI changes RPC not available yet:', err);
      }
    };
    fetchKpiChanges();
  }, [timeRange]);

  useEffect(() => {
    const handleOnline = () => {
      syncFallbackLogs().then((count) => {
        if (count > 0) {
          toast.success(`Synced ${count} fallback logs to Supabase`);
        }
      });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const formatKpiChange = (kpiName: string): string => {
    const kpi = kpiChanges[kpiName];
    if (!kpi || kpi.previous_value === 0 || kpi.change_pct === null) return '—';
    const sign = kpi.change_pct >= 0 ? '+' : '';
    return `${sign}${kpi.change_pct}%`;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dateThreshold = getDateRange(timeRange);
      
      const [logsRes, knowledgeRes, roadmapRes, reportsRes] = await Promise.all([
        supabase
          .from('ecosystem_learning_logs')
          .select('*')
          .gte('created_at', dateThreshold)
          .order('created_at', { ascending: false })
          .limit(1000),
        
        supabase
          .from('extracted_knowledge')
          .select('*')
          .order('business_value_score', { ascending: false })
          .limit(50),
        
        supabase
          .from('autonomy_roadmap')
          .select('*')
          .order('final_priority', { ascending: false }),
        
        supabase
          .from('weekly_learning_reports')
          .select('*')
          .order('report_week', { ascending: false })
          .limit(4)
      ]);

      const logs = logsRes.data || [];
      const knowledge = knowledgeRes.data || [];
      const roadmap = roadmapRes.data || [];
      const reports = reportsRes.data || [];

      const metrics = calculateMetrics(logs);
      
      setDashboardData({
        logs,
        knowledge,
        roadmap,
        reports,
        metrics,
        topTools: getTopTools(logs),
        highValuePatterns: knowledge.filter(k => (k.business_value_score || 0) > 70),
        criticalRoadmapItems: roadmap.filter(r => r.dependency_level === 'critical')
      });

      syncFallbackLogs().catch((err) =>
        console.warn('Fallback log sync failed:', err)
      );
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '24h': now.setDate(now.getDate() - 1); break;
      case '7d': now.setDate(now.getDate() - 7); break;
      case '30d': now.setDate(now.getDate() - 30); break;
      case '90d': now.setDate(now.getDate() - 90); break;
      default: now.setDate(now.getDate() - 7);
    }
    return now.toISOString();
  };

  const calculateMetrics = (logs: any[]): DashboardMetrics => {
    if (!logs.length) {
      return {
        totalActions: 0,
        totalCost: 0,
        avgTime: 0,
        avgQuality: 0,
        successRate: 0,
        uniqueTools: 0,
        uniqueServices: 0,
        estimatedMonthlySavings: 0
      };
    }
    
    const totalCost = logs.reduce((sum, log) => sum + (Number(log.cost_incurred) || 0), 0);
    const avgTime = logs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / logs.length;
    const avgQuality = logs.reduce((sum, log) => sum + (log.quality_score || 5), 0) / logs.length;
    const successRate = (logs.filter(log => log.success).length / logs.length) * 100;
    
    const tools = [...new Set(logs.map(log => log.tool_used))];
    const services = [...new Set(logs.map(log => log.service_involved))];
    
    return {
      totalActions: logs.length,
      totalCost,
      avgTime,
      avgQuality,
      successRate,
      uniqueTools: tools.length,
      uniqueServices: services.length,
      estimatedMonthlySavings: totalCost * 0.3 * 30
    };
  };

  const getTopTools = (logs: any[]): ToolStats[] => {
    const toolCounts: Record<string, number> = {};
    const toolCosts: Record<string, number> = {};
    
    logs.forEach(log => {
      toolCounts[log.tool_used] = (toolCounts[log.tool_used] || 0) + 1;
      toolCosts[log.tool_used] = (toolCosts[log.tool_used] || 0) + (Number(log.cost_incurred) || 0);
    });
    
    return Object.entries(toolCounts)
      .map(([tool, count]) => ({
        tool,
        count,
        cost: toolCosts[tool],
        avgCost: toolCosts[tool] / count
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const reportId = await generateWeeklyLearningReport();
      if (reportId && reportId !== 'error') {
        toast.success('Weekly report generated successfully');
        fetchDashboardData();
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      toast.error('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading learning intelligence...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🧠 Learning Intelligence</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered insights for ecosystem optimization and autonomy
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchDashboardData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Actions"
          value={dashboardData?.metrics.totalActions?.toLocaleString() || '0'}
          change={formatKpiChange('total_actions')}
          icon={<BarChart3 className="h-6 w-6" />}
          color="blue"
        />
        
        <DashboardCard
          title="Monthly Savings Potential"
          value={`$${(dashboardData?.metrics.estimatedMonthlySavings || 0).toLocaleString()}`}
          change={formatKpiChange('monthly_savings')}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        
        <DashboardCard
          title="Avg Execution Time"
          value={`${Math.round(dashboardData?.metrics.avgTime || 0)}ms`}
          change={formatKpiChange('avg_execution_time')}
          icon={<Clock className="h-6 w-6" />}
          color="purple"
        />
        
        <DashboardCard
          title="Success Rate"
          value={`${Math.round(dashboardData?.metrics.successRate || 0)}%`}
          change={formatKpiChange('success_rate')}
          icon={<TrendingUp className="h-6 w-6" />}
          color="orange"
        />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patterns & Insights */}
        <div className="lg:col-span-2 space-y-6">
          <PatternInsights 
            patterns={dashboardData?.highValuePatterns || []}
            totalPatterns={dashboardData?.knowledge.length || 0}
          />
          
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Top Tools by Cost
              </h2>
              <span className="text-sm text-muted-foreground">
                Last {timeRange}
              </span>
            </div>
            
            <div className="space-y-4">
              {dashboardData?.topTools?.length > 0 ? (
                dashboardData.topTools.map((tool: ToolStats, index: number) => (
                  <div key={tool.tool} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <span className="text-primary font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{tool.tool}</div>
                        <div className="text-sm text-muted-foreground">
                          {tool.count.toLocaleString()} uses
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-destructive">
                        ${tool.cost.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${tool.avgCost.toFixed(4)} per use
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tool usage data available yet. Start logging actions to see insights.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Roadmap & Reports */}
        <div className="space-y-6">
          <AutonomyRoadmap 
            items={dashboardData?.criticalRoadmapItems || []}
            totalItems={dashboardData?.roadmap.length || 0}
          />
          
          <WeeklyReports 
            reports={dashboardData?.reports || []}
          />
          
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6">
            <div className="flex items-center mb-3">
              <Brain className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-lg font-bold">Learning Status</h3>
            </div>
            
            <p className="text-muted-foreground mb-4">
              System has analyzed {dashboardData?.metrics.totalActions?.toLocaleString() || '0'} actions 
              across {dashboardData?.metrics.uniqueServices || '0'} services.
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Patterns Detected:</span>
                <span className="font-bold">{dashboardData?.knowledge.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>High-Value Insights:</span>
                <span className="font-bold">{dashboardData?.highValuePatterns?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Autonomy Projects:</span>
                <span className="font-bold">{dashboardData?.roadmap.length || 0}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateReport} 
              disabled={generating}
              className="w-full mt-4"
            >
              {generating ? 'Generating...' : 'Generate Weekly Report'}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
