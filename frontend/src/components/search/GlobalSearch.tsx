import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Settings, Zap } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { SearchResult } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const searchData: SearchResult[] = [
  // Modules
  { id: '1', title: 'Registration Module', description: 'Manage society registrations and applications', path: '/registrations', category: 'module' },
  { id: '2', title: 'Annual Filing', description: 'File and manage annual filings for your society', path: '/annual-filings', category: 'module' },
  { id: '3', title: 'Amendment Module', description: 'Submit and track amendment requests', path: '/amendments', category: 'module' },
  { id: '4', title: 'Audit Request Module', description: 'Manage audit requests and compliance', path: '/audit-requests', category: 'module' },
  { id: '5', title: 'Election Request Module', description: 'Handle election processes and requests', path: '/election-requests', category: 'module' },
  { id: '6', title: 'Liquidation Module', description: 'Manage liquidation procedures and documentation', path: '/liquidation', category: 'module' },
  { id: '7', title: 'Inquiry / Inspection Module', description: 'Handle inquiries and inspection processes', path: '/inquiries', category: 'module' },
  { id: '8', title: 'Appeals Module', description: 'Manage appeals and review processes', path: '/appeals', category: 'module' },
  
  // Settings & Features
  { id: '9', title: 'User Management', description: 'Manage users, roles, and permissions', path: '/users', category: 'setting' },
  { id: '10', title: 'Profile Settings', description: 'Manage your profile and account settings', path: '/profile', category: 'setting' },
  { id: '11', title: 'Theme Settings', description: 'Configure application theme and appearance', path: '/settings', category: 'setting' },
  { id: '12', title: 'Notifications', description: 'View and manage your notifications', path: '/notifications', category: 'feature' },
  { id: '13', title: 'Dashboard', description: 'Overview of applications and statistics', path: '/', category: 'feature' },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const { mode } =useSelector((state: RootState) => state.theme);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = searchData.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(filtered);
    } else {
      setFilteredResults(searchData);
    }
  }, [searchTerm]);

  const handleResultClick = (path: string) => {
    navigate(path);
    onClose();
    setSearchTerm('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'module':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'setting':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'feature':
        return <Zap className="h-4 w-4 text-amber-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'module':
        return `bg-blue-100 text-blue-800 ${mode}:bg-blue-900 ${mode}:text-blue-200`;
      case 'setting':
        return `bg-gray-100 text-gray-800 ${mode}:bg-gray-900 ${mode}:text-gray-200`;
      case 'feature':
        return `bg-amber-100 text-amber-800 ${mode}:bg-amber-900 ${mode}:text-amber-200`;
      default:
        return `bg-gray-100 text-gray-800 ${mode}:bg-gray-900 ${mode}:text-gray-200`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Portal" size="lg">
      <div className="space-y-4">
        <Input
          placeholder="Search for modules, settings, or features..."
          icon={<Search className="h-4 w-4 text-gray-400" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />

        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result.path)}
                className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 ${mode}:hover:bg-gray-800 cursor-pointer transition-colors duration-200`}
              >
                {getCategoryIcon(result.category)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-medium text-gray-900 ${mode}:text-gray-100`}>
                      {result.title}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryColor(result.category)}`}>
                      {result.category}
                    </span>
                  </div>
                  <p className={`text-sm text-gray-500 ${mode}:text-gray-400 truncate`}>
                    {result.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className={`text-gray-500 ${mode}:text-gray-400`}>
                {searchTerm ? 'No results found' : 'Start typing to search...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};