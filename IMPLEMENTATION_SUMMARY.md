# Path Logic and Versioning Services Implementation Summary

## Overview
This implementation adds comprehensive path logic navigation and version control functionality to the QML system.

## Files Created

### 1. Path Logic Service
**File:** `/home/user/QML/src/questionnaire/path-logic.service.ts`

#### Features:
- **getNextQuestion(attemptId, currentQuestionId, selectedAnswer)** - Determines the next question based on path logic and selected answers
- **validatePathLogic(pathStructure)** - Validates path logic structure for errors and inconsistencies
- **getQuestionPath(questionnaireId, startQuestionId)** - Gets all possible paths through a questionnaire
- **resolvePathType(pathNode, answer)** - Resolves path type (question, break, end, goto)
- **buildPathMap(questionnaire)** - Creates an efficient map of paths for navigation
- **getInitialQuestion(questionnaire)** - Gets the first question in a path
- **isEndOfPath(attemptId)** - Checks if the current path is complete

#### Key Capabilities:
- Tracks path taken through QuestionnaireAttempt metadata
- Handles goto labels for jumping to specific questions
- Supports break statements to exit nested structures
- Supports nested path structures with multiple levels
- Prevents infinite loops in path traversal
- Validates path logic for duplicate question IDs, missing labels, and invalid references

### 2. Versioning Service
**File:** `/home/user/QML/src/versioning/versioning.service.ts`

#### Features:
- **createVersion(question, changeDescription, userId)** - Creates a complete snapshot of a question version
- **getVersionHistory(questionId)** - Gets all versions of a question (newest first)
- **getVersion(versionId)** - Gets a specific version by ID
- **compareVersions(versionId1, versionId2)** - Compares two versions and generates a detailed diff
- **revertToVersion(questionId, versionId, userId)** - Reverts a question to a previous version
- **getLatestVersion(questionId)** - Gets the most recent version
- **pruneVersions(questionId, keepCount)** - Cleans up old versions (keeps N most recent)
- **getVersionCount(questionId)** - Gets total version count
- **getVersionsByUser(userId)** - Gets all versions created by a user
- **getVersionsByDateRange(startDate, endDate)** - Gets versions in a date range

#### Key Capabilities:
- Complete snapshot storage of question state
- Deep object comparison for generating diffs
- Human-readable diff summaries
- Automatic version creation before reverts
- Version increment logic
- Tracks change descriptions and user who made changes

### 3. Versioning Module
**File:** `/home/user/QML/src/versioning/versioning.module.ts`

- Registers VersioningService as a provider
- Exports VersioningService for use in other modules
- Manages QuestionVersion and Question entities

### 4. Versioning Index
**File:** `/home/user/QML/src/versioning/index.ts`

- Provides convenient exports for versioning module components

## Files Modified

### 1. Question Service
**File:** `/home/user/QML/src/question/question.service.ts`

#### Changes:
- Added `VersioningService` dependency injection
- Updated `create()` method to use `versioningService.createVersion()` instead of internal method
- Updated `update()` method to use `versioningService.createVersion()` for automatic version creation
- Updated `getVersionHistory()` to delegate to `versioningService.getVersionHistory()`
- Removed private `createVersionHistory()` method (replaced by versioning service)

#### Benefits:
- Separation of concerns - versioning logic is now centralized
- All question updates automatically create versions
- Consistent version management across the application

### 2. Questionnaire Module
**File:** `/home/user/QML/src/questionnaire/questionnaire.module.ts`

#### Changes:
- Added `PathLogicService` provider
- Added `QuestionnaireAttempt` entity to TypeORM imports
- Exported `PathLogicService` for use in other modules

### 3. Question Module
**File:** `/home/user/QML/src/question/question.module.ts`

#### Changes:
- Added `VersioningModule` import
- Enables QuestionService to use VersioningService

## Data Structures

### PathLogicStructure Interface
Located in `/home/user/QML/src/questionnaire/entities/questionnaire.entity.ts`:
```typescript
{
  type: 'path' | 'question' | 'break' | 'end' | 'goto',
  questionId?: number,
  answers?: {
    [answerId: string]: PathLogicStructure
  },
  label?: string,
  goto?: string
}
```

### QuestionVersion Entity
Located in `/home/user/QML/src/versioning/entities/question-version.entity.ts`:
- Stores complete snapshots of question state
- Tracks version number, change description, and creator
- Includes creation timestamp

## Integration Points

### Path Logic Integration
The PathLogicService integrates with:
- **QuestionnaireAttempt** - Tracks path taken via metadata.pathTaken array
- **Questionnaire** - Reads pathLogic structure for navigation
- **Question** - Retrieves question IDs for path nodes

### Versioning Integration
The VersioningService integrates with:
- **QuestionService** - Automatically creates versions on create/update
- **Question** - Creates snapshots of question data
- **QuestionVersion** - Stores version history
- **User** - Tracks who made changes

## Usage Examples

### Path Logic Service
```typescript
// Get next question in path
const nextQuestionId = await pathLogicService.getNextQuestion(
  attemptId,
  currentQuestionId,
  selectedAnswer
);

// Validate path logic
const validation = pathLogicService.validatePathLogic(pathStructure);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
}

// Get all possible paths
const paths = await pathLogicService.getQuestionPath(questionnaireId);
```

### Versioning Service
```typescript
// Create a version
await versioningService.createVersion(question, 'Updated content', userId);

// Compare versions
const comparison = await versioningService.compareVersions(v1Id, v2Id);
console.log(comparison.summary);
console.log(comparison.differences);

// Revert to previous version
await versioningService.revertToVersion(questionId, versionId, userId);
```

## Testing Recommendations

### Path Logic Service Tests
1. Test simple linear paths
2. Test branching paths based on answers
3. Test goto labels and jumps
4. Test break statements
5. Test nested path structures
6. Test path validation with invalid structures
7. Test infinite loop prevention

### Versioning Service Tests
1. Test version creation on question create
2. Test version creation on question update
3. Test version comparison and diff generation
4. Test reverting to previous versions
5. Test version pruning
6. Test version history retrieval
7. Test deep object comparison

## Performance Considerations

### Path Logic
- Path map building is optimized with O(n) traversal
- Visited set prevents infinite loops
- Metadata updates are batched with attempt saves

### Versioning
- Complete snapshots ensure data integrity but use more storage
- Consider implementing version pruning strategy for long-term maintenance
- Version comparison uses deep equality checks which may be slow for large objects

## Future Enhancements

### Path Logic
1. Add support for conditional paths based on question scores
2. Add support for time-based path branching
3. Add path analytics (most common paths, completion rates)
4. Add visual path builder/editor

### Versioning
1. Add support for partial snapshots (delta storage)
2. Add version tagging and releases
3. Add version rollback previews
4. Add version comparison UI
5. Add automated version cleanup policies
6. Add version export/import functionality

## Security Considerations

- Path logic validation prevents malicious path structures
- Version reverts are logged with user attribution
- All version operations require user authentication
- Path navigation respects questionnaire permissions
