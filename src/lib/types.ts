export interface ReviewSnippet {
  text: string;
  source: "google" | "reddit";
}

export interface AiAssessment {
  wifiReasoning: string;
  workerReasoning: string;
  vibeDescription: string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
  hasWifi: boolean | null;
  wifiConfidence: "high" | "medium" | "low" | "unknown";
  hasPatio: boolean;
  workerFriendly: number;
  vibeScore: number;
  grackleScore: number;
  tags: string[];
  hours: string;
  sourceLinks: string[];
  reviewSnippets: ReviewSnippet[];
  aiAssessment: AiAssessment | null;
  lastUpdated: string;
}
