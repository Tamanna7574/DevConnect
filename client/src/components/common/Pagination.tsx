import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-4 border-t border-surface-border mt-6">
      <p className="text-xs text-slate-400 font-mono">
        Page <span className="text-slate-200 font-medium">{currentPage}</span> of{' '}
        <span className="text-slate-200 font-medium">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
