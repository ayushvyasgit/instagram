import morgan from "morgan";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

const baseLogger = (level: LogLevel, message: string, fields?: LogFields) => {
  const payload = {
    level,
    msg: message,
    time: new Date().toISOString(),
    ...(fields ?? {})
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
};

export const logger = {
  debug: (message: string, fields?: LogFields) => baseLogger("debug", message, fields),
  info: (message: string, fields?: LogFields) => baseLogger("info", message, fields),
  warn: (message: string, fields?: LogFields) => baseLogger("warn", message, fields),
  error: (message: string, fields?: LogFields) => baseLogger("error", message, fields)
};

// HTTP request logger middleware compatible with Express
export const httpLogger = morgan("combined", {
  stream: {
    write: (text: string) => {
      logger.info("http_request", { message: text.trim() });
    }
  }
});

