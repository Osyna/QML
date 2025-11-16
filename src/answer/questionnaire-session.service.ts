import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionnaireSession, SessionQuestion } from './entities/questionnaire-session.entity';
import { Answer } from './entities/answer.entity';
import { Questionnaire } from '../question/entities/questionnaire.entity';
import { Question } from '../question/entities/question.entity';
import { QuestionSelectionService } from '../question/question-selection.service';
import { AnswerValidationService } from './answer-validation.service';
import { StartSessionDto } from './dto/start-session.dto';
import { BatchSubmitAnswersDto, AnswerSubmission } from './dto/batch-submit-answers.dto';
import { SessionResultDto, QuestionResult } from './dto/session-result.dto';

@Injectable()
export class QuestionnaireSessionService {
  constructor(
    @InjectRepository(QuestionnaireSession)
    private sessionRepository: Repository<QuestionnaireSession>,
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    private questionSelectionService: QuestionSelectionService,
    private answerValidationService: AnswerValidationService,
  ) {}

  /**
   * Start a new questionnaire session
   */
  async startSession(startSessionDto: StartSessionDto): Promise<QuestionnaireSession> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: startSessionDto.questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${startSessionDto.questionnaireId} not found`,
      );
    }

    // Get questions for this questionnaire
    const questions = await this.questionSelectionService.getQuestionsForQuestionnaire(
      questionnaire,
    );

    if (questions.length === 0) {
      throw new BadRequestException('Questionnaire has no questions');
    }

    // Calculate max score
    const maxScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    // Create session questions
    const sessionQuestions: SessionQuestion[] = questions.map((q) => ({
      questionId: q.id,
      answered: false,
    }));

    // Create session
    const session = this.sessionRepository.create({
      questionnaireId: questionnaire.id,
      userId: startSessionDto.userId,
      questions: sessionQuestions,
      currentQuestionIndex: 0,
      totalScore: 0,
      maxScore,
      completed: false,
    });

    return this.sessionRepository.save(session);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: number): Promise<QuestionnaireSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }
    return session;
  }

  /**
   * Submit answers for a session (batch submission)
   */
  async submitAnswers(batchSubmitDto: BatchSubmitAnswersDto): Promise<SessionResultDto> {
    const session = await this.getSession(batchSubmitDto.sessionId);

    if (session.completed) {
      throw new BadRequestException('This session is already completed');
    }

    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: session.questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException(`Questionnaire not found`);
    }

    const results: QuestionResult[] = [];
    let totalScore = 0;
    let totalTimeSpent = 0;

    // Process each answer
    for (const answerSubmission of batchSubmitDto.answers) {
      const question = await this.questionRepository.findOne({
        where: { id: answerSubmission.questionId },
      });

      if (!question) {
        continue;
      }

      // Validate answer
      const validationResult = await this.answerValidationService.validateAnswer(
        question,
        answerSubmission.userAnswer,
        answerSubmission.usedHints,
      );

      // Save answer to database
      const answer = this.answerRepository.create({
        questionId: question.id,
        questionnaireId: questionnaire.id,
        userId: session.userId,
        userAnswer: answerSubmission.userAnswer,
        validationResult,
        usedHints: answerSubmission.usedHints,
        timeSpent: answerSubmission.timeSpent,
      });

      const savedAnswer = await this.answerRepository.save(answer);

      // Update session question
      const sessionQuestion = session.questions.find(
        (sq) => sq.questionId === question.id,
      );
      if (sessionQuestion) {
        sessionQuestion.answered = true;
        sessionQuestion.answerId = savedAnswer.id;
        sessionQuestion.score = validationResult.score;
        sessionQuestion.timeSpent = answerSubmission.timeSpent;
      }

      totalScore += validationResult.score;
      if (answerSubmission.timeSpent) {
        totalTimeSpent += answerSubmission.timeSpent;
      }

      // Add to results
      results.push({
        questionId: question.id,
        questionText: question.content.text,
        userAnswer: answerSubmission.userAnswer,
        validationResult,
        correctAnswer: question.content.answers?.[0]?.answerText,
      });
    }

    // Update session
    session.totalScore = totalScore;
    session.totalTimeSpent = totalTimeSpent;
    session.completed = true;
    session.completedAt = new Date();

    // Check if passed
    if (questionnaire.passPercentage) {
      const percentage = (totalScore / session.maxScore) * 100;
      session.passed = percentage >= questionnaire.passPercentage;
    } else if (questionnaire.passPoints) {
      session.passed = totalScore >= questionnaire.passPoints;
    }

    await this.sessionRepository.save(session);

    // Return results
    return {
      sessionId: session.id,
      questionnaireId: questionnaire.id,
      questionnaireName: questionnaire.name,
      userId: session.userId,
      totalScore: session.totalScore,
      maxScore: session.maxScore,
      percentage: (session.totalScore / session.maxScore) * 100,
      passed: session.passed || false,
      questionsAnswered: results.length,
      totalQuestions: session.questions.length,
      totalTimeSpent: session.totalTimeSpent,
      results,
      passText: session.passed ? questionnaire.passText : undefined,
      failText: !session.passed ? questionnaire.failText : undefined,
      startedAt: session.startedAt,
      completedAt: session.completedAt!,
    };
  }

  /**
   * Get results for a completed session
   */
  async getSessionResults(sessionId: number): Promise<SessionResultDto> {
    const session = await this.getSession(sessionId);

    if (!session.completed) {
      throw new BadRequestException('Session is not completed yet');
    }

    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: session.questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException(`Questionnaire not found`);
    }

    // Get all answers for this session
    const results: QuestionResult[] = [];
    for (const sessionQuestion of session.questions) {
      if (sessionQuestion.answerId) {
        const answer = await this.answerRepository.findOne({
          where: { id: sessionQuestion.answerId },
        });
        const question = await this.questionRepository.findOne({
          where: { id: sessionQuestion.questionId },
        });

        if (answer && question) {
          results.push({
            questionId: question.id,
            questionText: question.content.text,
            userAnswer: answer.userAnswer,
            validationResult: answer.validationResult!,
            correctAnswer: question.content.answers?.[0]?.answerText,
          });
        }
      }
    }

    return {
      sessionId: session.id,
      questionnaireId: questionnaire.id,
      questionnaireName: questionnaire.name,
      userId: session.userId,
      totalScore: session.totalScore,
      maxScore: session.maxScore,
      percentage: (session.totalScore / session.maxScore) * 100,
      passed: session.passed || false,
      questionsAnswered: results.length,
      totalQuestions: session.questions.length,
      totalTimeSpent: session.totalTimeSpent,
      results,
      passText: session.passed ? questionnaire.passText : undefined,
      failText: !session.passed ? questionnaire.failText : undefined,
      startedAt: session.startedAt,
      completedAt: session.completedAt!,
    };
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<QuestionnaireSession[]> {
    return this.sessionRepository.find({ where: { userId } });
  }

  /**
   * Get all sessions for a questionnaire
   */
  async getQuestionnaireSessions(questionnaireId: number): Promise<QuestionnaireSession[]> {
    return this.sessionRepository.find({ where: { questionnaireId } });
  }
}
