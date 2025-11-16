import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionVersion } from './entities/question-version.entity';
import { Question } from '../question/entities/question.entity';

export interface VersionDiff {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
}

export interface VersionComparison {
  version1: QuestionVersion;
  version2: QuestionVersion;
  differences: VersionDiff[];
  summary: string;
}

@Injectable()
export class VersioningService {
  constructor(
    @InjectRepository(QuestionVersion)
    private versionRepository: Repository<QuestionVersion>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  /**
   * Create a new version snapshot of a question
   * @param question - Question entity
   * @param changeDescription - Description of changes
   * @param userId - User making the change
   * @returns Created version
   */
  async createVersion(
    question: Question,
    changeDescription: string,
    userId: number,
  ): Promise<QuestionVersion> {
    // Create complete snapshot of question
    const snapshot = {
      id: question.id,
      type: question.type,
      content: question.content,
      points: question.points,
      difficulty: question.difficulty,
      category: question.category,
      timeLimit: question.timeLimit,
      checkType: question.checkType,
      checkConfig: question.checkConfig,
      minChar: question.minChar,
      maxChar: question.maxChar,
      isPublic: question.isPublic,
      isActive: question.isActive,
      searchableContent: question.searchableContent,
      totalAttempts: question.totalAttempts,
      correctAttempts: question.correctAttempts,
      averageScore: question.averageScore,
      averageTimeSpent: question.averageTimeSpent,
    };

    const version = this.versionRepository.create({
      question_id: question.id,
      version: question.version,
      snapshot,
      changeDescription,
      created_by_id: userId,
    });

    return this.versionRepository.save(version);
  }

  /**
   * Get all versions of a question
   * @param questionId - Question ID
   * @returns Array of versions ordered by creation date (newest first)
   */
  async getVersionHistory(questionId: number): Promise<QuestionVersion[]> {
    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return this.versionRepository.find({
      where: { question_id: questionId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific version by ID
   * @param versionId - Version ID
   * @returns Version entity
   */
  async getVersion(versionId: number): Promise<QuestionVersion> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId },
      relations: ['createdBy', 'question'],
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    return version;
  }

  /**
   * Compare two versions of a question
   * @param versionId1 - First version ID
   * @param versionId2 - Second version ID
   * @returns Comparison result with differences
   */
  async compareVersions(
    versionId1: number,
    versionId2: number,
  ): Promise<VersionComparison> {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2),
    ]);

    // Ensure versions are from the same question
    if (version1.question_id !== version2.question_id) {
      throw new BadRequestException(
        'Cannot compare versions from different questions',
      );
    }

    const differences = this.generateDiff(
      version1.snapshot,
      version2.snapshot,
    );

    const summary = this.generateDiffSummary(differences);

    return {
      version1,
      version2,
      differences,
      summary,
    };
  }

  /**
   * Revert a question to a specific version
   * @param questionId - Question ID
   * @param versionId - Version ID to revert to
   * @param userId - User performing the revert
   * @returns Updated question
   */
  async revertToVersion(
    questionId: number,
    versionId: number,
    userId: number,
  ): Promise<Question> {
    const [question, version] = await Promise.all([
      this.questionRepository.findOne({
        where: { id: questionId },
      }),
      this.getVersion(versionId),
    ]);

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Verify version belongs to this question
    if (version.question_id !== questionId) {
      throw new BadRequestException(
        'Version does not belong to this question',
      );
    }

    // Save current state as a version before reverting
    await this.createVersion(
      question,
      `Before reverting to version ${version.version}`,
      userId,
    );

    // Restore snapshot data
    const snapshot = version.snapshot;
    question.type = snapshot.type;
    question.content = snapshot.content;
    question.points = snapshot.points;
    question.difficulty = snapshot.difficulty;
    question.category = snapshot.category;
    question.timeLimit = snapshot.timeLimit;
    question.checkType = snapshot.checkType;
    question.checkConfig = snapshot.checkConfig;
    question.minChar = snapshot.minChar;
    question.maxChar = snapshot.maxChar;
    question.isPublic = snapshot.isPublic;
    question.isActive = snapshot.isActive;
    question.searchableContent = snapshot.searchableContent;

    // Update version number
    const newVersion = this.incrementVersion(question.version);
    question.version = newVersion;

    const updatedQuestion = await this.questionRepository.save(question);

    // Create a new version entry for the revert
    await this.createVersion(
      updatedQuestion,
      `Reverted to version ${version.version}`,
      userId,
    );

    return updatedQuestion;
  }

  /**
   * Get the latest version of a question
   * @param questionId - Question ID
   * @returns Latest version or null
   */
  async getLatestVersion(questionId: number): Promise<QuestionVersion | null> {
    const versions = await this.versionRepository.find({
      where: { question_id: questionId },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Delete old versions (keep only N most recent)
   * @param questionId - Question ID
   * @param keepCount - Number of versions to keep
   * @returns Number of deleted versions
   */
  async pruneVersions(
    questionId: number,
    keepCount: number = 10,
  ): Promise<number> {
    const versions = await this.versionRepository.find({
      where: { question_id: questionId },
      order: { createdAt: 'DESC' },
    });

    if (versions.length <= keepCount) {
      return 0;
    }

    const versionsToDelete = versions.slice(keepCount);
    await this.versionRepository.remove(versionsToDelete);

    return versionsToDelete.length;
  }

  /**
   * Generate diff between two snapshots
   * @param snapshot1 - First snapshot
   * @param snapshot2 - Second snapshot
   * @returns Array of differences
   */
  private generateDiff(snapshot1: any, snapshot2: any): VersionDiff[] {
    const differences: VersionDiff[] = [];

    // Get all unique keys from both snapshots
    const allKeys = new Set([
      ...Object.keys(snapshot1 || {}),
      ...Object.keys(snapshot2 || {}),
    ]);

    allKeys.forEach((key) => {
      const value1 = snapshot1?.[key];
      const value2 = snapshot2?.[key];

      // Skip if values are identical
      if (this.deepEqual(value1, value2)) {
        return;
      }

      // Determine type of change
      let type: 'added' | 'removed' | 'modified';
      if (value1 === undefined || value1 === null) {
        type = 'added';
      } else if (value2 === undefined || value2 === null) {
        type = 'removed';
      } else {
        type = 'modified';
      }

      differences.push({
        field: key,
        oldValue: value1,
        newValue: value2,
        type,
      });
    });

    return differences;
  }

  /**
   * Generate a human-readable summary of differences
   * @param differences - Array of differences
   * @returns Summary string
   */
  private generateDiffSummary(differences: VersionDiff[]): string {
    if (differences.length === 0) {
      return 'No differences found';
    }

    const summaryParts: string[] = [];

    const added = differences.filter((d) => d.type === 'added');
    const removed = differences.filter((d) => d.type === 'removed');
    const modified = differences.filter((d) => d.type === 'modified');

    if (added.length > 0) {
      summaryParts.push(
        `Added: ${added.map((d) => d.field).join(', ')}`,
      );
    }

    if (removed.length > 0) {
      summaryParts.push(
        `Removed: ${removed.map((d) => d.field).join(', ')}`,
      );
    }

    if (modified.length > 0) {
      summaryParts.push(
        `Modified: ${modified.map((d) => d.field).join(', ')}`,
      );
    }

    return summaryParts.join('. ');
  }

  /**
   * Deep equality check for objects
   * @param obj1 - First object
   * @param obj2 - Second object
   * @returns True if objects are deeply equal
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (
      obj1 == null ||
      obj2 == null ||
      typeof obj1 !== 'object' ||
      typeof obj2 !== 'object'
    ) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Increment semantic version
   * @param currentVersion - Current version string
   * @returns Incremented version
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    if (parts.length === 2) {
      const major = parseInt(parts[0], 10);
      const minor = parseInt(parts[1], 10);
      return `${major}.${minor + 1}`;
    }
    return currentVersion;
  }

  /**
   * Get version count for a question
   * @param questionId - Question ID
   * @returns Number of versions
   */
  async getVersionCount(questionId: number): Promise<number> {
    return this.versionRepository.count({
      where: { question_id: questionId },
    });
  }

  /**
   * Get versions created by a specific user
   * @param userId - User ID
   * @returns Array of versions
   */
  async getVersionsByUser(userId: number): Promise<QuestionVersion[]> {
    return this.versionRepository.find({
      where: { created_by_id: userId },
      relations: ['question', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get versions created in a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of versions
   */
  async getVersionsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<QuestionVersion[]> {
    return this.versionRepository
      .createQueryBuilder('version')
      .leftJoinAndSelect('version.question', 'question')
      .leftJoinAndSelect('version.createdBy', 'createdBy')
      .where('version.createdAt >= :startDate', { startDate })
      .andWhere('version.createdAt <= :endDate', { endDate })
      .orderBy('version.createdAt', 'DESC')
      .getMany();
  }
}
