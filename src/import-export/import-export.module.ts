import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { Question } from '../question/entities/question.entity';
import { Questionnaire } from '../questionnaire/entities/questionnaire.entity';
import { QuestionModule } from '../question/question.module';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Questionnaire]),
    QuestionModule,
    QuestionnaireModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
      fileFilter: (req, file, callback) => {
        // Accept json, csv, xml, txt, and gift files
        const allowedMimeTypes = [
          'application/json',
          'text/csv',
          'application/xml',
          'text/xml',
          'text/plain',
          'application/octet-stream', // For GIFT files
        ];

        const allowedExtensions = ['.json', '.csv', '.xml', '.txt', '.gift'];

        const fileExtension = file.originalname
          .toLowerCase()
          .substring(file.originalname.lastIndexOf('.'));

        if (
          allowedMimeTypes.includes(file.mimetype) ||
          allowedExtensions.includes(fileExtension)
        ) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `Unsupported file type. Allowed types: ${allowedExtensions.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  ],
  controllers: [ImportExportController],
  providers: [ImportExportService],
  exports: [ImportExportService],
})
export class ImportExportModule {}
