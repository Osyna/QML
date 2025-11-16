/**
 * Answer Module DTOs
 * Centralized export for all Answer-related Data Transfer Objects
 */

// Request DTOs
export { StartQuestionnaireDto } from './start-questionnaire.dto';
export { SubmitAnswerDto, BulkSubmitAnswersDto } from './submit-answer.dto';
export { CompleteQuestionnaireDto } from './complete-questionnaire.dto';
export { QueryAttemptDto } from './query-attempt.dto';

// Validation DTOs
export {
  AnswerValidationResultDto,
  ManualValidationDto,
} from './answer-validation-result.dto';

// Response DTOs
export {
  AttemptResponseDto,
  AnswerSubmissionResponseDto,
  AttemptUserResponseDto,
  AttemptQuestionnaireResponseDto,
  AttemptSummaryDto,
} from './attempt-response.dto';
