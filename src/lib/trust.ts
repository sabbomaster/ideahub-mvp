export type TrustLimits = {
  commentWindowLimit: number;
  dailyIdeaLimit: number;
  recentIdeaLimit: number;
  seriousIdeaMinScore: number;
  externalLinkMinScore: number;
};

export const trustLimits: TrustLimits = {
  commentWindowLimit: 8,
  dailyIdeaLimit: 6,
  recentIdeaLimit: 3,
  seriousIdeaMinScore: 5,
  externalLinkMinScore: 3,
};

export function hasExternalLink(text: string) {
  return /https?:\/\/|www\./i.test(text);
}

export function isLowTrust(score: number) {
  return score < 3;
}
