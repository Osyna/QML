# QML - Question Markup Language API

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![NestJS](https://img.shields.io/badge/NestJS-10.3.0-red.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)

**A comprehensive questionnaire and assessment platform with AI-powered validation**

[Features](#features) • [Quick Start](#quick-start) • [API Documentation](#api-documentation) • [Deployment](#deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

QML (Question Markup Language) is a powerful, enterprise-grade API for creating, managing, and delivering questionnaires, quizzes, and educational assessments. Built with NestJS and TypeScript, it provides a flexible and robust platform for educational institutions, training providers, and market researchers.

### Why QML?

- **17+ Question Types**: From simple MCQs to complex drag-and-drop interactions
- **AI-Powered Validation**: Intelligent answer checking using OpenAI or Anthropic
- **Adaptive Paths**: Branching questionnaire logic based on user responses
- **Real-Time Features**: WebSocket support for live quiz sessions and leaderboards
- **Enterprise Ready**: Complete with authentication, analytics, versioning, and more

---

## ✨ Features

### Core Functionality

#### 📝 Question Management
- **17+ Question Types** including:
  - Free-Text, Multiple Choice, True/False
  - Rating Scale, Likert Scale, Yes/No
  - Ranking, Matching, Fill-in-the-Blank
  - Picture Choice, Slider, Dropdown
  - Semantic Differential, Matrix, Demographic
  - Hotspot, Drag-and-Drop
- **Question Pools**: Organize questions into reusable pools
- **Version Control**: Automatic question versioning with diff tracking
- **Search & Filter**: Advanced filtering by difficulty, category, tags, etc.
- **Statistics**: Track performance, success rates, and time spent

#### 📊 Questionnaire Features
- **Multiple Types**: Standard, Survey, Random Questions, Adaptive Paths
- **Path Logic**: Branching questionnaires based on user answers
- **Time Limits**: Per question and per questionnaire
- **Passing Criteria**: Set pass percentages or point thresholds
- **Availability Control**: Schedule questionnaires with start/end dates
- **Randomization**: Random question selection and ordering

#### 🤖 AI Integration
- **Answer Validation**: 4 validation strategies
  - **Exact Match**: Case-insensitive string comparison
  - **Keyword Matching**: Partial credit for keyword presence
  - **AI Semantic**: Meaning-based validation with confidence scores
  - **Manual Review**: Educator review workflow
- **Custom Prompts**: Use custom AI prompts for specialized validation
- **Question Generation**: AI-powered question creation
- **Feedback Generation**: Personalized, AI-generated feedback
- **Sentiment Analysis**: Analyze user responses
- **Multi-Provider**: Support for OpenAI and Anthropic

#### 👥 User Management & Authentication
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Admin, Educator, Student, Guest
- **User Profiles**: Customizable profiles with preferences
- **Activity Tracking**: Last login, attempt history

#### 📈 Analytics & Reporting
- **Question Statistics**: Success rates, averages, discrimination index
- **Difficulty Analysis**: Evidence-based difficulty classification
- **Performance Trends**: Temporal analysis with regression
- **User Analytics**: Individual and aggregate performance metrics
- **Completion Tracking**: Drop-off points and abandonment analysis
- **Leaderboards**: Real-time rankings in live sessions

#### 🔄 Import/Export
- **Multiple Formats**:
  - **JSON**: Full-featured export with metadata
  - **CSV**: Spreadsheet-compatible format
  - **QTI (IMS 2.1)**: LMS integration standard
  - **GIFT**: Moodle-compatible format
- **Bulk Operations**: Import/export multiple questions at once
- **Validation**: Comprehensive import data validation

#### ⚡ Real-Time Features
- **WebSocket Gateway**: Live quiz sessions
- **Real-Time Leaderboards**: Updated as answers are submitted
- **Live Synchronization**: Question progression across participants
- **Session Management**: Room-based quiz sessions
- **Participant Tracking**: Join/leave notifications

#### 🔐 Security & Validation
- **Input Validation**: class-validator decorators on all DTOs
- **Error Handling**: Global exception filter with detailed errors
- **Rate Limiting**: Configurable request throttling
- **CORS Support**: Configurable cross-origin access
- **SQL Injection Prevention**: TypeORM parameterized queries

---

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS 10.3
- **Language**: TypeScript 5.3
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: TypeORM 0.3
- **Caching**: Redis with cache-manager
- **Authentication**: Passport JWT
- **Validation**: class-validator & class-transformer
- **API Documentation**: Swagger/OpenAPI
- **WebSockets**: Socket.IO
- **AI Integration**: OpenAI SDK, Anthropic SDK

### Design Patterns

- **Modular Architecture**: Feature-based modules
- **Repository Pattern**: TypeORM repositories
- **DTO Pattern**: Data transfer objects with validation
- **Guard Pattern**: Authentication and authorization guards
- **Strategy Pattern**: Multiple validation strategies
- **Factory Pattern**: Configuration and services

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Redis (optional, for caching)
- PostgreSQL (optional, for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/QML.git
cd QML

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Minimum required: JWT_SECRET, AI API keys
```

### Configuration

Edit `.env` file:

```env
# Application
NODE_ENV=development
PORT=3000

# Database (SQLite for development)
DB_TYPE=sqlite
DB_DATABASE=./database/qml_database.db

# JWT Authentication (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=24h

# AI Integration (at least one required)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Redis Cache
# REDIS_HOST=localhost
# REDIS_PORT=6379

# Optional: CORS
CORS_ORIGIN=http://localhost:3001
```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs

### Using Docker

```bash
# Development with Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production with Docker Compose
docker-compose up -d

# Build and run standalone
docker build -t qml-api .
docker run -p 3000:3000 --env-file .env qml-api
```

---

## 📚 API Documentation

### Interactive Documentation

Once the server is running, visit **http://localhost:3000/api/docs** for complete interactive API documentation powered by Swagger.

### Quick API Overview

All API endpoints are prefixed with `/api`.

#### Authentication

```bash
# Register new user
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "passwordConfirmation": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response includes access_token
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}

# Get profile (requires Bearer token)
GET /api/auth/profile
Authorization: Bearer <access_token>
```

#### Questions

```bash
# Create question (Educator/Admin only)
POST /api/questions
Authorization: Bearer <token>
{
  "type": "multiple-choice",
  "difficulty": "medium",
  "category": "Mathematics",
  "points": 1,
  "content": {
    "text": "What is 2 + 2?",
    "answers": [
      { "answerText": "3", "isCorrect": false },
      { "answerText": "4", "isCorrect": true, "points": 1 },
      { "answerText": "5", "isCorrect": false }
    ],
    "feedback": {
      "correct": "Excellent!",
      "incorrect": "Try again!"
    }
  }
}

# List questions with filters
GET /api/questions?page=1&limit=10&difficulty=medium&category=Mathematics

# Get question by ID
GET /api/questions/1

# Update question (Owner/Admin)
PATCH /api/questions/1

# Delete question (Owner/Admin)
DELETE /api/questions/1
```

#### Questionnaires

```bash
# Create questionnaire
POST /api/questionnaires
{
  "name": "Math Quiz",
  "description": "Basic mathematics assessment",
  "type": "questions-answers",
  "difficulty": "medium",
  "timeLimit": 1800,
  "passPercentage": 70
}

# Add questions to questionnaire
POST /api/questionnaires/1/questions
{
  "questionIds": [1, 2, 3, 4, 5]
}

# List available questionnaires
GET /api/questionnaires?isActive=true
```

#### Answer Submission

```bash
# Start questionnaire attempt
POST /api/answers/attempts/start
{
  "questionnaireId": 1
}

# Submit answer
POST /api/answers/attempts/1/answers
{
  "questionId": 5,
  "userAnswer": "4",
  "timeSpent": 30
}

# Complete attempt
POST /api/answers/attempts/1/complete
{
  "timeSpent": 1800
}

# Get my attempts
GET /api/answers/attempts/my-attempts
```

#### Analytics

```bash
# Question statistics (Educator/Admin)
GET /api/analytics/questions/1

# Questionnaire statistics
GET /api/analytics/questionnaires/1

# User performance
GET /api/analytics/users/me

# Difficulty analysis
GET /api/analytics/questions/1/difficulty
```

#### Import/Export

```bash
# Export questions to JSON
POST /api/import-export/questions/export
{
  "questionIds": [1, 2, 3],
  "format": "json"
}

# Import questions from file
POST /api/import-export/questions/import?format=json
Content-Type: multipart/form-data
file: <questions.json>
```

#### WebSocket Real-Time Quiz

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/quiz', {
  auth: { token: 'your-jwt-token' }
});

// Join quiz
socket.emit('join-quiz', {
  questionnaireId: 1,
  attemptId: 123
});

// Listen for leaderboard
socket.on('leaderboard-update', (data) => {
  console.log('Leaderboard:', data);
});

// Submit answer
socket.emit('submit-answer', {
  attemptId: 123,
  questionId: 5,
  userAnswer: 'Paris'
});
```

### API Response Format

All API responses follow a consistent structure:

**Success Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/questions",
  "method": "POST",
  "message": "Validation failed",
  "errors": [
    {
      "field": "type",
      "constraints": { ... }
    }
  ]
}
```

---

## 🚢 Deployment

### Docker Deployment (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with production values

# 2. Start services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f api
```

### Manual Deployment

```bash
# 1. Build the application
npm run build

# 2. Set production environment
export NODE_ENV=production

# 3. Run migrations (if using PostgreSQL)
npm run migration:run

# 4. Start the server
npm run start:prod
```

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure Redis for caching
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Set appropriate rate limits
- [ ] Review and secure API keys

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | `development` | No |
| `PORT` | Server port | `3000` | No |
| `DB_TYPE` | Database type (`sqlite` or `postgres`) | `sqlite` | No |
| `DB_HOST` | PostgreSQL host | `localhost` | If postgres |
| `DB_PORT` | PostgreSQL port | `5432` | If postgres |
| `DB_USERNAME` | Database user | - | If postgres |
| `DB_PASSWORD` | Database password | - | If postgres |
| `DB_DATABASE` | Database name | `./database/qml_database.db` | Yes |
| `JWT_SECRET` | JWT signing secret | - | **Yes** |
| `JWT_EXPIRATION` | Token expiration | `24h` | No |
| `OPENAI_API_KEY` | OpenAI API key | - | If using AI |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | If using AI |
| `AI_PROVIDER` | AI provider (`openai` or `anthropic`) | `openai` | No |
| `REDIS_HOST` | Redis host | `localhost` | No |
| `REDIS_PORT` | Redis port | `6379` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |

---

## 📁 Project Structure

```
QML/
├── src/
│   ├── answer/              # Answer submission & validation
│   ├── analytics/           # Analytics & reporting
│   ├── ai/                  # AI integration service
│   ├── auth/                # Authentication & JWT
│   ├── common/              # Shared utilities
│   │   ├── decorators/      # Custom decorators
│   │   ├── dto/             # Common DTOs
│   │   ├── enums/           # Enumerations
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # Auth guards
│   │   └── pipes/           # Validation pipes
│   ├── config/              # Configuration
│   ├── import-export/       # Import/export functionality
│   ├── question/            # Question management
│   ├── question-pool/       # Question pool management
│   ├── questionnaire/       # Questionnaire management
│   ├── users/               # User management
│   ├── versioning/          # Version control
│   ├── websocket/           # WebSocket gateway
│   ├── app.module.ts        # Main application module
│   └── main.ts              # Application entry point
├── database/                # SQLite database (dev)
├── test/                    # Test files
├── .env.example             # Environment template
├── docker-compose.yml       # Docker Compose config
├── Dockerfile               # Docker build file
├── nest-cli.json            # NestJS CLI config
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── README.md                # This file
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📖 Additional Documentation

- [API Capabilities](./API.md) - Detailed API capabilities and use cases
- [Ideas & Concepts](./Ideas.md) - Original concepts and path logic design
- [Improvements & Features](./IMPROVEMENTS_AND_FEATURES.md) - Implemented improvements
- [AI Service Guide](./src/ai/README.md) - AI integration documentation
- [Answer Module Guide](./src/answer/README.md) - Answer submission documentation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commits
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- AI powered by [OpenAI](https://openai.com/) and [Anthropic](https://anthropic.com/)
- Database management with [TypeORM](https://typeorm.io/)

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [API Documentation](http://localhost:3000/api/docs)
- Review the [FAQ](./docs/FAQ.md)

---

<div align="center">

**Made with ❤️ by the QML Team**

[⬆ Back to Top](#qml---question-markup-language-api)

</div>
