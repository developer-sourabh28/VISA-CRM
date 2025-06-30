import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

const BackButton = ({ className }) => {
  const goBack = () => {
    // A simple way to go to the previous page in the browser's history
    window.history.back();
  };

  return (
    <Button
      variant="outline"
      onClick={goBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </Button>
  );
};

export default BackButton;