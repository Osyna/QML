import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Questionnaire, PathLogicStructure } from './entities/questionnaire.entity';
import { QuestionnaireAttempt } from '../answer/entities/questionnaire-attempt.entity';

export interface PathResolution {
  type: 'question' | 'break' | 'end' | 'goto';
  questionId?: number;
  label?: string;
  gotoLabel?: string;
}

export interface PathNode {
  questionId: number;
  possibleNextQuestions: number[];
  isEndNode: boolean;
}

@Injectable()
export class PathLogicService {
  constructor(
    @InjectRepository(QuestionnaireAttempt)
    private attemptRepository: Repository<QuestionnaireAttempt>,
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
  ) {}

  /**
   * Get the next question based on path logic
   * @param attemptId - Current attempt ID
   * @param currentQuestionId - Current question ID
   * @param selectedAnswer - Selected answer(s) - can be string, number, or array
   * @returns Next question ID or null if end of path
   */
  async getNextQuestion(
    attemptId: number,
    currentQuestionId: number,
    selectedAnswer: string | number | string[] | number[],
  ): Promise<number | null> {
    // Get the attempt with questionnaire
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['questionnaire'],
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    const questionnaire = attempt.questionnaire;

    if (!questionnaire.pathLogic || questionnaire.pathLogic.length === 0) {
      // No path logic, return null (end of questionnaire)
      return null;
    }

    // Build path map for efficient navigation
    const pathMap = this.buildPathMap(questionnaire);

    // Find current question in path logic
    const currentPath = this.findQuestionInPath(
      questionnaire.pathLogic,
      currentQuestionId,
    );

    if (!currentPath) {
      // Question not in path, return null
      return null;
    }

    // Resolve the next path based on the selected answer
    const answerId = Array.isArray(selectedAnswer)
      ? selectedAnswer[0]?.toString()
      : selectedAnswer?.toString();

    const nextPath = this.resolvePathType(currentPath, answerId);

    // Update path taken in metadata
    await this.updatePathTaken(attemptId, currentQuestionId);

    // Handle different path types
    switch (nextPath.type) {
      case 'question':
        return nextPath.questionId || null;

      case 'goto':
        if (nextPath.gotoLabel) {
          const gotoQuestion = this.findLabelInPath(
            questionnaire.pathLogic,
            nextPath.gotoLabel,
          );
          return gotoQuestion?.questionId || null;
        }
        return null;

      case 'break':
        // Break out of current nested structure, find next sibling
        return this.findNextSibling(
          questionnaire.pathLogic,
          currentQuestionId,
        );

      case 'end':
      default:
        return null;
    }
  }

  /**
   * Validate path logic structure
   * @param pathStructure - Path logic structure to validate
   * @returns Validation result with errors if any
   */
  validatePathLogic(pathStructure: PathLogicStructure[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!pathStructure || pathStructure.length === 0) {
      errors.push('Path structure is empty');
      return { valid: false, errors };
    }

    const labels = new Set<string>();
    const gotoReferences = new Set<string>();
    const questionIds = new Set<number>();

    const validateNode = (
      node: PathLogicStructure,
      path: string = 'root',
    ): void => {
      // Validate type
      const validTypes = ['path', 'question', 'break', 'end', 'goto'];
      if (!validTypes.includes(node.type)) {
        errors.push(`Invalid type '${node.type}' at ${path}`);
      }

      // Validate question type
      if (node.type === 'question') {
        if (!node.questionId) {
          errors.push(`Question node missing questionId at ${path}`);
        } else {
          if (questionIds.has(node.questionId)) {
            errors.push(
              `Duplicate question ID ${node.questionId} at ${path}`,
            );
          }
          questionIds.add(node.questionId);
        }

        // Validate answers structure
        if (node.answers) {
          Object.keys(node.answers).forEach((answerId) => {
            validateNode(
              node.answers![answerId],
              `${path}.answers.${answerId}`,
            );
          });
        }
      }

      // Validate goto type
      if (node.type === 'goto') {
        if (!node.goto) {
          errors.push(`Goto node missing goto label at ${path}`);
        } else {
          gotoReferences.add(node.goto);
        }
      }

      // Validate label
      if (node.label) {
        if (labels.has(node.label)) {
          errors.push(`Duplicate label '${node.label}' at ${path}`);
        }
        labels.add(node.label);
      }

      // Validate path type (container)
      if (node.type === 'path') {
        if (node.answers) {
          Object.keys(node.answers).forEach((answerId) => {
            validateNode(
              node.answers![answerId],
              `${path}.answers.${answerId}`,
            );
          });
        }
      }
    };

    // Validate all nodes
    pathStructure.forEach((node, index) => {
      validateNode(node, `path[${index}]`);
    });

    // Check that all goto references have corresponding labels
    gotoReferences.forEach((gotoRef) => {
      if (!labels.has(gotoRef)) {
        errors.push(`Goto reference '${gotoRef}' has no matching label`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all possible paths through a questionnaire
   * @param questionnaireId - Questionnaire ID
   * @param startQuestionId - Optional starting question ID
   * @returns Array of possible paths (arrays of question IDs)
   */
  async getQuestionPath(
    questionnaireId: number,
    startQuestionId?: number,
  ): Promise<number[][]> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    if (!questionnaire.pathLogic || questionnaire.pathLogic.length === 0) {
      return [];
    }

    const paths: number[][] = [];
    const visited = new Set<number>();

    const traversePath = (
      node: PathLogicStructure,
      currentPath: number[],
    ): void => {
      if (node.type === 'question' && node.questionId) {
        // Avoid infinite loops
        if (visited.has(node.questionId)) {
          paths.push([...currentPath]);
          return;
        }

        visited.add(node.questionId);
        currentPath.push(node.questionId);

        if (node.answers) {
          const answerIds = Object.keys(node.answers);
          if (answerIds.length === 0) {
            paths.push([...currentPath]);
          } else {
            answerIds.forEach((answerId) => {
              traversePath(node.answers![answerId], [...currentPath]);
            });
          }
        } else {
          paths.push([...currentPath]);
        }

        visited.delete(node.questionId);
      } else if (node.type === 'end' || node.type === 'break') {
        paths.push([...currentPath]);
      } else if (node.type === 'path' && node.answers) {
        Object.keys(node.answers).forEach((answerId) => {
          traversePath(node.answers![answerId], [...currentPath]);
        });
      }
    };

    // Start traversal
    if (startQuestionId) {
      const startNode = this.findQuestionInPath(
        questionnaire.pathLogic,
        startQuestionId,
      );
      if (startNode) {
        traversePath(startNode, []);
      }
    } else {
      questionnaire.pathLogic.forEach((node) => {
        traversePath(node, []);
      });
    }

    return paths;
  }

  /**
   * Resolve path type based on answer
   * @param pathNode - Current path node
   * @param answer - Selected answer ID
   * @returns Path resolution
   */
  resolvePathType(
    pathNode: PathLogicStructure,
    answer?: string,
  ): PathResolution {
    if (pathNode.type === 'end') {
      return { type: 'end' };
    }

    if (pathNode.type === 'break') {
      return { type: 'break' };
    }

    if (pathNode.type === 'goto') {
      return {
        type: 'goto',
        gotoLabel: pathNode.goto,
      };
    }

    if (pathNode.type === 'question') {
      if (!pathNode.answers || !answer) {
        return { type: 'end' };
      }

      const nextNode = pathNode.answers[answer];
      if (!nextNode) {
        return { type: 'end' };
      }

      return this.resolvePathType(nextNode, undefined);
    }

    if (pathNode.type === 'path') {
      if (!pathNode.answers || !answer) {
        return { type: 'end' };
      }

      const nextNode = pathNode.answers[answer];
      if (!nextNode) {
        return { type: 'end' };
      }

      if (nextNode.type === 'question') {
        return {
          type: 'question',
          questionId: nextNode.questionId,
        };
      }

      return this.resolvePathType(nextNode, undefined);
    }

    return { type: 'end' };
  }

  /**
   * Build a path map for efficient navigation
   * @param questionnaire - Questionnaire with path logic
   * @returns Map of question IDs to path nodes
   */
  buildPathMap(questionnaire: Questionnaire): Map<number, PathNode> {
    const pathMap = new Map<number, PathNode>();

    if (!questionnaire.pathLogic || questionnaire.pathLogic.length === 0) {
      return pathMap;
    }

    const processNode = (node: PathLogicStructure): void => {
      if (node.type === 'question' && node.questionId) {
        const possibleNextQuestions: number[] = [];
        let isEndNode = true;

        if (node.answers) {
          Object.values(node.answers).forEach((answerPath) => {
            if (answerPath.type === 'question' && answerPath.questionId) {
              possibleNextQuestions.push(answerPath.questionId);
              isEndNode = false;
            }
            processNode(answerPath);
          });
        }

        pathMap.set(node.questionId, {
          questionId: node.questionId,
          possibleNextQuestions,
          isEndNode,
        });
      } else if (node.type === 'path' && node.answers) {
        Object.values(node.answers).forEach((answerPath) => {
          processNode(answerPath);
        });
      }
    };

    questionnaire.pathLogic.forEach((node) => {
      processNode(node);
    });

    return pathMap;
  }

  /**
   * Get the initial question in a questionnaire
   * @param questionnaire - Questionnaire
   * @returns First question ID or null
   */
  getInitialQuestion(questionnaire: Questionnaire): number | null {
    if (!questionnaire.pathLogic || questionnaire.pathLogic.length === 0) {
      return null;
    }

    // Find first question node
    const findFirstQuestion = (node: PathLogicStructure): number | null => {
      if (node.type === 'question' && node.questionId) {
        return node.questionId;
      }

      if (node.type === 'path' && node.answers) {
        // Get first answer's path
        const firstAnswerKey = Object.keys(node.answers)[0];
        if (firstAnswerKey) {
          return findFirstQuestion(node.answers[firstAnswerKey]);
        }
      }

      return null;
    };

    for (const node of questionnaire.pathLogic) {
      const questionId = findFirstQuestion(node);
      if (questionId !== null) {
        return questionId;
      }
    }

    return null;
  }

  /**
   * Check if an attempt has reached the end of the path
   * @param attemptId - Attempt ID
   * @returns True if at end of path
   */
  async isEndOfPath(attemptId: number): Promise<boolean> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['questionnaire', 'submissions'],
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    const questionnaire = attempt.questionnaire;

    if (!questionnaire.pathLogic || questionnaire.pathLogic.length === 0) {
      // No path logic, check if all questions answered
      return attempt.submissions?.length >= questionnaire.questions?.length;
    }

    // Get current question from metadata
    const pathTaken = attempt.metadata?.pathTaken || [];
    if (pathTaken.length === 0) {
      return false;
    }

    const lastQuestionId = pathTaken[pathTaken.length - 1];
    const pathMap = this.buildPathMap(questionnaire);
    const lastNode = pathMap.get(lastQuestionId);

    return lastNode?.isEndNode ?? false;
  }

  /**
   * Find a question node in path structure
   * @param pathStructure - Path structure to search
   * @param questionId - Question ID to find
   * @returns Path node or null
   */
  private findQuestionInPath(
    pathStructure: PathLogicStructure[],
    questionId: number,
  ): PathLogicStructure | null {
    const search = (node: PathLogicStructure): PathLogicStructure | null => {
      if (node.type === 'question' && node.questionId === questionId) {
        return node;
      }

      if (node.answers) {
        for (const answerPath of Object.values(node.answers)) {
          const found = search(answerPath);
          if (found) {
            return found;
          }
        }
      }

      return null;
    };

    for (const node of pathStructure) {
      const found = search(node);
      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * Find a label in path structure
   * @param pathStructure - Path structure to search
   * @param label - Label to find
   * @returns Path node or null
   */
  private findLabelInPath(
    pathStructure: PathLogicStructure[],
    label: string,
  ): PathLogicStructure | null {
    const search = (node: PathLogicStructure): PathLogicStructure | null => {
      if (node.label === label) {
        return node;
      }

      if (node.answers) {
        for (const answerPath of Object.values(node.answers)) {
          const found = search(answerPath);
          if (found) {
            return found;
          }
        }
      }

      return null;
    };

    for (const node of pathStructure) {
      const found = search(node);
      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * Find the next sibling in path structure (for break statements)
   * @param pathStructure - Path structure
   * @param currentQuestionId - Current question ID
   * @returns Next sibling question ID or null
   */
  private findNextSibling(
    pathStructure: PathLogicStructure[],
    currentQuestionId: number,
  ): number | null {
    // This is a simplified implementation
    // In a more complex scenario, you'd need to track parent-child relationships
    for (let i = 0; i < pathStructure.length; i++) {
      const node = pathStructure[i];
      if (node.type === 'question' && node.questionId === currentQuestionId) {
        // Found current node, return next sibling if exists
        if (i + 1 < pathStructure.length) {
          const nextNode = pathStructure[i + 1];
          if (nextNode.type === 'question') {
            return nextNode.questionId || null;
          }
        }
      }
    }

    return null;
  }

  /**
   * Update path taken in attempt metadata
   * @param attemptId - Attempt ID
   * @param questionId - Question ID to add to path
   */
  private async updatePathTaken(
    attemptId: number,
    questionId: number,
  ): Promise<void> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
    });

    if (!attempt) {
      return;
    }

    const metadata = attempt.metadata || {};
    const pathTaken = metadata.pathTaken || [];

    if (!pathTaken.includes(questionId)) {
      pathTaken.push(questionId);
    }

    metadata.pathTaken = pathTaken;
    attempt.metadata = metadata;

    await this.attemptRepository.save(attempt);
  }
}
