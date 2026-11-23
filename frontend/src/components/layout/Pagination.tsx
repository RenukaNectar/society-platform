import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button"; // Assuming this is a custom styled Button

interface PaginationProps {
  pagination: {
    total: number;
    limit: number;
    from?: number;
    to?: number;
  };
  currentPage: number;
  onPageChange: (newPage: number) => void;
  theme?: 'dark' | 'light';
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  currentPage,
  onPageChange,
  theme = 'light',
}) => {
  const { limit, total, from, to } = pagination;

  if (currentPage === 0 || total === 0 || limit === 0) return null;

  const totalPages = Math.ceil(total / limit);
  
  // Don't show pagination if there's only 1 page
  if (totalPages <= 1) return null;
  
  // Calculate from and to if they're not provided
  const calculatedFrom = from || ((currentPage - 1) * limit) + 1;
  const calculatedTo = to || Math.min(currentPage * limit, total);
  
  const bgColor = theme === 'dark' ? 'bg-dark' : 'bg-white';

  const changePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      onPageChange(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex justify-between items-center mb-3 mt-1`}>
      <p className="p-0 m-0 ms-2 text-sm text-[gray]">Showing {calculatedFrom} to {calculatedTo} of {total}</p>
      <div className={`flex gap-2 items-center py-1 rounded ${bgColor}`}>
        <Button
          variant="ghost"
          onClick={() => changePage('prev')}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={16} />
        </Button>

        {currentPage > 2 && <span>...</span>}
        {currentPage > 1 && (
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage - 1)}
          >
            {currentPage - 1}
          </Button>
        )}

        <Button disabled>
          {currentPage}
        </Button>

        {currentPage < totalPages && (
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage + 1)}
          >
            {currentPage + 1}
          </Button>
        )}
        {currentPage + 1 < totalPages && <span>...</span>}

        <Button
          variant="ghost"
          onClick={() => changePage('next')}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};
