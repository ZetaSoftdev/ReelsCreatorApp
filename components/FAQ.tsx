"use client";

import { useState } from "react";
import { FileQuestion, ChevronDown, ChevronUp } from "lucide-react";

interface FAQProps {
  question: string;
  answer: React.ReactNode;
}

const FAQItem = ({ question, answer }: FAQProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        className="flex w-full justify-between items-center text-left font-medium text-gray-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          <FileQuestion className="mr-2 h-5 w-5 text-purple-600" />
          {question}
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 pl-7 pr-2 text-sm text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
};

export default FAQItem; 