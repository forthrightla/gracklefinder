import { Location } from "./types";

export function computeGrackleScore(location: Location): number {
  // workerFriendly: 35% (normalize 1-5 to 0-100, clamped)
  const worker = Math.min(5, Math.max(1, location.workerFriendly));
  const workerScore = ((worker - 1) / 4) * 100;

  // wifi: 25%
  let wifiScore = 0;
  if (location.hasWifi === true) {
    switch (location.wifiConfidence) {
      case "high":
        wifiScore = 100;
        break;
      case "medium":
        wifiScore = 70;
        break;
      case "low":
        wifiScore = 40;
        break;
      default:
        wifiScore = 15;
        break;
    }
  }

  // vibeScore: 20% (normalize 1-5 to 0-100, clamped)
  const vibe = Math.min(5, Math.max(1, location.vibeScore));
  const vibeScoreNorm = ((vibe - 1) / 4) * 100;

  // hasPatio: 10%
  const patioScore = location.hasPatio ? 100 : 0;

  // both coffee and beer: 10%
  const bothScore = location.tags.includes("both") ? 100 : 0;

  const total =
    workerScore * 0.35 +
    wifiScore * 0.25 +
    vibeScoreNorm * 0.2 +
    patioScore * 0.1 +
    bothScore * 0.1;

  return Math.min(100, Math.max(0, Math.round(total)));
}
