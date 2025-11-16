import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationStatus } from '../../answer/entities/answer-submission.entity';

/**
 * DTO for joining a quiz session
 */
export class JoinQuizDto {
  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

/**
 * DTO for leaving a quiz session
 */
export class LeaveQuizDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for submitting an answer in real-time
 */
export class SubmitAnswerDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsNumber()
  @IsNotEmpty()
  questionId: number;

  @IsNotEmpty()
  userAnswer: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hintsUsed?: string[];

  @IsOptional()
  @IsNumber()
  timeSpent?: number;

  @IsOptional()
  @IsBoolean()
  flaggedForReview?: boolean;
}

/**
 * DTO for moving to the next question
 */
export class NextQuestionDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsNumber()
  @IsNotEmpty()
  currentQuestionId: number;

  @IsOptional()
  @IsNumber()
  nextQuestionId?: number;
}

/**
 * DTO for completing a quiz
 */
export class QuizCompleteDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsOptional()
  @IsNumber()
  timeSpent?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for requesting leaderboard
 */
export class GetLeaderboardDto {
  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsBoolean()
  realTime?: boolean;
}

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  userId: number;
  userName: string;
  avatar?: string;
  score: number;
  percentage: number;
  timeSpent: number;
  completedAt?: Date;
  rank: number;
  isCurrentUser?: boolean;
}

/**
 * DTO for leaderboard data
 */
export class LeaderboardDto {
  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  entries: LeaderboardEntry[];

  @IsNumber()
  totalParticipants: number;

  @IsOptional()
  @IsNumber()
  currentUserRank?: number;

  @IsOptional()
  @IsNumber()
  activeParticipants?: number;

  updatedAt: Date;
}

/**
 * Question update event data
 */
export class QuestionUpdateDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsNumber()
  @IsNotEmpty()
  questionId: number;

  @IsNumber()
  @IsNotEmpty()
  questionIndex: number;

  @IsNumber()
  totalQuestions: number;

  @IsOptional()
  questionData?: any;

  @IsOptional()
  @IsNumber()
  timeRemaining?: number;

  @IsOptional()
  @IsBoolean()
  isLastQuestion?: boolean;
}

/**
 * Quiz state update event data
 */
export class QuizUpdateDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsString()
  @IsNotEmpty()
  status: 'in-progress' | 'completed' | 'paused' | 'abandoned';

  @IsOptional()
  @IsNumber()
  currentQuestionIndex?: number;

  @IsOptional()
  @IsNumber()
  questionsAnswered?: number;

  @IsOptional()
  @IsNumber()
  currentScore?: number;

  @IsOptional()
  @IsNumber()
  timeElapsed?: number;

  @IsOptional()
  @IsNumber()
  timeRemaining?: number;

  @IsOptional()
  metadata?: Record<string, any>;

  updatedAt: Date;
}

/**
 * Quiz started event data
 */
export class QuizStartedDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsOptional()
  @IsNumber()
  totalQuestions?: number;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  startedAt: Date;
}

/**
 * Quiz ended event data
 */
export class QuizEndedDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsNumber()
  score: number;

  @IsNumber()
  percentage: number;

  @IsNumber()
  timeSpent: number;

  @IsString()
  result: 'pass' | 'fail' | 'pending' | 'no-grading';

  @IsOptional()
  feedback?: string;

  completedAt: Date;
}

/**
 * Answer validation result event data
 */
export class AnswerValidatedDto {
  @IsNumber()
  @IsNotEmpty()
  attemptId: number;

  @IsNumber()
  @IsNotEmpty()
  questionId: number;

  @IsString()
  @IsNotEmpty()
  status: ValidationStatus;

  @IsNumber()
  score: number;

  @IsNumber()
  maxScore: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  feedback?: any;

  validatedAt: Date;
}

/**
 * Participant joined event data
 */
export class ParticipantJoinedDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  joinedAt: Date;
}

/**
 * Participant left event data
 */
export class ParticipantLeftDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsOptional()
  @IsString()
  reason?: string;

  leftAt: Date;
}

/**
 * Quiz session statistics
 */
export class QuizSessionStatsDto {
  @IsNumber()
  @IsNotEmpty()
  questionnaireId: number;

  @IsNumber()
  activeParticipants: number;

  @IsNumber()
  totalParticipants: number;

  @IsNumber()
  completedParticipants: number;

  @IsOptional()
  @IsNumber()
  averageScore?: number;

  @IsOptional()
  @IsNumber()
  averageTimeSpent?: number;

  updatedAt: Date;
}
