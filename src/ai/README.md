# AI Integration Service

The AI Integration Service provides comprehensive AI-powered capabilities for answer validation, question generation, feedback generation, and sentiment analysis.

## Features

- **Answer Validation**: Multiple validation methods including semantic meaning comparison, keyword matching, and exact matching
- **Question Generation**: AI-powered question generation with customizable difficulty and type
- **Feedback Generation**: Personalized feedback based on student performance
- **Sentiment Analysis**: Analyze the emotional tone of student answers
- **Difficulty Adjustment**: Automatically adjust question difficulty levels
- **Caching**: Built-in Redis caching for improved performance
- **Retry Logic**: Automatic retry with exponential backoff for API failures
- **Multi-Provider Support**: Support for both OpenAI and Anthropic APIs

## Configuration

### Environment Variables

Configure the AI service using environment variables in your `.env` file:

```env
# AI Provider Selection
AI_PROVIDER=openai  # or 'anthropic'

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-opus-20240229

# Service Settings
AI_MAX_RETRIES=3
AI_TIMEOUT=30000
AI_CACHE_TTL=3600
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600
```

## Usage

### Import the Module

```typescript
import { AIModule } from './ai/ai.module';

@Module({
  imports: [AIModule],
  // ...
})
export class AppModule {}
```

### Inject the Service

```typescript
import { AIService } from './ai/ai.service';

@Injectable()
export class YourService {
  constructor(private readonly aiService: AIService) {}
}
```

## API Methods

### 1. validateAnswer

Main validation method that orchestrates different validation types.

```typescript
const result = await aiService.validateAnswer(
  question,
  userAnswer,
  {
    type: AICheckType.Meaning,
    sensitivity: 0.7,
    minConfidence: 0.8,
  }
);

console.log(result);
// {
//   isValid: true,
//   score: 0.95,
//   confidence: 0.92,
//   feedback: "Excellent answer! You've covered all key concepts.",
//   suggestions: ["Consider adding more examples"],
//   reasoning: "The answer demonstrates clear understanding..."
// }
```

### 2. validateMeaningMatch

AI-based semantic meaning comparison.

```typescript
const result = await aiService.validateMeaningMatch(
  question,
  userAnswer,
  0.8  // sensitivity: 0 = lenient, 1 = strict
);
```

**Parameters:**
- `question`: Question object with text and expected answer
- `userAnswer`: Student's answer text
- `sensitivity`: 0-1, how strict the matching should be (default: 0.7)

**Returns:** `ValidationResult`

### 3. validateKeywords

Keyword-based validation.

```typescript
const result = await aiService.validateKeywords(
  userAnswer,
  {
    required: ['photosynthesis', 'chlorophyll'],
    optional: ['sunlight', 'carbon dioxide'],
    forbidden: ['incorrect', 'wrong'],
    minMatches: 2,
    caseSensitive: false,
  }
);
```

**Returns:** `ValidationResult` with matched and missing keywords

### 4. validateExact

Exact string match validation.

```typescript
const result = await aiService.validateExact(question, userAnswer);
```

### 5. customPromptValidation

Custom AI validation using a custom prompt.

```typescript
const result = await aiService.customPromptValidation(
  userAnswer,
  "Evaluate if this answer demonstrates understanding of quantum mechanics",
  {
    minConfidence: 0.8,
  }
);
```

### 6. generateQuestions

Generate questions using AI.

```typescript
const questions = await aiService.generateQuestions(
  'Photosynthesis',  // topic
  5,                 // count
  Difficulty.Medium, // difficulty
  'multiple_choice'  // type
);

questions.forEach(q => {
  console.log(q.text);
  console.log(q.answers);
  console.log(q.hints);
});
```

**Returns:** Array of `GeneratedQuestion`

### 7. generateFeedback

Generate personalized feedback based on attempt history.

```typescript
const feedback = await aiService.generateFeedback(
  attempt,
  submissions
);

console.log(feedback);
// {
//   overallFeedback: "Good performance overall...",
//   strengths: ["Strong grasp of basic concepts", ...],
//   areasForImprovement: ["Need more practice with...", ...],
//   recommendations: ["Review chapter 5", ...],
//   progressAnalysis: "Shows improvement from last attempt...",
//   nextSteps: ["Try intermediate level questions", ...]
// }
```

**Returns:** `FeedbackResult`

### 8. improveDifficulty

Adjust question difficulty using AI.

```typescript
const improvedQuestion = await aiService.improveDifficulty(
  question,
  Difficulty.VeryHard
);
```

### 9. analyzeAnswerSentiment

Analyze the sentiment and emotional tone of an answer.

```typescript
const sentiment = await aiService.analyzeAnswerSentiment(userAnswer);

console.log(sentiment);
// {
//   score: 0.8,  // -1 to 1
//   label: 'positive',
//   confidence: 0.95,
//   emotions: {
//     joy: 0.7,
//     sadness: 0.1,
//     anger: 0.0,
//     fear: 0.0,
//     surprise: 0.2
//   }
// }
```

**Returns:** `SentimentResult`

### 10. healthCheck

Check if AI service is operational.

```typescript
const health = await aiService.healthCheck();

console.log(health);
// {
//   status: 'healthy',
//   provider: 'openai',
//   configured: true
// }
```

## Data Types

### ValidationResult

```typescript
{
  isValid: boolean;
  score: number;              // 0-1 score
  confidence: number;         // 0-1 confidence
  feedback?: string;
  suggestions?: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  sentiment?: SentimentResult;
  reasoning?: string;
  metadata?: Record<string, any>;
}
```

### GeneratedQuestion

```typescript
{
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
```

### FeedbackResult

```typescript
{
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  progressAnalysis?: string;
  nextSteps?: string[];
  score?: number;
  metadata?: Record<string, any>;
}
```

### SentimentResult

```typescript
{
  score: number;     // -1 to 1
  label: string;     // 'negative', 'neutral', 'positive'
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
```

### CheckConfig

```typescript
{
  type?: AICheckType;           // Meaning, Sentiment, Custom
  sensitivity?: number;         // 0-1
  keywords?: KeywordsConfig;
  customPrompt?: string;
  expectedAnswer?: string;
  rubric?: string[];
  minConfidence?: number;
}
```

### KeywordsConfig

```typescript
{
  required?: string[];
  optional?: string[];
  forbidden?: string[];
  minMatches?: number;
  caseSensitive?: boolean;
}
```

## Example Integration

### In a Question Controller

```typescript
import { AIService } from '../ai/ai.service';
import { CheckType, AICheckType } from '../common/enums';

@Controller('answers')
export class AnswerController {
  constructor(private readonly aiService: AIService) {}

  @Post('validate')
  async validateAnswer(@Body() dto: ValidateAnswerDto) {
    const { question, userAnswer, checkType } = dto;

    let result: ValidationResult;

    switch (checkType) {
      case CheckType.AI:
        result = await this.aiService.validateMeaningMatch(
          question,
          userAnswer,
          0.7
        );
        break;

      case CheckType.Keywords:
        result = await this.aiService.validateKeywords(
          userAnswer,
          question.checkConfig.keywords
        );
        break;

      case CheckType.Exact:
        result = await this.aiService.validateExact(
          question,
          userAnswer
        );
        break;

      default:
        throw new BadRequestException('Invalid check type');
    }

    return result;
  }
}
```

## Caching

The service automatically caches:
- Validation results
- Generated questions
- Sentiment analysis results
- Custom validation results

Cache TTL is configurable via `AI_CACHE_TTL` (default: 3600 seconds).

## Error Handling

The service includes:
- Automatic retry with exponential backoff
- Graceful fallback for parsing errors
- Detailed error logging
- Proper exception handling

## Performance Considerations

1. **Caching**: Results are cached to minimize API calls
2. **Batch Processing**: Consider batching multiple validations
3. **Timeout**: Set appropriate timeout values for your use case
4. **Rate Limiting**: Monitor and respect API rate limits

## Best Practices

1. **Sensitivity Tuning**: Start with 0.7 and adjust based on your needs
2. **Combine Validation Methods**: Use multiple methods for critical assessments
3. **Monitor Usage**: Track AI API usage for cost control
4. **Cache Management**: Configure Redis properly for production
5. **Error Handling**: Always handle validation failures gracefully

## Logging

The service logs:
- API call success/failures
- Cache hits/misses
- Validation results
- Error details

Configure log levels in your NestJS app for appropriate verbosity.

## License

MIT
