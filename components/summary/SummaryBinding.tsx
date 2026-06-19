import React, { useState } from 'react';
import { AutoData, TeleOpData, User, SpreadsheetRow, Language } from '../../types';
import SummaryView from './SummaryView';

interface SummaryBindingProps {
  auto: AutoData;
  teleop: TeleOpData;
  user: User;
  targetSheetId: string;
  onFinish: (data: Partial<SpreadsheetRow>) => void;
  onBack: () => void;
  onLogout: () => void;
  language: Language;
  error?: string | null;
  isSyncing?: boolean;
  isSubmitting?: boolean;
  onDeleteGame?: () => void;
  onUpdateMetadata?: () => void;
}

const SummaryBinding: React.FC<SummaryBindingProps> = ({ auto, teleop, user, targetSheetId, onFinish, onBack, onLogout, language, error, isSyncing, isSubmitting, onDeleteGame, onUpdateMetadata }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const generateAi = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto, teleop, language })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error generating analysis');
      }

      const data = await response.json();
      setAiAnalysis(data.text || (language === Language.HE ? "נותח." : "Analyzed."));
    } catch (e: any) {
      console.error(e);
      setAiAnalysis(language === Language.HE 
        ? `שירות ה-AI אינו זמין כרגע: ${e.message || ''}` 
        : `AI logic currently unavailable: ${e.message || ''}`
      );
    } finally { setIsAnalyzing(false); }
  };

  const finalize = () => {
    onFinish({ aiAnalysis: aiAnalysis || '' });
  };

  return (
    <SummaryView 
      language={language} 
      auto={auto} 
      teleop={teleop} 
      user={user}
      aiAnalysis={aiAnalysis} 
      isAnalyzing={isAnalyzing} 
      isSyncing={isSyncing}
      isSubmitting={isSubmitting}
      onBack={onBack} 
      onFinish={finalize} 
      onGenerateAi={generateAi} 
      onLogout={onLogout}
      onDeleteGame={onDeleteGame}
      onUpdateMetadata={onUpdateMetadata}
      error={error}
    />
  );
};

export default SummaryBinding;