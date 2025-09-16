
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface AIAssistantViewProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isGeneratingResponse: boolean;
  error: string | null;
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  messages,
  onSendMessage,
  isGeneratingResponse,
  error,
}) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGeneratingResponse) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (!isGeneratingResponse) {
      onSendMessage(prompt);
      setInput('');
    }
  };

  const suggestedPrompts = [
    t('aiAssistantView.suggestedPrompt1'),
    t('aiAssistantView.suggestedPrompt2'),
    t('aiAssistantView.suggestedPrompt3'),
  ];
  
  const commonButtonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
    boxShadow: Colors.boxShadowButton,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9375rem',
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto" style={{ height: 'calc(100vh - 10rem)' }}>
      <h2 className="text-2xl font-bold text-center sm:text-left mb-4" style={{ color: Colors.text }}>
        {t('aiAssistantView.title')}
      </h2>
      <div className="flex-grow overflow-y-auto p-4 space-y-4 rounded-xl" style={{ backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}` }}>
        {messages.length === 0 && !isGeneratingResponse && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.accentInfo})`}}>
                <span className="text-4xl">🤖</span>
            </div>
            <p className="font-semibold" style={{color: Colors.text_primary}}>{t('aiAssistantView.welcomeMessage')}</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'}`}
              style={{
                backgroundColor: msg.role === 'user' ? Colors.primary : Colors.cardBackground,
                color: msg.role === 'user' ? Colors.textOnDark : Colors.text,
                border: `1px solid ${Colors.cardBorder}`
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
            </div>
          </div>
        ))}
        {isGeneratingResponse && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl rounded-bl-none" style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150 mx-1"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        )}
        {error && (
            <div className="p-3 rounded-lg text-sm text-center" style={{ backgroundColor: `${Colors.accentError}1A`, color: Colors.accentError }}>
                {error}
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4">
        <div className="flex flex-wrap gap-2 mb-2">
            {suggestedPrompts.map(prompt => (
                <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    disabled={isGeneratingResponse}
                    className="px-3 py-1.5 text-xs rounded-full transition-colors duration-200 disabled:opacity-50"
                    style={{backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`, color: Colors.text_secondary}}
                >
                    {prompt}
                </button>
            ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('aiAssistantView.sendMessagePlaceholder')}
            className="flex-grow w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}
            disabled={isGeneratingResponse}
          />
          <button type="submit" disabled={isGeneratingResponse || !input.trim()} style={{...commonButtonStyles, backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`}} className="disabled:opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantView;
