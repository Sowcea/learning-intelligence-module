import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string;
  change?: string;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-100 dark:border-green-900'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    icon: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-100 dark:border-orange-900'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-900'
  }
};

export default function DashboardCard({ title, value, change, icon, color = 'blue' }: DashboardCardProps) {
  const colors = colorClasses[color];
  const isPositive = change?.startsWith('+');
  const isNegative = change?.startsWith('-');

  return (
    <div className={cn(
      "rounded-xl border p-6 transition-all hover:shadow-md",
      colors.bg,
      colors.border
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          
          {change && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              isPositive && "text-green-600 dark:text-green-400",
              isNegative && color !== 'purple' && "text-red-600 dark:text-red-400",
              isNegative && color === 'purple' && "text-green-600 dark:text-green-400" // For time, negative is good
            )}>
              {change} vs last period
            </p>
          )}
        </div>
        
        <div className={cn(
          "p-3 rounded-lg",
          colors.bg,
          colors.icon
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
