import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question, QuestionContent } from '../question/entities/question.entity';
import { Questionnaire } from '../questionnaire/entities/questionnaire.entity';
import { QuestionService } from '../question/question.service';
import { QuestionnaireService } from '../questionnaire/questionnaire.service';
import * as csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { Readable } from 'stream';
import * as xml2js from 'xml2js';
import {
  QuestionType,
  Difficulty,
  CheckType,
  QuestionnaireType,
} from '../common/enums';

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  QTI = 'qti',
  GIFT = 'gift',
}

export interface ExportOptions {
  includeStatistics?: boolean;
  includeMetadata?: boolean;
  includeRelations?: boolean;
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
    private questionService: QuestionService,
    private questionnaireService: QuestionnaireService,
  ) {}

  /**
   * Export questions to specified format
   */
  async exportQuestions(
    questionIds: number[],
    format: ExportFormat,
    options: ExportOptions = {},
  ): Promise<string | Buffer> {
    this.logger.log(
      `Exporting ${questionIds.length} questions to ${format} format`,
    );

    const questions = await this.questionRepository.find({
      where: { id: In(questionIds) },
      relations: options.includeRelations
        ? ['createdBy', 'pools', 'questionnaires']
        : [],
    });

    if (questions.length === 0) {
      throw new NotFoundException('No questions found with the provided IDs');
    }

    switch (format) {
      case ExportFormat.JSON:
        return this.generateJSON(questions, options);
      case ExportFormat.CSV:
        return this.generateCSV(questions);
      case ExportFormat.QTI:
        return this.generateQTI(questions);
      case ExportFormat.GIFT:
        return this.generateGIFT(questions);
      default:
        throw new BadRequestException(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export questionnaire with all its questions
   */
  async exportQuestionnaire(
    questionnaireId: number,
    format: ExportFormat,
    options: ExportOptions = {},
  ): Promise<string | Buffer> {
    this.logger.log(
      `Exporting questionnaire ${questionnaireId} to ${format} format`,
    );

    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions', 'createdBy'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    const exportData = {
      questionnaire: {
        name: questionnaire.name,
        description: questionnaire.description,
        tags: questionnaire.tags,
        type: questionnaire.type,
        maxQuestions: questionnaire.maxQuestions,
        version: questionnaire.version,
        difficulty: questionnaire.difficulty,
        category: questionnaire.category,
        timeLimit: questionnaire.timeLimit,
        points: questionnaire.points,
        passPercentage: questionnaire.passPercentage,
        passPoints: questionnaire.passPoints,
        passText: questionnaire.passText,
        failText: questionnaire.failText,
        feedback: questionnaire.feedback,
        settings: questionnaire.settings,
        pathLogic: questionnaire.pathLogic,
      },
      questions: questionnaire.questions,
    };

    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(exportData, null, 2);
      case ExportFormat.CSV:
        return this.generateCSV(questionnaire.questions);
      case ExportFormat.QTI:
        return this.generateQuestionnaireQTI(exportData);
      case ExportFormat.GIFT:
        return this.generateGIFT(questionnaire.questions);
      default:
        throw new BadRequestException(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import questions from file
   */
  async importQuestions(
    fileBuffer: Buffer,
    format: ExportFormat,
    userId: number,
  ): Promise<Question[]> {
    this.logger.log(`Importing questions from ${format} format`);

    let parsedData: any[];

    switch (format) {
      case ExportFormat.JSON:
        parsedData = await this.parseJSON(fileBuffer);
        break;
      case ExportFormat.CSV:
        parsedData = await this.parseCSV(fileBuffer);
        break;
      case ExportFormat.QTI:
        parsedData = await this.parseQTI(fileBuffer);
        break;
      case ExportFormat.GIFT:
        parsedData = await this.parseGIFT(fileBuffer);
        break;
      default:
        throw new BadRequestException(`Unsupported import format: ${format}`);
    }

    // Validate imported data
    this.validateImportData(parsedData, format);

    // Create questions
    const importedQuestions: Question[] = [];
    for (const questionData of parsedData) {
      try {
        const question = await this.questionService.create(questionData, userId);
        importedQuestions.push(question);
      } catch (error) {
        this.logger.error(
          `Failed to import question: ${error.message}`,
          error.stack,
        );
        // Continue importing other questions
      }
    }

    this.logger.log(
      `Successfully imported ${importedQuestions.length} out of ${parsedData.length} questions`,
    );

    return importedQuestions;
  }

  /**
   * Import questionnaire from file
   */
  async importQuestionnaire(
    fileBuffer: Buffer,
    format: ExportFormat,
    userId: number,
  ): Promise<Questionnaire> {
    this.logger.log(`Importing questionnaire from ${format} format`);

    let parsedData: any;

    if (format !== ExportFormat.JSON) {
      throw new BadRequestException(
        'Questionnaire import only supports JSON format',
      );
    }

    parsedData = JSON.parse(fileBuffer.toString('utf-8'));

    if (!parsedData.questionnaire || !parsedData.questions) {
      throw new BadRequestException(
        'Invalid questionnaire format: must contain questionnaire and questions',
      );
    }

    // First, import all questions
    const importedQuestions: Question[] = [];
    for (const questionData of parsedData.questions) {
      try {
        const question = await this.questionService.create(
          {
            type: questionData.type,
            minChar: questionData.minChar,
            maxChar: questionData.maxChar,
            checkType: questionData.checkType,
            checkConfig: questionData.checkConfig,
            points: questionData.points,
            difficulty: questionData.difficulty,
            category: questionData.category,
            timeLimit: questionData.timeLimit,
            content: questionData.content,
            isActive: true,
            isPublic: false,
          },
          userId,
        );
        importedQuestions.push(question);
      } catch (error) {
        this.logger.error(
          `Failed to import question: ${error.message}`,
          error.stack,
        );
      }
    }

    // Then create the questionnaire
    const questionnaire = await this.questionnaireService.create(
      {
        name: parsedData.questionnaire.name,
        description: parsedData.questionnaire.description,
        tags: parsedData.questionnaire.tags,
        type: parsedData.questionnaire.type || QuestionnaireType.QuestionsAnswers,
        maxQuestions: parsedData.questionnaire.maxQuestions,
        version: parsedData.questionnaire.version || '1.0',
        difficulty: parsedData.questionnaire.difficulty,
        category: parsedData.questionnaire.category,
        timeLimit: parsedData.questionnaire.timeLimit,
        points: parsedData.questionnaire.points,
        passPercentage: parsedData.questionnaire.passPercentage,
        passPoints: parsedData.questionnaire.passPoints,
        passText: parsedData.questionnaire.passText,
        failText: parsedData.questionnaire.failText,
        feedback: parsedData.questionnaire.feedback,
        settings: parsedData.questionnaire.settings,
        pathLogic: parsedData.questionnaire.pathLogic,
      },
      userId,
    );

    // Add questions to the questionnaire
    if (importedQuestions.length > 0) {
      await this.questionnaireService.addQuestions(
        questionnaire.id,
        importedQuestions.map((q) => q.id),
      );
    }

    // Return the questionnaire with questions loaded
    return this.questionnaireRepository.findOne({
      where: { id: questionnaire.id },
      relations: ['questions', 'createdBy'],
    });
  }

  /**
   * Validate import data structure
   */
  validateImportData(data: any[], format: ExportFormat): void {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Import data must be an array of questions');
    }

    for (const item of data) {
      // Check required fields
      if (!item.type) {
        throw new BadRequestException('Each question must have a type');
      }

      if (!item.content || !item.content.text) {
        throw new BadRequestException(
          'Each question must have content with text',
        );
      }

      // Validate question type
      if (!Object.values(QuestionType).includes(item.type)) {
        throw new BadRequestException(
          `Invalid question type: ${item.type}. Must be one of ${Object.values(QuestionType).join(', ')}`,
        );
      }

      // Validate difficulty if provided
      if (item.difficulty && !Object.values(Difficulty).includes(item.difficulty)) {
        throw new BadRequestException(
          `Invalid difficulty: ${item.difficulty}. Must be one of ${Object.values(Difficulty).join(', ')}`,
        );
      }

      // Validate check type if provided
      if (item.checkType && !Object.values(CheckType).includes(item.checkType)) {
        throw new BadRequestException(
          `Invalid check type: ${item.checkType}. Must be one of ${Object.values(CheckType).join(', ')}`,
        );
      }

      // Type-specific validations
      if (
        [
          QuestionType.MultipleChoice,
          QuestionType.TrueFalse,
          QuestionType.YesNo,
        ].includes(item.type)
      ) {
        if (!item.content.answers || !Array.isArray(item.content.answers)) {
          throw new BadRequestException(
            `Question type ${item.type} must have answers array`,
          );
        }
      }
    }

    this.logger.log(`Validated ${data.length} questions successfully`);
  }

  /**
   * Parse CSV file buffer
   */
  async parseCSV(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(fileBuffer.toString('utf-8'));

      stream
        .pipe(csvParser())
        .on('data', (row) => {
          try {
            // Parse the CSV row into question format
            const question: any = {
              type: row.type || QuestionType.FreeText,
              content: {
                text: row.text || row.question || '',
                answers: [],
                hints: [],
                feedback: {},
                tags: row.tags ? row.tags.split(';').map((t: string) => t.trim()) : [],
              },
              difficulty: row.difficulty || null,
              category: row.category || null,
              points: row.points ? parseFloat(row.points) : 1,
              timeLimit: row.timeLimit ? parseInt(row.timeLimit, 10) : null,
              checkType: row.checkType || CheckType.Exact,
            };

            // Parse answers if present
            if (row.answers) {
              const answerStrings = row.answers.split('|');
              const correctAnswers = row.correctAnswers
                ? row.correctAnswers.split('|')
                : [];

              question.content.answers = answerStrings.map(
                (answerText: string, index: number) => ({
                  answerText: answerText.trim(),
                  isCorrect: correctAnswers.includes(answerText.trim()),
                  points: question.points,
                  order: index,
                }),
              );
            }

            // Parse feedback
            if (row.correctFeedback) {
              question.content.feedback.correct = row.correctFeedback;
            }
            if (row.incorrectFeedback) {
              question.content.feedback.incorrect = row.incorrectFeedback;
            }

            results.push(question);
          } catch (error) {
            this.logger.error(`Error parsing CSV row: ${error.message}`);
          }
        })
        .on('end', () => {
          this.logger.log(`Parsed ${results.length} questions from CSV`);
          resolve(results);
        })
        .on('error', (error) => {
          this.logger.error(`CSV parsing error: ${error.message}`);
          reject(new BadRequestException(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  /**
   * Parse JSON file buffer
   */
  async parseJSON(fileBuffer: Buffer): Promise<any[]> {
    try {
      const jsonData = JSON.parse(fileBuffer.toString('utf-8'));

      if (Array.isArray(jsonData)) {
        return jsonData;
      } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
        return jsonData.questions;
      } else {
        throw new BadRequestException(
          'JSON must be an array of questions or an object with a questions array',
        );
      }
    } catch (error) {
      throw new BadRequestException(`JSON parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse QTI XML file buffer (IMS QTI 2.1)
   */
  async parseQTI(fileBuffer: Buffer): Promise<any[]> {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(fileBuffer.toString('utf-8'));

      const questions: any[] = [];

      // QTI structure varies, handle assessment item
      const items = this.extractQTIItems(result);

      for (const item of items) {
        const question = this.parseQTIItem(item);
        if (question) {
          questions.push(question);
        }
      }

      this.logger.log(`Parsed ${questions.length} questions from QTI`);
      return questions;
    } catch (error) {
      this.logger.error(`QTI parsing error: ${error.message}`);
      throw new BadRequestException(`QTI parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse Moodle GIFT format
   */
  async parseGIFT(fileBuffer: Buffer): Promise<any[]> {
    try {
      const giftText = fileBuffer.toString('utf-8');
      const questions: any[] = [];

      // Split by double newlines (questions are separated by blank lines)
      const questionBlocks = giftText.split(/\n\s*\n/).filter((block) => block.trim());

      for (const block of questionBlocks) {
        const question = this.parseGIFTQuestion(block.trim());
        if (question) {
          questions.push(question);
        }
      }

      this.logger.log(`Parsed ${questions.length} questions from GIFT format`);
      return questions;
    } catch (error) {
      this.logger.error(`GIFT parsing error: ${error.message}`);
      throw new BadRequestException(`GIFT parsing failed: ${error.message}`);
    }
  }

  /**
   * Generate CSV from questions
   */
  async generateCSV(questions: Question[]): Promise<Buffer> {
    const csvData: any[] = [];

    for (const question of questions) {
      const row: any = {
        id: question.id,
        type: question.type,
        text: question.content.text,
        difficulty: question.difficulty || '',
        category: question.category || '',
        points: question.points,
        timeLimit: question.timeLimit || '',
        checkType: question.checkType,
        tags: question.content.tags ? question.content.tags.join(';') : '',
      };

      // Add answers
      if (question.content.answers && question.content.answers.length > 0) {
        row.answers = question.content.answers
          .map((a) => a.answerText)
          .join('|');
        row.correctAnswers = question.content.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.answerText)
          .join('|');
      }

      // Add feedback
      if (question.content.feedback) {
        row.correctFeedback = question.content.feedback.correct || '';
        row.incorrectFeedback = question.content.feedback.incorrect || '';
      }

      csvData.push(row);
    }

    // Create CSV string manually
    const headers = Object.keys(csvData[0] || {});
    const csvLines = [headers.join(',')];

    for (const row of csvData) {
      const values = headers.map((header) => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('\n')
          ? `"${escaped}"`
          : escaped;
      });
      csvLines.push(values.join(','));
    }

    return Buffer.from(csvLines.join('\n'), 'utf-8');
  }

  /**
   * Generate JSON from questions
   */
  generateJSON(questions: Question[], options: ExportOptions = {}): string {
    const exportData = questions.map((q) => {
      const data: any = {
        type: q.type,
        content: q.content,
        difficulty: q.difficulty,
        category: q.category,
        points: q.points,
        timeLimit: q.timeLimit,
        checkType: q.checkType,
        checkConfig: q.checkConfig,
        version: q.version,
      };

      if (options.includeStatistics) {
        data.statistics = {
          totalAttempts: q.totalAttempts,
          correctAttempts: q.correctAttempts,
          averageScore: q.averageScore,
          averageTimeSpent: q.averageTimeSpent,
        };
      }

      if (options.includeMetadata) {
        data.metadata = {
          id: q.id,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          isActive: q.isActive,
          isPublic: q.isPublic,
        };
      }

      return data;
    });

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate QTI XML from questions (IMS QTI 2.1)
   */
  async generateQTI(questions: Question[]): Promise<string> {
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    });

    const assessmentItems = questions.map((q) => this.questionToQTIItem(q));

    const qtiDocument = {
      questestinterop: {
        $: {
          xmlns: 'http://www.imsglobal.org/xsd/ims_qtiasiv1p2',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:schemaLocation':
            'http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd',
        },
        assessment: {
          $: {
            ident: 'assessment_001',
            title: 'Exported Questions',
          },
          section: {
            $: {
              ident: 'section_001',
              title: 'Main Section',
            },
            item: assessmentItems,
          },
        },
      },
    };

    return builder.buildObject(qtiDocument);
  }

  /**
   * Generate GIFT format from questions
   */
  generateGIFT(questions: Question[]): string {
    const giftLines: string[] = [];

    for (const question of questions) {
      giftLines.push(this.questionToGIFT(question));
      giftLines.push(''); // Blank line between questions
    }

    return giftLines.join('\n');
  }

  /**
   * Generate QTI for questionnaire
   */
  private async generateQuestionnaireQTI(exportData: any): Promise<string> {
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    });

    const assessmentItems = exportData.questions.map((q: Question) =>
      this.questionToQTIItem(q),
    );

    const qtiDocument = {
      questestinterop: {
        $: {
          xmlns: 'http://www.imsglobal.org/xsd/ims_qtiasiv1p2',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:schemaLocation':
            'http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd',
        },
        assessment: {
          $: {
            ident: `assessment_${exportData.questionnaire.name}`,
            title: exportData.questionnaire.name,
          },
          section: {
            $: {
              ident: 'section_001',
              title: exportData.questionnaire.description || 'Main Section',
            },
            item: assessmentItems,
          },
        },
      },
    };

    return builder.buildObject(qtiDocument);
  }

  /**
   * Extract QTI items from parsed XML
   */
  private extractQTIItems(result: any): any[] {
    const items: any[] = [];

    if (result.questestinterop?.assessment?.section) {
      const section = result.questestinterop.assessment.section;
      if (Array.isArray(section)) {
        section.forEach((s) => {
          if (s.item) {
            items.push(...(Array.isArray(s.item) ? s.item : [s.item]));
          }
        });
      } else {
        if (section.item) {
          items.push(...(Array.isArray(section.item) ? section.item : [section.item]));
        }
      }
    }

    return items;
  }

  /**
   * Parse a single QTI item into question format
   */
  private parseQTIItem(item: any): any | null {
    try {
      const questionText =
        item.presentation?.material?.mattext?._ ||
        item.presentation?.material?.mattext ||
        '';

      const question: any = {
        type: QuestionType.MultipleChoice, // Default, will be determined from QTI
        content: {
          text: questionText,
          answers: [],
          hints: [],
          feedback: {},
          tags: [],
        },
        difficulty: null,
        category: null,
        points: 1,
        timeLimit: null,
        checkType: CheckType.Exact,
      };

      // Parse responses
      if (item.presentation?.response_lid) {
        const responseLid = item.presentation.response_lid;
        const renderChoice = responseLid.render_choice;

        if (renderChoice?.response_label) {
          const labels = Array.isArray(renderChoice.response_label)
            ? renderChoice.response_label
            : [renderChoice.response_label];

          question.content.answers = labels.map((label: any, index: number) => ({
            answerText:
              label.material?.mattext?._ || label.material?.mattext || '',
            isCorrect: false, // Will be set from resprocessing
            points: 1,
            order: index,
          }));

          // Determine correct answers from resprocessing
          if (item.resprocessing?.respcondition) {
            const conditions = Array.isArray(item.resprocessing.respcondition)
              ? item.resprocessing.respcondition
              : [item.resprocessing.respcondition];

            conditions.forEach((condition: any) => {
              if (condition.conditionvar?.varequal) {
                const correctId = condition.conditionvar.varequal._ || condition.conditionvar.varequal;
                const answerIndex = labels.findIndex(
                  (l: any) => l.$.ident === correctId,
                );
                if (answerIndex >= 0 && question.content.answers[answerIndex]) {
                  question.content.answers[answerIndex].isCorrect = true;
                }
              }
            });
          }
        }
      }

      return question;
    } catch (error) {
      this.logger.error(`Error parsing QTI item: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse a single GIFT format question
   */
  private parseGIFTQuestion(block: string): any | null {
    try {
      // Basic GIFT format parsing
      const lines = block.split('\n').map((line) => line.trim());

      // Skip comments and empty lines
      const filteredLines = lines.filter(
        (line) => line && !line.startsWith('//'),
      );

      if (filteredLines.length === 0) {
        return null;
      }

      const questionLine = filteredLines[0];

      // Extract question title if present (::title::)
      const titleMatch = questionLine.match(/^::(.+?)::/);
      const questionText = titleMatch
        ? questionLine.replace(/^::.+?::/, '').trim()
        : questionLine;

      const question: any = {
        type: QuestionType.FreeText,
        content: {
          text: questionText,
          answers: [],
          hints: [],
          feedback: {},
          tags: titleMatch ? [titleMatch[1]] : [],
        },
        difficulty: null,
        category: null,
        points: 1,
        timeLimit: null,
        checkType: CheckType.Exact,
      };

      // Parse question type and answers from braces {...}
      const braceMatch = questionText.match(/\{([^}]+)\}/);
      if (braceMatch) {
        const answerSection = braceMatch[1];
        question.content.text = questionText.replace(/\{[^}]+\}/, '').trim();

        // True/False questions
        if (answerSection === 'T' || answerSection === 'TRUE') {
          question.type = QuestionType.TrueFalse;
          question.content.answers = [
            { answerText: 'True', isCorrect: true, points: 1, order: 0 },
            { answerText: 'False', isCorrect: false, points: 0, order: 1 },
          ];
        } else if (answerSection === 'F' || answerSection === 'FALSE') {
          question.type = QuestionType.TrueFalse;
          question.content.answers = [
            { answerText: 'True', isCorrect: false, points: 0, order: 0 },
            { answerText: 'False', isCorrect: true, points: 1, order: 1 },
          ];
        } else if (answerSection.includes('=') || answerSection.includes('~')) {
          // Multiple choice
          question.type = QuestionType.MultipleChoice;
          const answers = answerSection.split(/(?=[=~])/);

          question.content.answers = answers.map((ans, index) => {
            const isCorrect = ans.startsWith('=');
            const answerText = ans.substring(1).trim();

            return {
              answerText,
              isCorrect,
              points: isCorrect ? 1 : 0,
              order: index,
            };
          });
        } else {
          // Free text answer
          question.type = QuestionType.FreeText;
          question.content.answers = [
            {
              answerText: answerSection.replace(/^=/, '').trim(),
              isCorrect: true,
              points: 1,
              order: 0,
            },
          ];
        }
      }

      return question;
    } catch (error) {
      this.logger.error(`Error parsing GIFT question: ${error.message}`);
      return null;
    }
  }

  /**
   * Convert question to QTI item
   */
  private questionToQTIItem(question: Question): any {
    const item: any = {
      $: {
        ident: `question_${question.id}`,
        title: question.content.text.substring(0, 50),
      },
      presentation: {
        material: {
          mattext: {
            $: { texttype: 'text/plain' },
            _: question.content.text,
          },
        },
      },
    };

    // Add answers for multiple choice questions
    if (
      question.content.answers &&
      question.content.answers.length > 0 &&
      [QuestionType.MultipleChoice, QuestionType.TrueFalse].includes(
        question.type,
      )
    ) {
      item.presentation.response_lid = {
        $: {
          ident: `response_${question.id}`,
          rcardinality: 'Single',
        },
        render_choice: {
          response_label: question.content.answers.map((answer, index) => ({
            $: { ident: `answer_${index}` },
            material: {
              mattext: {
                $: { texttype: 'text/plain' },
                _: answer.answerText,
              },
            },
          })),
        },
      };

      // Add correct answer processing
      const correctAnswers = question.content.answers
        .map((answer, index) => (answer.isCorrect ? index : -1))
        .filter((i) => i >= 0);

      if (correctAnswers.length > 0) {
        item.resprocessing = {
          respcondition: correctAnswers.map((index) => ({
            $: { continue: 'No' },
            conditionvar: {
              varequal: {
                $: { respident: `response_${question.id}` },
                _: `answer_${index}`,
              },
            },
            setvar: {
              $: { action: 'Set' },
              _: question.points || 1,
            },
          })),
        };
      }
    }

    return item;
  }

  /**
   * Convert question to GIFT format
   */
  private questionToGIFT(question: Question): string {
    let giftText = '';

    // Add category/title if available
    if (question.category) {
      giftText += `::${question.category}::`;
    }

    // Add question text
    giftText += question.content.text;

    // Add answer section based on question type
    if (question.type === QuestionType.TrueFalse) {
      const correctAnswer = question.content.answers?.find((a) => a.isCorrect);
      if (correctAnswer?.answerText.toLowerCase().includes('true')) {
        giftText += ' {T}';
      } else {
        giftText += ' {F}';
      }
    } else if (
      question.type === QuestionType.MultipleChoice &&
      question.content.answers
    ) {
      giftText += ' {';
      const answerStrings = question.content.answers.map((answer) => {
        const prefix = answer.isCorrect ? '=' : '~';
        return `${prefix}${answer.answerText}`;
      });
      giftText += answerStrings.join(' ');
      giftText += '}';
    } else if (
      question.type === QuestionType.FreeText &&
      question.content.answers &&
      question.content.answers.length > 0
    ) {
      giftText += ` {=${question.content.answers[0].answerText}}`;
    } else {
      giftText += ' {}'; // Open-ended question
    }

    return giftText;
  }
}
