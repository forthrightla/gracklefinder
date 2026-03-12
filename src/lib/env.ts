// Environment variable validation
// Accepts either UPSTASH_REDIS_REST_* or KV_REST_API_* naming conventions

interface EnvConfig {
  NEXT_PUBLIC_MAPBOX_TOKEN: string;
  redisUrl: string;
  redisToken: string;
}

interface PipelineEnvConfig extends EnvConfig {
  GOOGLE_PLACES_API_KEY: string;
  GEMINI_API_KEY: string;
  REFRESH_SECRET: string;
}

function getRedisUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function getRedisToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

export function validateEnv(): EnvConfig {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) missing.push("NEXT_PUBLIC_MAPBOX_TOKEN");
  if (!getRedisUrl()) missing.push("UPSTASH_REDIS_REST_URL or KV_REST_API_URL");
  if (!getRedisToken()) missing.push("UPSTASH_REDIS_REST_TOKEN or KV_REST_API_TOKEN");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Check .env.local.example for setup instructions."
    );
  }
  return {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
    redisUrl: getRedisUrl()!,
    redisToken: getRedisToken()!,
  };
}

export function validatePipelineEnv(): PipelineEnvConfig {
  const base = validateEnv();
  const missing: string[] = [];
  if (!process.env.GOOGLE_PLACES_API_KEY) missing.push("GOOGLE_PLACES_API_KEY");
  if (!process.env.GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
  if (!process.env.REFRESH_SECRET) missing.push("REFRESH_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Missing pipeline environment variables: ${missing.join(", ")}. ` +
        "Check .env.local.example for setup instructions."
    );
  }
  return {
    ...base,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    REFRESH_SECRET: process.env.REFRESH_SECRET!,
  };
}
