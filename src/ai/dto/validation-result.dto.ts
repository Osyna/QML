export class ValidationResult {
  isValid: boolean;
  score: number; // 0-1 score indicating how well the answer matches
  confidence: number; // 0-1 confidence in the validation
  feedback?: string;
  suggestions?: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  sentiment?: {
    score: number;
    label: string;
    confidence: number;
  };
  reasoning?: string;
  metadata?: Record<string, any>;
}

export class GeneratedQuestion {
  text: string;
  type: string;
  difficulty: string;
  category?: string;
  points?: number;
  correctAnswer?: any;
  answers?: any[];
  hints?: string[];
  explanation?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class FeedbackResult {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  progressAnalysis?: string;
  nextSteps?: string[];
  score?: number;
  metadata?: Record<string, any>;
}

export class SentimentResult {
  score: number; // -1 to 1 (negative to positive)
  label: string; // 'negative', 'neutral', 'positive'
  confidence: number;
  emotions?: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
  };
  metadata?: Record<string, any>;
}
