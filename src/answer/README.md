# Answer Module

The Answer Module provides a comprehensive system for managing questionnaire attempts and answer submissions with advanced validation and scoring capabilities.

## Features

### Core Functionality
- **Questionnaire Attempts**: Start, track, and complete questionnaire attempts
- **Answer Submission**: Submit answers with automatic validation and scoring
- **Multiple Validation Strategies**:
  - Exact match validation
  - Keyword-based validation
  - AI-powered semantic validation
  - Manual review by educators

### Advanced Features
- **Automatic Scoring**: Real-time scoring with hint cost deduction
- **AI-Generated Feedback**: Personalized feedback based on performance
- **Question Statistics**: Track attempt rates, success rates, and average scores
- **Path Tracking**: Monitor the path users take through questionnaires
- **Manual Review**: Educators can manually review and grade submissions
- **Comprehensive Filtering**: Advanced query capabilities for attempts and submissions

## API Endpoints

### Start a Questionnaire Attempt
```http
POST /answers/attempts/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionnaireId": 1,
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "deviceType": "desktop"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "questionnaire_id": 1,
  "status": "in-progress",
  "result": "pending",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "questionnaire": {
    "id": 1,
    "title": "Introduction to Geography",
    "description": "Test your knowledge"
  }
}
```

### Submit an Answer
```http
POST /answers/attempts/1/answers
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionId": 5,
  "userAnswer": "Paris",
  "hintsUsed": ["hint-1"],
  "timeSpent": 45,
  "flaggedForReview": false
}
```

**Response:**
```json
{
  "id": 10,
  "attempt_id": 1,
  "question_id": 5,
  "userAnswer": "Paris",
  "validationStatus": "correct",
  "validationResult": {
    "status": "correct",
    "score": 9,
    "maxScore": 10,
    "explanation": "Correct! Paris is indeed the capital of France.",
    "hintsUsed": 1,
    "hintCostDeducted": 1
  },
  "timeSpent": 45,
  "submittedAt": "2024-01-15T10:05:00.000Z",
  "validatedAt": "2024-01-15T10:05:01.000Z"
}
```

### Complete an Attempt
```http
POST /answers/attempts/1/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "timeSpent": 1800,
  "feedback": "Great questionnaire!",
  "metadata": {
    "pathTaken": [1, 2, 3, 4, 5]
  }
}
```

**Response:**
```json
{
  "id": 1,
  "status": "completed",
  "result": "pass",
  "score": 85,
  "percentage": 85.0,
  "timeSpent": 1800,
  "feedback": "Great questionnaire!",
  "aiGeneratedFeedback": "## Overall Feedback\n...",
  "completedAt": "2024-01-15T10:30:00.000Z",
  "submissions": [...]
}
```

### Get Attempt Details
```http
GET /answers/attempts/1
Authorization: Bearer <token>
```

### Get My Attempts
```http
GET /answers/attempts/my-attempts?status=completed&result=pass&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by attempt status (in-progress, completed, abandoned, timed-out)
- `result`: Filter by result (pass, fail, pending, no-grading)
- `questionnaireId`: Filter by questionnaire
- `minScore`, `maxScore`: Filter by score range
- `minPercentage`, `maxPercentage`: Filter by percentage range
- `startedAfter`, `startedBefore`: Filter by start date
- `completedAfter`, `completedBefore`: Filter by completion date
- `hasAiFeedback`: Filter attempts with AI feedback
- `includeSubmissions`: Include submission details
- `page`, `limit`: Pagination

### Get Questionnaire Attempts (Admin/Educator)
```http
GET /answers/questionnaires/1/attempts?status=completed
Authorization: Bearer <token>
Roles: admin, educator
```

### Manual Review (Admin/Educator)
```http
PATCH /answers/submissions/10/review
Authorization: Bearer <token>
Roles: admin, educator
Content-Type: application/json

{
  "status": "correct",
  "score": 10,
  "maxScore": 10,
  "explanation": "Excellent answer with great detail",
  "reviewNotes": "Manually reviewed and approved"
}
```

## Validation Strategies

### 1. Exact Match Validation
Validates answers with exact string comparison (case-insensitive).

**Configuration:**
```typescript
{
  checkType: CheckType.Exact
}
```

**Use Case:** Questions with single, definitive answers (e.g., "What is 2+2?")

### 2. Keyword-Based Validation
Validates answers based on presence of specific keywords.

**Configuration:**
```typescript
{
  checkType: CheckType.Keywords,
  checkConfig: {
    keywords: ["capital", "France", "Paris"],
    caseSensitive: false,
    partial: true,
    minMatches: 2
  }
}
```

**Use Case:** Open-ended questions where specific concepts must be mentioned

### 3. AI-Powered Validation
Uses AI to semantically validate answers based on meaning.

**Configuration:**
```typescript
{
  checkType: CheckType.AI,
  checkConfig: {
    type: AICheckType.Meaning,
    sensitivity: 0.7,
    prompt: "Custom validation prompt"
  }
}
```

**Use Case:** Complex questions requiring nuanced understanding

**AI Check Types:**
- `Meaning`: Semantic similarity comparison
- `Sentiment`: Sentiment analysis
- `Custom`: Custom prompt-based validation

### 4. Manual Review
Marks answers for manual review by educators.

**Configuration:**
```typescript
{
  checkType: CheckType.Manual
}
```

**Use Case:** Essay questions, complex reasoning, or subjective answers

## Scoring System

### Basic Scoring
Each question has a `points` value (default: 1). Answers are scored as:
- **Correct**: Full points
- **Partial**: Percentage of full points based on validation
- **Incorrect**: 0 points

### Hint Cost Deduction
If hints are used, their cost is deducted from the score:

```typescript
finalScore = baseScore - hintCost
```

Example:
- Question worth 10 points
- User answers correctly (10 points)
- Used 2 hints (1 point each)
- Final score: 8 points

### Attempt Scoring
The final attempt score is the sum of all submission scores.

**Pass/Fail Determination:**
- If `passPercentage` is set: `percentage >= passPercentage`
- If `passPoints` is set: `score >= passPoints`
- Otherwise: `no-grading`

## Question Statistics

The system automatically updates question statistics:
- **Total Attempts**: Number of times the question was attempted
- **Correct Attempts**: Number of correct answers
- **Average Score**: Mean score across all attempts
- **Average Time Spent**: Mean time spent on the question

## AI Feedback Generation

When an attempt is completed, the system can automatically generate personalized feedback using AI.

**Generated Feedback Includes:**
- Overall performance summary
- Identified strengths
- Areas for improvement
- Personalized recommendations
- Progress analysis
- Suggested next steps

**Example:**
```markdown
## Overall Feedback
You demonstrated strong understanding of the core concepts with a score of 85%.

## Strengths
- Excellent grasp of geographical locations
- Quick and accurate responses to factual questions

## Areas for Improvement
- Consider adding more detail to open-ended responses
- Review concepts related to political boundaries

## Recommendations
- Practice with more advanced geography questions
- Review the material on regional classifications

## Next Steps
- Attempt the Advanced Geography questionnaire
- Review chapters 3-5 of the course material
```

## Database Schema

### QuestionnaireAttempt Entity
```typescript
{
  id: number;
  user_id: number;
  questionnaire_id: number;
  status: 'in-progress' | 'completed' | 'abandoned' | 'timed-out';
  result: 'pass' | 'fail' | 'pending' | 'no-grading';
  score: number;
  percentage: number;
  timeSpent: number;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    currentQuestionIndex?: number;
    pathTaken?: number[];
  };
  feedback: string;
  aiGeneratedFeedback: string;
  submissions: AnswerSubmission[];
  startedAt: Date;
  completedAt: Date;
}
```

### AnswerSubmission Entity
```typescript
{
  id: number;
  attempt_id: number;
  question_id: number;
  userAnswer: any;
  validationStatus: 'correct' | 'incorrect' | 'partial' | 'pending' | 'no-grading';
  validationResult: {
    status: ValidationStatus;
    score: number;
    maxScore: number;
    explanation?: string;
    aiAnalysis?: {
      confidence: number;
      reasoning: string;
      suggestions?: string[];
    };
    keywordMatches?: string[];
    hintsUsed?: number;
    hintCostDeducted?: number;
  };
  timeSpent: number;
  hintsUsed: string[];
  flaggedForReview: boolean;
  reviewNotes: string;
  submittedAt: Date;
  validatedAt: Date;
}
```

## Usage Examples

### Student Flow
```typescript
// 1. Start an attempt
const attempt = await answerService.startQuestionnaire(userId, {
  questionnaireId: 1,
  metadata: {
    deviceType: 'desktop'
  }
});

// 2. Submit answers
const submission1 = await answerService.submitAnswer(userId, {
  attemptId: attempt.id,
  questionId: 1,
  userAnswer: "Paris",
  timeSpent: 30
});

// 3. Complete attempt
const completed = await answerService.completeQuestionnaire(
  userId,
  attempt.id,
  {
    timeSpent: 600,
    feedback: "Great experience!"
  }
);

console.log(`Score: ${completed.score}/${completed.percentage}%`);
console.log(`Result: ${completed.result}`);
console.log(`AI Feedback: ${completed.aiGeneratedFeedback}`);
```

### Educator Review Flow
```typescript
// 1. Get attempts for a questionnaire
const attempts = await answerService.getQuestionnaireAttempts(
  questionnaireId,
  {
    status: AttemptStatus.Completed,
    hasFlaggedSubmissions: true,
    includeSubmissions: true
  }
);

// 2. Review a flagged submission
for (const attempt of attempts.data) {
  for (const submission of attempt.submissions) {
    if (submission.flaggedForReview) {
      await answerService.manualReview(
        submission.id,
        {
          status: ValidationStatus.Correct,
          score: 10,
          maxScore: 10,
          explanation: "Well explained!"
        },
        "Reviewed by educator"
      );
    }
  }
}
```

## Error Handling

The service throws specific exceptions:
- `NotFoundException`: Attempt or submission not found
- `BadRequestException`: Invalid operation (e.g., retake limit reached)
- `ForbiddenException`: Insufficient permissions

## Best Practices

1. **Always validate questionnaire availability** before starting attempts
2. **Use appropriate validation types** for different question types
3. **Flag complex answers for review** when AI confidence is low
4. **Monitor question statistics** to improve question quality
5. **Provide clear feedback** in validation explanations
6. **Set reasonable hint costs** to balance help and scoring
7. **Use AI feedback generation** to provide personalized learning experiences

## Future Enhancements

- Adaptive difficulty based on performance
- Collaborative learning features
- Advanced analytics and reporting
- Real-time attempt monitoring
- Gamification elements (badges, achievements)
- Export results to various formats
