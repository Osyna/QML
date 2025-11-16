# QML API Guide

## Quick Start

### Installation

```bash
npm install
```

### Running the API

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Questions

#### Create a Question
```
POST /questions
```

Example Request Body:
```json
{
  "type": "Free-Text",
  "minChar": 100,
  "maxChar": 300,
  "check": {
    "method": "AI",
    "checkType": "Meaning",
    "sensitivity": 0.7
  },
  "points": 10,
  "difficulty": "medium",
  "category": "Biology",
  "timeLimit": 220,
  "version": "1.0",
  "content": {
    "text": "Describe the process of photosynthesis.",
    "multimedia": null,
    "answers": [
      {
        "answerText": "Photosynthesis is the process plants use to convert sunlight into energy."
      }
    ],
    "hints": [
      {
        "hintText": "It's a process from plants",
        "cost": 0.5
      },
      {
        "hintText": "it's linked to sun",
        "cost": 1
      }
    ],
    "feedback": {
      "correct": "Great job!",
      "incorrect": "Remember that photosynthesis involves sunlight, water, and carbon dioxide."
    },
    "tags": ["Photosynthesis", "Biology"]
  }
}
```

#### Get All Questions
```
GET /questions
GET /questions?category=Biology
GET /questions?difficulty=medium
GET /questions?type=Free-Text
```

#### Get Single Question
```
GET /questions/:id
```

#### Update Question
```
PATCH /questions/:id
```

#### Delete Question
```
DELETE /questions/:id
```

### Question Pools

#### Create a Question Pool
```
POST /question-pools
```

Example Request Body:
```json
{
  "name": "Biology Questions Pool",
  "description": "A collection of biology questions",
  "tags": ["Biology", "Science"],
  "pool": [1, 2, 3, 4, 5],
  "difficulty": "medium",
  "category": "Biology"
}
```

#### Get All Question Pools
```
GET /question-pools
GET /question-pools?category=Biology
```

#### Get Single Question Pool
```
GET /question-pools/:id
```

#### Update Question Pool
```
PATCH /question-pools/:id
```

#### Delete Question Pool
```
DELETE /question-pools/:id
```

#### Add Questions to Pool
```
POST /question-pools/:id/questions
```

Request Body:
```json
{
  "questionIds": [6, 7, 8]
}
```

#### Remove Questions from Pool
```
DELETE /question-pools/:id/questions
```

Request Body:
```json
{
  "questionIds": [6, 7]
}
```

### Questionnaires

#### Create a Questionnaire
```
POST /questionnaires
```

Example Request Body (Simple):
```json
{
  "name": "Biology Test",
  "description": "A test on biology topics",
  "type": "Questionnaire",
  "pool": [
    {
      "type": "question",
      "question": 1
    },
    {
      "type": "question",
      "question": 2
    }
  ],
  "difficulty": "medium",
  "category": "Biology",
  "timeLimit": 1800,
  "points": 100,
  "passPercentage": 70,
  "showResult": true,
  "showFeedback": true
}
```

Example Request Body (Path-Based):
```json
{
  "name": "Adaptive Learning Test",
  "description": "A test that adapts based on answers",
  "type": "PathBased",
  "pool": [
    {
      "type": "path",
      "question": 1,
      "answers": {
        "A": {
          "type": "question",
          "question": 2
        },
        "B": {
          "type": "question",
          "question": 3
        },
        "C": {
          "type": "end"
        }
      }
    }
  ],
  "difficulty": "medium",
  "showResult": true
}
```

#### Get All Questionnaires
```
GET /questionnaires
GET /questionnaires?category=Biology
```

#### Get Single Questionnaire
```
GET /questionnaires/:id
```

#### Update Questionnaire
```
PATCH /questionnaires/:id
```

#### Delete Questionnaire
```
DELETE /questionnaires/:id
```

#### Get Next Question in Path-Based Questionnaire
```
GET /questionnaires/:id/next-question
GET /questionnaires/:id/next-question?currentQuestionId=1&userAnswer=A
```

### Answers

#### Submit an Answer
```
POST /answers
```

Example Request Body:
```json
{
  "questionId": 1,
  "questionnaireId": 1,
  "userId": "user123",
  "userAnswer": "Photosynthesis is how plants convert light energy into chemical energy using chlorophyll.",
  "usedHints": [0],
  "timeSpent": 120
}
```

Response:
```json
{
  "id": 1,
  "questionId": 1,
  "questionnaireId": 1,
  "userId": "user123",
  "userAnswer": "Photosynthesis is how plants convert light energy into chemical energy using chlorophyll.",
  "validationResult": {
    "isCorrect": true,
    "score": 9.5,
    "maxScore": 10,
    "percentage": 95,
    "feedback": "Great job!",
    "usedHints": [0],
    "hintCost": 0.5
  },
  "usedHints": [0],
  "timeSpent": 120,
  "submittedAt": "2025-11-16T00:00:00.000Z"
}
```

#### Get All Answers
```
GET /answers
GET /answers?userId=user123
```

#### Get Single Answer
```
GET /answers/:id
```

#### Get Answers by Question
```
GET /answers/question/:questionId
```

#### Get Answers by Questionnaire
```
GET /answers/questionnaire/:questionnaireId
```

## Check Methods

### 1. Exact Check
The answer must match exactly (case-insensitive).

```json
{
  "check": {
    "method": "Exact"
  }
}
```

### 2. Keywords Check
The answer must contain specific keywords. Score is proportional to matched keywords.

```json
{
  "check": {
    "method": "Keywords",
    "keywords": ["photosynthesis", "sunlight", "chlorophyll", "energy"]
  }
}
```

### 3. AI Check - Meaning
AI evaluates if the answer has the same meaning as the reference answer.

```json
{
  "check": {
    "method": "AI",
    "checkType": "Meaning",
    "sensitivity": 0.7
  }
}
```

- `sensitivity: 1.0` - Exact meaning required
- `sensitivity: 0.5` - Moderate similarity accepted
- `sensitivity: 0.0` - All answers accepted

### 4. AI Check - Custom
Use a custom prompt to evaluate the answer.

```json
{
  "check": {
    "method": "AI",
    "checkType": "Custom",
    "prompt": "Check if the answer mentions renewable energy sources and not fossil fuels"
  }
}
```

### 5. Manual Check
Answer requires manual review by an instructor.

```json
{
  "check": {
    "method": "Manual"
  }
}
```

## Question Types

All question types from the specification are supported:

- `Free-Text` - Open-ended text responses
- `MCQ` - Multiple choice questions
- `Rating` - Rating scale questions
- `Likert` - Likert scale questions
- `Yes-No` - Yes/No questions
- `Ranking` - Rank items in order
- `Matching` - Match items from two sets
- `Fill-in-the-Blank` - Fill in missing text
- `Picture-Choice` - Select from image options
- `Slider` - Use a slider for response
- `Dropdown` - Select from dropdown
- `Semantic-Differential` - Bipolar scale responses
- `Matrix` - Grid format questions
- `Demographic` - Demographic information
- `Hotspot` - Interact with image
- `Drag-and-Drop` - Drag and drop interactions

## Path-Based Questionnaires

Path-based questionnaires allow dynamic question flow based on user answers.

### Path Node Types

- `question` - A regular question
- `path` - A question with branching paths
- `break` - Break current path, go to next question at parent level
- `end` - End the questionnaire
- `goto` - Jump to a specific labeled question

### Example

```json
{
  "type": "PathBased",
  "pool": [
    {
      "type": "path",
      "question": 1,
      "answers": {
        "Beginner": {
          "type": "question",
          "question": 10
        },
        "Intermediate": {
          "type": "question",
          "question": 20
        },
        "Advanced": {
          "type": "question",
          "question": 30
        }
      }
    }
  ]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error Response Format:
```json
{
  "statusCode": 404,
  "message": "Question with ID 999 not found",
  "error": "Not Found"
}
```
