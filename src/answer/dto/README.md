# Answer Module DTOs

This directory contains all Data Transfer Objects (DTOs) for the Answer module. These DTOs handle questionnaire attempts, answer submissions, and validation results.

## Overview

The Answer module DTOs are organized into three categories:

### 1. Request DTOs (Input)
- **start-questionnaire.dto.ts** - Starting a new questionnaire attempt
- **submit-answer.dto.ts** - Submitting answers to questions
- **complete-questionnaire.dto.ts** - Completing a questionnaire attempt
- **query-attempt.dto.ts** - Querying attempts with filters

### 2. Validation DTOs
- **answer-validation-result.dto.ts** - Validation results and manual validation

### 3. Response DTOs (Output)
- **attempt-response.dto.ts** - Returning attempt data with results

## File Descriptions

### start-questionnaire.dto.ts

**Purpose:** Used when a user begins a new questionnaire attempt.

**DTOs:**
- `StartQuestionnaireDto` - Main DTO for starting an attempt
- `AttemptMetadataDto` - Nested metadata (IP, user agent, device type, etc.)

**Example Usage:**
```typescript
{
  "questionnaireId": 1,
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "deviceType": "desktop",
    "currentQuestionIndex": 0
  }
}
```

**Validation:**
- `questionnaireId`: Required, integer, minimum 1
- `metadata`: Optional object with optional string fields
- `currentQuestionIndex`: Optional, integer, minimum 0
- `pathTaken`: Optional array of question IDs

---

### submit-answer.dto.ts

**Purpose:** Submitting an answer to a question within an active attempt.

**DTOs:**
- `SubmitAnswerDto` - Single answer submission
- `BulkSubmitAnswersDto` - Multiple answer submissions at once

**Example Usage:**

Single submission:
```typescript
{
  "attemptId": 1,
  "questionId": 5,
  "userAnswer": "Paris",  // Can be string, number, array, or object
  "hintsUsed": ["hint-1", "hint-2"],
  "timeSpent": 45,
  "flaggedForReview": false
}
```

Multiple choice example:
```typescript
{
  "attemptId": 1,
  "questionId": 3,
  "userAnswer": ["A", "C"],  // Array for multiple choice
  "hintsUsed": [],
  "timeSpent": 30
}
```

Bulk submission:
```typescript
{
  "attemptId": 1,
  "submissions": [
    {
      "questionId": 1,
      "userAnswer": "Answer 1",
      "timeSpent": 20
    },
    {
      "questionId": 2,
      "userAnswer": ["A", "B"],
      "timeSpent": 35
    }
  ]
}
```

**Validation:**
- `attemptId`: Required, integer, minimum 1
- `questionId`: Required, integer, minimum 1
- `userAnswer`: Required, flexible type (string | number | string[] | object)
- `hintsUsed`: Optional array of strings
- `timeSpent`: Optional, integer, minimum 0
- `flaggedForReview`: Optional boolean

**Supported Answer Types:**
- **String**: For text/short answer questions
- **Number**: For numeric questions
- **Array**: For multiple choice/checkbox questions
- **Object**: For complex questions with multiple components

---

### complete-questionnaire.dto.ts

**Purpose:** Finalizing a questionnaire attempt and triggering scoring.

**DTOs:**
- `CompleteQuestionnaireDto` - Main completion DTO
- `CompletionMetadataDto` - Final metadata at completion

**Example Usage:**
```typescript
{
  "attemptId": 1,
  "timeSpent": 1800,
  "feedback": "The questions were clear and well-structured.",
  "metadata": {
    "currentQuestionIndex": 10,
    "pathTaken": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "deviceType": "desktop"
  }
}
```

**Validation:**
- `attemptId`: Required, integer, minimum 1
- `timeSpent`: Optional, integer, minimum 0 (total time in seconds)
- `feedback`: Optional string for user feedback
- `metadata`: Optional completion metadata

---

### query-attempt.dto.ts

**Purpose:** Querying questionnaire attempts with extensive filtering options.

**DTOs:**
- `QueryAttemptDto` - Extends `PaginationDto` with attempt-specific filters

**Example Usage:**

Basic query:
```typescript
{
  "page": 1,
  "limit": 10,
  "status": "completed",
  "result": "pass"
}
```

Advanced query with filters:
```typescript
{
  "page": 1,
  "limit": 20,
  "sortBy": "percentage",
  "sortOrder": "DESC",
  "userId": 5,
  "questionnaireId": 1,
  "status": "completed",
  "minPercentage": 70,
  "maxPercentage": 100,
  "startedAfter": "2024-01-01T00:00:00Z",
  "completedBefore": "2024-12-31T23:59:59Z",
  "includeSubmissions": true,
  "includeUser": true,
  "includeQuestionnaire": true
}
```

**Available Filters:**
- **Status**: `in-progress`, `completed`, `abandoned`, `timed-out`
- **Result**: `pass`, `fail`, `pending`, `no-grading`
- **Score Range**: `minScore`, `maxScore`
- **Percentage Range**: `minPercentage`, `maxPercentage`
- **Time Range**: `minTimeSpent`, `maxTimeSpent`
- **Date Ranges**: `startedAfter`, `startedBefore`, `completedAfter`, `completedBefore`
- **Flags**: `hasAiFeedback`, `hasUserFeedback`, `hasFlaggedSubmissions`
- **Relations**: `includeSubmissions`, `includeUser`, `includeQuestionnaire`

**Validation:**
- All pagination fields from `PaginationDto`
- All numeric filters: Optional, integers with appropriate min/max
- Date filters: Optional, converted to Date objects
- Boolean filters: Transform string 'true'/'false' to boolean

---

### answer-validation-result.dto.ts

**Purpose:** Representing validation results and manual validation.

**DTOs:**
- `AnswerValidationResultDto` - Validation result structure
- `AIAnalysisDto` - AI analysis nested object
- `ManualValidationDto` - Manual validation override

**Example Usage:**

Validation Result:
```typescript
{
  "status": "correct",
  "score": 10,
  "maxScore": 10,
  "explanation": "Correct! Paris is indeed the capital of France.",
  "aiAnalysis": {
    "confidence": 0.95,
    "reasoning": "The answer correctly identifies the capital city.",
    "suggestions": [
      "Consider adding historical context"
    ]
  },
  "keywordMatches": ["Paris", "capital", "France"],
  "hintsUsed": 2,
  "hintCostDeducted": 1
}
```

Manual Validation:
```typescript
{
  "status": "correct",
  "score": 9,
  "maxScore": 10,
  "explanation": "Answer demonstrates understanding despite minor issues.",
  "reviewNotes": "Reviewed by instructor. Original AI validation was too strict."
}
```

**Validation Statuses:**
- `correct` - Answer is fully correct
- `incorrect` - Answer is wrong
- `partial` - Answer is partially correct
- `pending` - Awaiting manual review
- `no-grading` - For surveys (no grading needed)

**Validation:**
- `status`: Required, enum of ValidationStatus
- `score`: Required, number, minimum 0
- `maxScore`: Required, number, minimum 0
- `explanation`: Optional string
- `aiAnalysis`: Optional nested object with confidence, reasoning, suggestions
- `keywordMatches`: Optional array of strings
- `hintsUsed`: Optional number
- `hintCostDeducted`: Optional number

---

### attempt-response.dto.ts

**Purpose:** Returning attempt data to the client.

**DTOs:**
- `AttemptResponseDto` - Complete attempt data
- `AnswerSubmissionResponseDto` - Individual submission data
- `AttemptUserResponseDto` - Minimal user info
- `AttemptQuestionnaireResponseDto` - Minimal questionnaire info
- `AttemptSummaryDto` - Summary statistics

**Example Usage:**

Complete Attempt Response:
```typescript
{
  "id": 1,
  "user_id": 5,
  "user": {
    "id": 5,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "questionnaire_id": 1,
  "questionnaire": {
    "id": 1,
    "title": "Introduction to Geography",
    "description": "Test your knowledge of world geography",
    "passingPercentage": 70
  },
  "status": "completed",
  "result": "pass",
  "score": 85,
  "percentage": 85.5,
  "timeSpent": 1800,
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "deviceType": "desktop",
    "currentQuestionIndex": 10,
    "pathTaken": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  "feedback": "Great questionnaire!",
  "aiGeneratedFeedback": "You performed well. Consider reviewing topics where you scored lower.",
  "submissions": [
    {
      "id": 1,
      "attempt_id": 1,
      "question_id": 1,
      "userAnswer": "Paris",
      "validationStatus": "correct",
      "validationResult": {
        "status": "correct",
        "score": 10,
        "maxScore": 10,
        "explanation": "Correct!"
      },
      "timeSpent": 45,
      "hintsUsed": [],
      "flaggedForReview": false,
      "submittedAt": "2024-01-15T10:05:00.000Z",
      "validatedAt": "2024-01-15T10:05:01.000Z",
      "updatedAt": "2024-01-15T10:05:01.000Z"
    }
  ],
  "startedAt": "2024-01-15T10:00:00.000Z",
  "completedAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

Attempt Summary:
```typescript
{
  "id": 1,
  "status": "completed",
  "result": "pass",
  "percentage": 85.5,
  "totalQuestions": 10,
  "answeredQuestions": 10,
  "correctAnswers": 8,
  "incorrectAnswers": 2,
  "partialAnswers": 0,
  "timeSpent": 1800,
  "startedAt": "2024-01-15T10:00:00.000Z",
  "completedAt": "2024-01-15T10:30:00.000Z"
}
```

**Features:**
- Uses `@Exclude()` and `@Expose()` for security
- Supports nested relations (user, questionnaire, submissions)
- Includes all timestamps
- Provides both detailed and summary views

---

## Usage in Controllers

### Example Controller Methods

```typescript
import {
  StartQuestionnaireDto,
  SubmitAnswerDto,
  CompleteQuestionnaireDto,
  QueryAttemptDto,
  AttemptResponseDto,
  AnswerValidationResultDto,
} from './dto';

@Controller('attempts')
export class AttemptsController {
  // Start a new attempt
  @Post('start')
  async startAttempt(
    @Body() startDto: StartQuestionnaireDto,
    @CurrentUser() user: User,
  ): Promise<AttemptResponseDto> {
    return this.attemptsService.startAttempt(user.id, startDto);
  }

  // Submit an answer
  @Post('submit-answer')
  async submitAnswer(
    @Body() submitDto: SubmitAnswerDto,
    @CurrentUser() user: User,
  ): Promise<AnswerValidationResultDto> {
    return this.attemptsService.submitAnswer(user.id, submitDto);
  }

  // Complete an attempt
  @Post('complete')
  async completeAttempt(
    @Body() completeDto: CompleteQuestionnaireDto,
    @CurrentUser() user: User,
  ): Promise<AttemptResponseDto> {
    return this.attemptsService.completeAttempt(user.id, completeDto);
  }

  // Query attempts
  @Get()
  async queryAttempts(
    @Query() queryDto: QueryAttemptDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponseDto<AttemptResponseDto>> {
    return this.attemptsService.queryAttempts(user.id, queryDto);
  }
}
```

## Validation Features

All DTOs include:
- ✅ **Class-validator** decorators for input validation
- ✅ **Class-transformer** decorators for type conversion
- ✅ **Swagger** decorators for API documentation
- ✅ **Type safety** for all fields
- ✅ **Flexible validation** for different question types
- ✅ **Nested object validation** with `@ValidateNested()`
- ✅ **Transform decorators** for query parameters
- ✅ **Security** with `@Exclude()` and `@Expose()` for response DTOs

## Import from Index

All DTOs can be imported from the index file:

```typescript
import {
  StartQuestionnaireDto,
  SubmitAnswerDto,
  CompleteQuestionnaireDto,
  QueryAttemptDto,
  AnswerValidationResultDto,
  AttemptResponseDto,
  // ... and more
} from '@/answer/dto';
```

## Notes

### Answer Type Flexibility

The `userAnswer` field in `SubmitAnswerDto` supports multiple types:
- **String**: For text/short answer questions
- **Number**: For numeric answers
- **String[]**: For multiple choice (multiple selections)
- **Object**: For complex questions with multiple components

Example complex answer:
```typescript
{
  "userAnswer": {
    "selectedOptions": ["A", "C"],
    "textInput": "Additional explanation",
    "confidence": 0.8
  }
}
```

### Metadata Usage

Metadata fields are used to track:
- **Security**: IP address, user agent
- **Analytics**: Device type, time spent per question
- **Navigation**: Path taken through questionnaire
- **State**: Current question index for resuming

### Hints System

The `hintsUsed` field tracks which hints were used:
- Array of hint IDs (strings)
- Used to calculate hint cost deduction
- Helps analyze question difficulty

### Validation Status Flow

```
Submit Answer → Pending → [Validation Process] → Correct/Incorrect/Partial
                                                → Manual Review (if needed)
```

## Related Entities

These DTOs work with the following entities:
- `/home/user/QML/src/answer/entities/questionnaire-attempt.entity.ts`
- `/home/user/QML/src/answer/entities/answer-submission.entity.ts`

## API Documentation

All DTOs are fully documented with Swagger decorators. Once integrated into your NestJS application, you can view the complete API documentation at:
- `http://localhost:3000/api` (Swagger UI)
- `http://localhost:3000/api-json` (OpenAPI JSON)
