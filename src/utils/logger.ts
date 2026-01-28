import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';
const isDev = process.env.NODE_ENV !== 'production';

// Only use pino-pretty in development (it doesn't work in serverless)
export const logger = isDev
  ? pino({
      level: logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
    })
  : pino({
      level: logLevel,
    });

export default logger;
