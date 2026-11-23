import React from 'react';
import { Card } from '../ui/Card';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  link: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBg,
  link,
}) => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const navigate = useNavigate();
  return (
    <Card padding="sm" className="cursor-pointer">
      <div className="flex items-center" onClick={() => navigate(link)}>
        <div className="flex-1">
          <p className={`text-sm font-medium text-gray-600 ${mode}:text-gray-400`}>
            {title}
          </p>
          <p className={`text-lg font-medium text-gray-900 ${mode}:text-gray-100`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};