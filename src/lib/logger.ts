import {createLogger, format, transports} from 'winston';

const {combine, timestamp, printf, colorize} = format;

const customFormat = printf(({level, message, timestamp}) => {
    return `${timestamp} [${level}]: ${message}`;
});

export const logger = createLogger({
    format: combine(
        colorize(),
        timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
    ],
});

