import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getDashboardGraph } from '../../lib/data/others/api';

export const MonthlyTrends: React.FC = () => {
  const { mode } =useSelector((state: RootState) => state.theme);
  const [data, setData] = useState<any[]>([
    { month: 'Jan', filings: 0 },
    { month: 'Feb', filings: 0 },
    { month: 'Mar', filings: 0 },
    { month: 'Apr', filings: 0 },
    { month: 'May', filings: 0 },
    { month: 'Jun', filings: 0 },
    { month: 'Jul', filings: 0 },
    { month: 'Aug', filings: 0 },
    { month: 'Sep', filings: 0 },
    { month: 'Oct', filings: 0 },
    { month: 'Nov', filings: 0 },
    { month: 'Dec', filings: 0 },
  ]);

  useEffect(() => {
    getDashboardGraph().then(response => {
      setData(response?.data?.monthly_data || response.data || []);
    });
  }, []);

  return (
    <Card>
      <div className="mb-6">
        <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100`}>
          Monthly Societies Registration Trend
        </h3>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              className={`text-gray-600 ${mode}:text-gray-400`}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className={`text-gray-600 ${mode}:text-gray-400`}
            />
            <Area
              type="monotone"
              dataKey="filings"
              stroke="#F97316"
              fill="#F97316"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};