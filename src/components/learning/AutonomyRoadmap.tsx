import { Rocket, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RoadmapItem {
  id: string;
  tool_to_replace: string;
  tool_category: string;
  vendor_name?: string;
  dependency_level: string;
  monthly_cost?: number;
  expected_monthly_savings?: number;
  phase: string;
  percent_complete?: number;
  replacement_name?: string;
  final_priority?: number;
}

interface AutonomyRoadmapProps {
  items: RoadmapItem[];
  totalItems: number;
}

export default function AutonomyRoadmap({ items, totalItems }: AutonomyRoadmapProps) {
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'analysis': return <Clock className="h-4 w-4" />;
      case 'planning': return <Wrench className="h-4 w-4" />;
      case 'development': return <Rocket className="h-4 w-4" />;
      case 'testing': return <AlertTriangle className="h-4 w-4" />;
      case 'live': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'analysis': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'development': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'testing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'deployment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'live': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getDependencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Rocket className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-bold">Autonomy Roadmap</h2>
        </div>
        <Badge variant="outline">
          {items.length} critical / {totalItems} total
        </Badge>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.slice(0, 4).map((item) => (
            <div 
              key={item.id}
              className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">{item.tool_to_replace}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.vendor_name || item.tool_category}
                  </div>
                </div>
                <Badge className={getPhaseColor(item.phase)} variant="secondary">
                  <span className="mr-1">{getPhaseIcon(item.phase)}</span>
                  {item.phase}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={getDependencyColor(item.dependency_level)}>
                  {item.dependency_level} dependency
                </span>
                <span className="text-muted-foreground">
                  Priority: {item.final_priority || 'N/A'}
                </span>
              </div>
              
              {item.percent_complete !== undefined && item.percent_complete > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{item.percent_complete}%</span>
                  </div>
                  <Progress value={item.percent_complete} className="h-1.5" />
                </div>
              )}
              
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-destructive">
                  Cost: ${(Number(item.monthly_cost) || 0).toLocaleString()}/mo
                </span>
                <span className="text-green-600 dark:text-green-400">
                  Save: ${(Number(item.expected_monthly_savings) || 0).toLocaleString()}/mo
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Rocket className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No critical dependencies found</p>
        </div>
      )}
      
      {totalItems > items.length && (
        <button className="w-full mt-4 text-sm text-primary hover:underline">
          View all {totalItems} roadmap items →
        </button>
      )}
    </div>
  );
}
