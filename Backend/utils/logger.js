import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

// Production: plain JSON to stdout — this is what makes logs actually
// searchable/filterable once shipped to any log aggregator (Render's own
// log viewer, Datadog, Loki, etc). Dev: pretty-printed and colorized so
// it's actually readable in a terminal — pino-pretty is dev-only, never
// loaded in production.
export const logger = pino({
    level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
    ...(isProd
        ? {}
        : {
            transport: {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:HH:MM:ss",
                    ignore: "pid,hostname",
                },
            },
        }),
});
