// Environment variable validation
// Import this in API routes to get clear errors on missing config

interface EnvConfig {
  NEXT_PUBLIC_MAPBOX_TOKEN: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

interface PipelineEnvConfig extends EnvConfig {
  GOOGLE_PLACES_API_KEY: string;
  GEMINI_API_KEY: string;
  REFRESH_SECRET: string;
}

const requiredVars: (keyof EnvConfig)[] = [
  "NEXT_PUBLIC_MAPBOX_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const pipelineVars: (keyof PipelineEnvConfig)[] = [
  ...requiredVars,
  "GOOGLE_PLACES_API_KEY",
  "GEMINI_API_KEY",
  "REFRESH_SECRET",
];

export function validateEnv(): EnvConfig {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Check .env.local.example for setup instructions."
    );
  }
  return {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL!,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN!,
  };
}

export function validatePipelineEnv(): PipelineEnvConfig {
  const missing = pipelineVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing pipeline environment variables: ${missing.join(", ")}. ` +
        "Check .env.local.example for setup instructions."
    );
  }
  return {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL!,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN!,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    REFRESH_SECRET: process.env.REFRESH_SECRET!,
  };
}
