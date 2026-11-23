import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Save, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface PlaceholderModuleProps {
  title: string;
  description: string;
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  title,
  description,
}) => {
  const { mode } =useSelector((state: RootState) => state.theme);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100`}>
            {title}
          </h1>
          <p className={`text-gray-600 ${mode}:text-gray-400 mt-1`}>
            {description}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New {title.split(' ')[0]}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="text-center py-12">
              <FileText className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className={`text-lg font-medium text-gray-900 ${mode}:text-gray-100 mb-2`}>
                No {title.toLowerCase()} found
              </h3>
              <p className={`text-gray-500 ${mode}:text-gray-400 mb-6`}>
                Get started by creating your first {title.toLowerCase()}.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create {title.split(' ')[0]}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-4`}>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                New {title.split(' ')[0]}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Templates
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-4`}>
              Recent Drafts
            </h3>
            <div className="text-center py-8">
              <p className={`text-gray-500 ${mode}:text-gray-400 text-sm`}>
                No drafts saved yet
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};