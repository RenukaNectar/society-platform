import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'query-raised':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'query-raised':
      return 'Query Raised';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const RecentApplications: React.FC = () => {
  const { applications } = useSelector((state: RootState) => state.applications);
  const { mode } =useSelector((state: RootState) => state.theme);

  return (
    <Card padding="none">
      <div className={`p-6 border-b border-gray-200 ${mode}:border-gray-700`}>
        <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100`}>
          Recent Applications
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                Application ID
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                Type
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                Date
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                Status
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                Action
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
            {applications.map((application) => (
              <tr key={application.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${mode}:text-gray-100`}>
                  {application.id}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                  {application.type}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                  {application.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                    {getStatusText(application.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-900">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};