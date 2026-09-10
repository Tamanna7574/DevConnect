import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { PageContainer } from '../components/common/PageContainer';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <PageContainer size="narrow" className="py-16 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 border border-slate-700 flex items-center justify-center text-brand-400 mb-6 shadow-xl">
          <FileQuestion className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          404 - Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-8 leading-relaxed">
          The route you are looking for does not exist in the DevConnect platform or has been relocated.
        </p>
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}>
            Back to Home
          </Button>
        </Link>
      </PageContainer>
    </div>
  );
};
