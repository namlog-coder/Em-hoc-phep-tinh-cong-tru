
import React from 'react';

interface AssistantProps {
  message: string;
}

export const Assistant: React.FC<AssistantProps> = ({ message }) => {
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-4 z-40 max-w-[80%] md:max-w-md pointer-events-none">
      <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-indigo-200 relative animate-fade-in pointer-events-auto">
        <p className="text-indigo-900 font-bold text-lg leading-tight">{message}</p>
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-r-2 border-t-2 border-indigo-200 rotate-45"></div>
      </div>
      <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-indigo-500 to-purple-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce-subtle pointer-events-auto">
        <span className="text-4xl">🤖</span>
      </div>
    </div>
  );
};
