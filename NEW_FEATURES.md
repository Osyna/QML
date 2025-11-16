# New Features Added from Ideas.md

This document describes the additional features implemented based on Ideas.md requirements.

## 1. Auto-Hints Feature

Questions now support automatic hint delivery when users fail to answer correctly.

### Question Entity Enhancement
- Added `autoHints` boolean field to Question entity
- When `autoHints` is true, the first hint is automatically shown on wrong answer
- Hint cost is automatically deducted from the score

### Usage Example
```json
{
  "type": "Free-Text",
  "autoHints": true,
  "points": 10,
  "content": {
    "text": "What is photosynthesis?",
    "hints": [
      {
        "hintText": "It involves plants and sunlight",
        "cost": 2
      }
    ]
  }
}
```

## 2. Random Question Selection

Questionnaires can now randomly select questions from pools.

### Question Selection Service
- `QuestionSelectionService` handles random question selection
- Supports `RandomQuestions` questionnaire type
- Uses `maxQuestions` parameter to limit selection
- Implements Fisher-Yates shuffle for fair randomization

### Features
- Random selection from question pools
- Random selection from questionnaire pools
- Configurable question limit
- Fair distribution using proven algorithms

### Usage Example
```json
{
  "name": "Random Quiz",
  "type": "RandomQuestions",
  "maxQuestions": 10,
  "pool": [
    {"type": "question", "question": 1},
    {"type": "question", "question": 2},
    {"type": "question", "question": 3}
    // ... more questions
  ]
}
```

## 3. Questionnaire Session Management

Complete session management system for users taking questionnaires.

### Features
- Start a questionnaire session
- Track user progress through questions
- Store timing information
- Calculate scores in real-time
- Support for pausing and resuming

### Workflow
1. **Start Session**: `POST /sessions`
   - Creates new session for a user
   - Selects questions based on questionnaire type
   - Initializes score tracking

2. **Take Questionnaire**: User answers questions
   - Session tracks which questions are answered
   - Records time spent on each question

3. **Submit Answers**: `POST /sessions/:id/submit`
   - Batch submission of all answers
   - Automatic validation
   - Score calculation

4. **View Results**: `GET /sessions/:id/results`
   - Complete score breakdown
   - List of correct/incorrect answers
   - Pass/fail status

### API Endpoints

#### Start a Session
```
POST /sessions
```

Request:
```json
{
  "questionnaireId": 1,
  "userId": "user123"
}
```

Response:
```json
{
  "id": 1,
  "questionnaireId": 1,
  "userId": "user123",
  "questions": [
    {"questionId": 1, "answered": false},
    {"questionId": 2, "answered": false}
  ],
  "currentQuestionIndex": 0,
  "totalScore": 0,
  "maxScore": 20,
  "completed": false,
  "startedAt": "2025-11-16T00:00:00.000Z"
}
```

#### Submit Batch Answers
```
POST /sessions/:id/submit
```

Request:
```json
{
  "answers": [
    {
      "questionId": 1,
      "userAnswer": "Photosynthesis is...",
      "timeSpent": 120,
      "usedHints": [0]
    },
    {
      "questionId": 2,
      "userAnswer": "The answer is...",
      "timeSpent": 90
    }
  ]
}
```

Response:
```json
{
  "sessionId": 1,
  "questionnaireId": 1,
  "questionnaireName": "Biology Test",
  "userId": "user123",
  "totalScore": 18,
  "maxScore": 20,
  "percentage": 90,
  "passed": true,
  "questionsAnswered": 2,
  "totalQuestions": 2,
  "totalTimeSpent": 210,
  "results": [
    {
      "questionId": 1,
      "questionText": "Describe photosynthesis",
      "userAnswer": "Photosynthesis is...",
      "validationResult": {
        "isCorrect": true,
        "score": 9,
        "maxScore": 10,
        "percentage": 90,
        "feedback": "Great job!",
        "usedHints": [0],
        "hintCost": 1
      },
      "correctAnswer": "Photosynthesis is the process..."
    }
  ],
  "passText": "Congratulations! You passed!",
  "startedAt": "2025-11-16T00:00:00.000Z",
  "completedAt": "2025-11-16T00:05:00.000Z"
}
```

#### Get Session Results
```
GET /sessions/:id/results
```

Returns the same format as submit response for completed sessions.

#### Get User's Sessions
```
GET /sessions/user/:userId
```

Returns all sessions for a specific user.

#### Get Questionnaire Sessions
```
GET /sessions/questionnaire/:questionnaireId
```

Returns all sessions for a specific questionnaire (useful for analytics).

## 4. Batch Answer Submission

Submit all answers for a questionnaire at once.

### Benefits
- Single transaction for all answers
- Consistent validation
- Complete score calculation
- Better performance
- Atomic operations

### Comparison: Individual vs Batch

#### Individual Answer Submission
```
POST /answers
{
  "questionId": 1,
  "userAnswer": "..."
}
```
- One request per question
- Immediate feedback
- Good for live quizzes

#### Batch Answer Submission
```
POST /sessions/:id/submit
{
  "answers": [
    {"questionId": 1, "userAnswer": "..."},
    {"questionId": 2, "userAnswer": "..."}
  ]
}
```
- Single request for entire questionnaire
- Complete results at end
- Good for exams/surveys

## 5. Comprehensive Results and Scoring

Detailed scoring system with multiple metrics.

### Metrics Provided
- **Total Score**: Sum of all question scores
- **Max Score**: Maximum possible score
- **Percentage**: (Total Score / Max Score) * 100
- **Pass/Fail**: Based on questionnaire thresholds
- **Time Tracking**: Total time and per-question time
- **Question Results**: Individual breakdown

### Pass/Fail Logic
```javascript
// By percentage
if (questionnaire.passPercentage) {
  passed = percentage >= questionnaire.passPercentage;
}

// By points
if (questionnaire.passPoints) {
  passed = totalScore >= questionnaire.passPoints;
}
```

### Custom Messages
- `passText`: Shown when user passes
- `failText`: Shown when user fails

## 6. Labels and Goto Support

Enhanced path-based questionnaires with label support.

### PathNode Interface
```typescript
interface PathNode {
  type: PathNodeType;
  question?: number;
  answers?: { [key: string]: PathNode };
  label?: string;      // Label for this node
  gotoLabel?: string;  // Jump to labeled node
}
```

### Types
- `question`: Standard question
- `path`: Branching question
- `break`: Exit current path level
- `end`: End questionnaire
- `goto`: Jump to labeled question

### Example with Labels
```json
{
  "type": "PathBased",
  "pool": [
    {
      "type": "path",
      "question": 1,
      "label": "start",
      "answers": {
        "retry": {
          "type": "goto",
          "gotoLabel": "start"
        },
        "continue": {
          "type": "question",
          "question": 2,
          "label": "section2"
        },
        "skip": {
          "type": "goto",
          "gotoLabel": "end"
        }
      }
    },
    {
      "type": "end",
      "label": "end"
    }
  ]
}
```

## Implementation Details

### New Entities
1. **QuestionnaireSession**: Tracks user progress through questionnaires
   - Session state
   - Question tracking
   - Score aggregation
   - Timing data

### New Services
1. **QuestionSelectionService**: Random question selection
2. **QuestionnaireSessionService**: Session management and scoring

### New Controllers
1. **QuestionnaireSessionController**: Session endpoints

### New DTOs
1. **StartSessionDto**: Start a session
2. **BatchSubmitAnswersDto**: Submit multiple answers
3. **SessionResultDto**: Session results response
4. **AnswerSubmission**: Individual answer in batch

## Use Cases

### 1. Educational Testing
```
1. Teacher creates questionnaire with 20 questions
2. Student starts session
3. Student answers all questions
4. Student submits all at once
5. System validates and provides score + feedback
```

### 2. Customer Survey
```
1. Company creates survey
2. Customer starts session
3. Customer fills out survey
4. System records responses (no right/wrong)
5. Returns "sent" status
```

### 3. Adaptive Learning
```
1. System starts session with skill assessment
2. Based on performance, selects appropriate difficulty
3. Uses path-based navigation for personalization
4. Provides detailed progress report
```

### 4. Practice Quiz
```
1. Student starts practice session
2. autoHints enabled for learning
3. Wrong answers trigger hints
4. Can retry unlimited times
5. Tracks improvement over sessions
```

## Migration from Old System

### If using individual answers:
No changes required - old system still works.

### To use new session system:
1. Create session instead of answering directly
2. Collect all answers
3. Submit as batch
4. Receive complete results

Both systems can coexist.
