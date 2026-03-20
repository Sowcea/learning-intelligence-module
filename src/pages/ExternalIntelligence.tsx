import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, Users, Eye, ExternalLink, Zap, Settings, Play, Pause, CheckCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/LearningLayout";
import { MotherBrainConnector } from "@/lib/learning/integrations/MotherBrainConnector";
import { ExternalIntelligenceAutomator } from "@/lib/learning/automation";

interface DashboardData {
  generated_at: string;
  summary: {
    tools_monitored: number;
    recent_updates: number;
    critical_updates: number;
    high_updates: number;
    action_required: number;
    active_trends: number;
    competitors_tracked: number;
    last_feed_to_mb: string | null;
  };
  recent_updates: any[];
  market_trends: any[];
  competitors: any[];
  monitored_tools: any[];
}

interface AutomationRule {
  id: string;
  rule_name: string;
  rule_description: string;
  trigger_type: string;
  trigger_conditions: any;
  actions: any[];
  is_active: boolean;
  priority: number;
  last_triggered_at: string | null;
  trigger_count: number;
}

const ExternalIntelligenceDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingAutomations, setProcessingAutomations] = useState(false);

  // Get active tab from URL, default to "updates"
  const activeTab = searchParams.get('tab') || 'updates';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    fetchData();
    fetchAutomationRules();
  }, []);

  const fetchData = async () => {
    try {
      const result = await MotherBrainConnector.getIntelligenceDashboard();
      setData(result);
    } catch (error) {
      console.error('Error fetching intelligence data:', error);
      toast.error('Failed to load external intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAutomationRules = async () => {
    try {
      const rules = await ExternalIntelligenceAutomator.getAutomationRules();
      setAutomationRules(rules as AutomationRule[]);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await ExternalIntelligenceAutomator.toggleAutomationRule(ruleId, isActive);
      toast.success(`Automation rule ${isActive ? 'enabled' : 'disabled'}`);
      await fetchAutomationRules();
    } catch (error) {
      toast.error('Failed to toggle automation rule');
    }
  };

  const handleProcessPendingUpdates = async () => {
    setProcessingAutomations(true);
    try {
      const results = await ExternalIntelligenceAutomator.processAllPendingUpdates();
      toast.success(`Processed ${results.length} updates with automated responses`);
      await fetchData();
      await fetchAutomationRules();
    } catch (error) {
      toast.error('Failed to process pending updates');
    } finally {
      setProcessingAutomations(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await MotherBrainConnector.triggerExternalMonitoringCycle();
      toast.success('External monitoring cycle triggered');
      await fetchData();
    } catch (error) {
      toast.error('Failed to trigger monitoring cycle');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFeedToMotherBrain = async () => {
    try {
      const result = await MotherBrainConnector.feedExternalDataToMotherBrain();
      toast.success(`Intelligence fed to Mother Brain: ${result.summary}`);
      await fetchData();
    } catch (error) {
      toast.error('Failed to feed data to Mother Brain');
    }
  };

  const handleInitialize = async () => {
    try {
      await MotherBrainConnector.initializeExternalMonitoring();
      toast.success('External monitoring initialized with default tools');
      await fetchData();
    } catch (error) {
      toast.error('Failed to initialize monitoring');
    }
  };

  const getImpactBadge = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      none: 'bg-gray-500'
    };
    return <Badge className={colors[level] || 'bg-gray-500'}>{level}</Badge>;
  };

  const getThreatBadge = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      high: 'bg-red-400 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-green-500 text-white',
      none: 'bg-gray-400'
    };
    return <Badge className={colors[level] || 'bg-gray-400'}>{level}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="animate-spin h-8 w-8 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/learning/intelligence')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning
          </Button>
          <div>
            <h1 className="text-3xl font-bold">External Intelligence</h1>
            <p className="text-muted-foreground">Monitor external tools, competitors & market trends</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInitialize}>
            Initialize Tools
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Run Cycle
          </Button>
          <Button onClick={handleFeedToMotherBrain}>
            <Zap className="h-4 w-4 mr-2" />
            Feed to Mother Brain
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{data?.summary.tools_monitored || 0}</div>
            <div className="text-sm text-muted-foreground">Tools Monitored</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{data?.summary.recent_updates || 0}</div>
            <div className="text-sm text-muted-foreground">Recent Updates</div>
          </CardContent>
        </Card>
        <Card className="border-red-500/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{data?.summary.critical_updates || 0}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-500">{data?.summary.action_required || 0}</div>
            <div className="text-sm text-muted-foreground">Action Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{data?.summary.active_trends || 0}</div>
            <div className="text-sm text-muted-foreground">Active Trends</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{data?.summary.competitors_tracked || 0}</div>
            <div className="text-sm text-muted-foreground">Competitors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs font-mono">
              {data?.summary.last_feed_to_mb 
                ? new Date(data.summary.last_feed_to_mb).toLocaleDateString()
                : 'Never'}
            </div>
            <div className="text-sm text-muted-foreground">Last MB Feed</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="updates">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Updates ({data?.recent_updates.length || 0})
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market Trends ({data?.market_trends.length || 0})
          </TabsTrigger>
          <TabsTrigger value="competitors">
            <Users className="h-4 w-4 mr-2" />
            Competitors ({data?.competitors.length || 0})
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Eye className="h-4 w-4 mr-2" />
            Monitored Tools ({data?.monitored_tools.length || 0})
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Settings className="h-4 w-4 mr-2" />
            Automation ({automationRules.length})
          </TabsTrigger>
        </TabsList>

        {/* Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          {data?.recent_updates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No recent updates detected. Run a monitoring cycle to check for updates.
              </CardContent>
            </Card>
          ) : (
            data?.recent_updates.map((update: any) => (
              <Card key={update.id} className={update.impact_level === 'critical' ? 'border-red-500' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{update.title}</CardTitle>
                    <div className="flex gap-2">
                      {getImpactBadge(update.impact_level)}
                      <Badge variant="outline">{update.update_type}</Badge>
                      {update.requires_action && <Badge variant="destructive">Action Required</Badge>}
                    </div>
                  </div>
                  <CardDescription>
                    {update.external_tool_monitoring?.tool_name || 'Unknown Tool'} • 
                    Detected: {new Date(update.detected_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{update.description?.substring(0, 300)}...</p>
                  {update.ai_summary && (
                    <p className="text-sm italic border-l-2 border-primary pl-2">{update.ai_summary}</p>
                  )}
                  {update.source_url && (
                    <Button variant="link" className="p-0 h-auto mt-2" asChild>
                      <a href={update.source_url} target="_blank" rel="noopener noreferrer">
                        View Source <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {data?.market_trends.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No market trends being monitored. Run a monitoring cycle to detect trends.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data?.market_trends.map((trend: any) => (
                <Card key={trend.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{trend.trend_name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline">{trend.trend_category}</Badge>
                      <Badge className={
                        trend.impact_on_us.includes('positive') ? 'ml-2 bg-green-500' : 
                        trend.impact_on_us.includes('negative') ? 'ml-2 bg-red-500' : 
                        'ml-2 bg-gray-500'
                      }>
                        {trend.impact_on_us}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                    <div className="mt-2 flex gap-4 text-xs">
                      <span>Confidence: {(trend.confidence_score * 100).toFixed(0)}%</span>
                      <span>Momentum: {trend.trend_momentum}</span>
                      <span>Timeframe: {trend.timeframe}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          {data?.competitors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No competitors being tracked. Initialize monitoring to add default competitors.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.competitors.map((competitor: any) => (
                <Card key={competitor.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{competitor.competitor_name}</CardTitle>
                      {getThreatBadge(competitor.threat_level)}
                    </div>
                    <CardDescription>
                      <Badge variant="outline">{competitor.competitor_type}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {competitor.website && (
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <a href={competitor.website} target="_blank" rel="noopener noreferrer">
                          {competitor.website} <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <span>Opportunity: {(competitor.opportunity_score * 100).toFixed(0)}%</span>
                      <span>Feature Gap: {(competitor.feature_gap_score * 100).toFixed(0)}%</span>
                    </div>
                    {competitor.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{competitor.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          {data?.monitored_tools.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No tools being monitored. Click "Initialize Tools" to add default tools.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.monitored_tools.map((tool: any) => (
                <Card key={tool.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                      <Badge className={tool.monitoring_status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                        {tool.monitoring_status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {tool.vendor} • {tool.tool_category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tool.website && (
                      <Button variant="link" className="p-0 h-auto text-xs" asChild>
                        <a href={tool.website} target="_blank" rel="noopener noreferrer">
                          Website <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {tool.monitor_pricing && <Badge variant="secondary" className="text-xs">Pricing</Badge>}
                      {tool.monitor_features && <Badge variant="secondary" className="text-xs">Features</Badge>}
                      {tool.monitor_security && <Badge variant="secondary" className="text-xs">Security</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last checked: {tool.last_checked_at 
                        ? new Date(tool.last_checked_at).toLocaleString() 
                        : 'Never'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Automation Rules</h3>
              <p className="text-sm text-muted-foreground">Configure automated responses to external updates</p>
            </div>
            <Button 
              onClick={handleProcessPendingUpdates} 
              disabled={processingAutomations}
              variant="outline"
            >
              <Play className={`h-4 w-4 mr-2 ${processingAutomations ? 'animate-spin' : ''}`} />
              Process Pending Updates
            </Button>
          </div>

          {automationRules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No automation rules configured. Initialize monitoring to add default rules.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {automationRules.map((rule) => (
                <Card key={rule.id} className={rule.is_active ? 'border-primary/50' : 'opacity-60'}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className={`h-5 w-5 ${rule.is_active ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                        <CardTitle className="text-base">{rule.rule_name}</CardTitle>
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                    </div>
                    <CardDescription>{rule.rule_description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{rule.trigger_type.replace(/_/g, ' ')}</Badge>
                      <Badge variant="secondary">Priority: {rule.priority}</Badge>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Actions:</div>
                      <div className="flex flex-wrap gap-1">
                        {rule.actions.map((action: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {action.type?.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Triggered: {rule.trigger_count || 0} times</span>
                      <span>
                        Last: {rule.last_triggered_at 
                          ? new Date(rule.last_triggered_at).toLocaleDateString() 
                          : 'Never'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Connected Systems */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Connected Systems</CardTitle>
              <CardDescription>Integration status with other ecosystem components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Mother Brain', icon: '🧠', status: 'connected' },
                  { name: 'Learning System', icon: '📚', status: 'connected' },
                  { name: 'Autonomy Roadmap', icon: '🗺️', status: 'synced' },
                  { name: 'Task Manager', icon: '✅', status: 'connected' },
                  { name: 'Alert System', icon: '🚨', status: 'connected' },
                  { name: 'Analytics', icon: '📊', status: 'connected' },
                ].map((system) => (
                  <div key={system.name} className="flex flex-col items-center p-3 rounded-lg border bg-card">
                    <span className="text-2xl mb-1">{system.icon}</span>
                    <span className="text-xs font-medium text-center">{system.name}</span>
                    <Badge className="mt-1 text-[10px]" variant={system.status === 'connected' ? 'default' : 'secondary'}>
                      {system.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
};

export default ExternalIntelligenceDashboard;
