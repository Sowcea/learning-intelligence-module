import { FileText, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Report {
  id: string;
  report_week: string;
  report_status: string;
  total_actions_logged?: number;
  new_patterns_discovered?: number;
  estimated_opportunities_value?: number;
  success_rate?: number;
  published_at?: string;
}

interface WeeklyReportsProps {
  reports: Report[];
}

export default function WeeklyReports({ reports }: WeeklyReportsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'draft': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'generating': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatWeekDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-bold">Weekly Reports</h2>
        </div>
        <Badge variant="outline">{reports.length} reports</Badge>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="font-medium text-sm">
                    Week of {formatWeekDate(report.report_week)}
                  </span>
                </div>
                <Badge className={getStatusColor(report.report_status)} variant="secondary">
                  {report.report_status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {report.total_actions_logged?.toLocaleString() || 0} actions
                </div>
                <div className="flex items-center text-muted-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {Math.round((report.success_rate || 0) * 100)}% success
                </div>
              </div>
              
              {report.estimated_opportunities_value && report.estimated_opportunities_value > 0 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                  💰 ${report.estimated_opportunities_value.toLocaleString()} opportunities identified
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No reports generated yet</p>
          <p className="text-xs mt-1">Generate your first weekly report above</p>
        </div>
      )}
    </div>
  );
}
