import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { StatsCard } from '../components/dashboard/StatsCard';
import { MonthlyTrends } from '../components/dashboard/MonthlyTrends';
import { ActivityNotifications } from '../components/dashboard/ActivityNotifications';
import { FileText, Clock, Vote, AlertTriangle } from 'lucide-react';
import { getStats } from '../lib/data/others/api';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({
    totalApplications: 0,
    pendingApprovals: 0,
    liquidationRequests: 0,
    inquiriesRequests: 0
  });

  useEffect(() => {
    if (user?.role === 'applicant') {
      navigate('/my-society');
    }
  }, [user]);

  if (user?.role === 'applicant') {
    return null;
  }

  const loadStats = async () => {
    const response = await getStats();
    if (response?.success) {
      setStats({
        totalApplications: response?.data?.societies?.total || 0,
        pendingApprovals: response?.data?.societies?.pending || 0,
        liquidationRequests: response?.data?.liquidation?.submitted || 0,
        inquiriesRequests: response?.data?.inquiries?.requested || 0
      });
    }
  }

  useEffect(() => {
    if (user?.role !== 'applicant') {
      loadStats();
    }
  }, []);

  return (
    <div className="space-y-6 mt-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Societies"
          value={stats.totalApplications}
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          iconBg={`bg-blue-100 ${mode}:bg-blue-900`}
          link="/registrations"
        />
        <StatsCard
          title="Society Pending Approvals"
          value={stats.pendingApprovals}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          iconBg={`bg-amber-100 ${mode}:bg-amber-900`}
          link="/registrations"
        />
        {user?.role === 'registrar' && (
          <StatsCard
            title="Liquidation Requests"
            value={stats.liquidationRequests}
            icon={<Vote className="h-6 w-6 text-green-600" />}
            iconBg={`bg-green-100 ${mode}:bg-green-900`}
            link="/liquidation"
          />
        )}
        <StatsCard
          title="Inquiries Requests"
          value={stats.inquiriesRequests}
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          iconBg={`bg-red-100 ${mode}:bg-red-900`}
          link="/inquiries"
        />
      </div>

      {/* Charts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyTrends />
        </div>
        <div>
          <ActivityNotifications />
        </div>
      </div>

      {/* Recent Applications */}
      {/* <RecentApplications /> */}
    </div>
  );
};