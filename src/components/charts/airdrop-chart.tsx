'use client';

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Shield } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  change?: number;
  [key: string]: any;
}

interface AirdropChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  data: ChartData[];
  title: string;
  description?: string;
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  showTrend?: boolean;
  formatValue?: (value: number) => string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AirdropChart({
  type,
  data,
  title,
  description,
  dataKey,
  xAxisKey = 'name',
  color = '#8884d8',
  height = 300,
  showTrend = false,
  formatValue = (value) => value.toString(),
}: AirdropChartProps) {
  const calculateTrend = () => {
    if (data.length < 2) return { value: 0, isPositive: true };
    const recent = data.slice(-2);
    const change = ((recent[1][dataKey] - recent[0][dataKey]) / recent[0][dataKey]) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const trend = calculateTrend();

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={formatValue}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [formatValue(value), dataKey]}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={formatValue}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [formatValue(value), dataKey]}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={formatValue}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [formatValue(value), dataKey]}
            />
            <Bar 
              dataKey={dataKey} 
              fill={color}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [formatValue(value), dataKey]}
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {showTrend && (
          <div className="flex items-center space-x-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <Badge 
              variant={trend.isPositive ? "default" : "destructive"}
              className="text-xs"
            >
              {trend.value.toFixed(1)}%
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  description, 
  format = 'number' 
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  format?: 'currency' | 'percentage' | 'number';
}) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'number':
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change !== undefined && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change)}%
            </span>
            <span>from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats({ data }: { data: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Value"
        value={data.totalValue || 0}
        change={data.valueChange || 12.5}
        icon={<DollarSign />}
        description="Estimated airdrop value"
        format="currency"
      />
      <StatsCard
        title="Active Airdrops"
        value={data.activeAirdrops || 0}
        change={data.activeChange || 8.2}
        icon={<Target />}
        description="Currently active"
        format="number"
      />
      <StatsCard
        title="Total Participants"
        value={data.totalParticipants || 0}
        change={data.participantsChange || 15.3}
        icon={<Users />}
        description="All time participants"
        format="number"
      />
      <StatsCard
        title="Success Rate"
        value={data.successRate || 0}
        change={data.successChange || -2.1}
        icon={<Shield />}
        description="Successful airdrops"
        format="percentage"
      />
    </div>
  );
}