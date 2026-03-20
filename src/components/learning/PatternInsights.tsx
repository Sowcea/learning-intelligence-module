import { Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Pattern {
  id: string;
  pattern_name: string;
  pattern_description?: string;
  confidence_score?: number;
  business_value_score?: number;
  estimated_monthly_savings?: number;
  learning_phase?: string;
  occurrences?: number;
}

interface PatternInsightsProps {
  patterns: Pattern[];
  totalPatterns: number;
}

export default function PatternInsights({ patterns, totalPatterns }: PatternInsightsProps) {
  const getPhaseColor = (phase?: string) => {
    switch (phase) {
      case 'discovered': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'analyzing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'validated': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'implemented': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'optimized': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Lightbulb className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-bold">Pattern Insights</h2>
        </div>
        <Badge variant="secondary">
          {patterns.length} high-value / {totalPatterns} total
        </Badge>
      </div>

      {patterns.length > 0 ? (
        <div className="space-y-4">
          {patterns.slice(0, 5).map((pattern) => (
            <div 
              key={pattern.id}
              className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{pattern.pattern_name}</h3>
                  {pattern.pattern_description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {pattern.pattern_description}
                    </p>
                  )}
                </div>
                <Badge className={getPhaseColor(pattern.learning_phase)}>
                  {pattern.learning_phase || 'discovered'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(pattern.confidence_score || 0) * 100} 
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">
                      {Math.round((pattern.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Value Score</div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-semibold">{pattern.business_value_score || 0}</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Est. Savings</div>
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-semibold text-green-600">
                      ${(pattern.estimated_monthly_savings || 0).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-xs">/mo</span>
                  </div>
                </div>
              </div>
              
              {pattern.occurrences && pattern.occurrences > 1 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Detected {pattern.occurrences} times
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No high-value patterns detected yet</p>
          <p className="text-sm mt-1">
            Continue logging actions to discover optimization opportunities
          </p>
        </div>
      )}
    </div>
  );
}
