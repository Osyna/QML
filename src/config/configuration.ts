import * as Joi from 'joi';

export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  database: string;
  password: string;
  synchronize: boolean;
  logging: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  ttl: number;
}

export interface AIConfig {
  provider: 'openai' | 'anthropic';
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  maxRetries: number;
  timeout: number;
  cacheTtl: number;
  temperature: number;
  maxTokens: number;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  redis: RedisConfig;
  ai: AIConfig;
}

export default (): Configuration => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    database: process.env.DB_DATABASE || './database/qml_database.db',
    password: process.env.DB_PASSWORD || '',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || true,
    logging: process.env.DB_LOGGING === 'true' || false,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'openai') as 'openai' | 'anthropic',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
    maxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 3,
    timeout: parseInt(process.env.AI_TIMEOUT, 10) || 30000,
    cacheTtl: parseInt(process.env.AI_CACHE_TTL, 10) || 3600,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 2000,
  },
});

export const validationSchema = Joi.object({
  // App Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Database Configuration
  DB_TYPE: Joi.string()
    .valid('sqlite', 'postgres', 'mysql', 'mariadb')
    .default('sqlite'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('./database/qml_database.db'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_SYNCHRONIZE: Joi.boolean().default(true),
  DB_LOGGING: Joi.boolean().default(false),

  // JWT Configuration
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_TTL: Joi.number().default(3600),

  // AI Configuration
  AI_PROVIDER: Joi.string().valid('openai', 'anthropic').default('openai'),
  OPENAI_API_KEY: Joi.string().when('AI_PROVIDER', {
    is: 'openai',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  OPENAI_MODEL: Joi.string().default('gpt-4-turbo-preview'),
  ANTHROPIC_API_KEY: Joi.string().when('AI_PROVIDER', {
    is: 'anthropic',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  ANTHROPIC_MODEL: Joi.string().default('claude-3-opus-20240229'),
  AI_MAX_RETRIES: Joi.number().default(3),
  AI_TIMEOUT: Joi.number().default(30000),
  AI_CACHE_TTL: Joi.number().default(3600),
  AI_TEMPERATURE: Joi.number().min(0).max(2).default(0.7),
  AI_MAX_TOKENS: Joi.number().default(2000),
});
