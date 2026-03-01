/* ============================================================
   Threat Classifier — keyword-based
   ============================================================ */

import type { ThreatLevel } from "@/types";

const CRITICAL_KEYWORDS = [
  "nuclear",
  "missile launch",
  "invasion",
  "war declared",
  "martial law",
  "chemical weapon",
  "bioweapon",
  "coup",
  "assassination",
  "mass casualty",
  "nuclear weapon",
  "icbm",
  "thermonuclear",
  "wmd",
];

const HIGH_KEYWORDS = [
  "airstrike",
  "bombing",
  "terror attack",
  "hostage",
  "siege",
  "massacre",
  "military strike",
  "drone strike",
  "chemical attack",
  "explosion",
  "armed conflict",
  "shelling",
  "ground offensive",
  "troops deployed",
  "violent clash",
  "death toll",
  "killed",
  "casualties",
];

const MEDIUM_KEYWORDS = [
  "sanctions",
  "embargo",
  "protest",
  "unrest",
  "riot",
  "crackdown",
  "security threat",
  "cyber attack",
  "hack",
  "ransom",
  "espionage",
  "military exercises",
  "naval deployment",
  "border tension",
  "escalation",
  "refugee",
  "displacement",
  "famine",
  "pandemic",
  "outbreak",
  "ceasefire broken",
  "violated",
  "crashed",
  "earthquake",
  "tsunami",
];

const LOW_KEYWORDS = [
  "talks",
  "summit",
  "agreement",
  "ceasefire",
  "peace",
  "diplomat",
  "trade deal",
  "election",
  "vote",
  "policy",
  "reform",
  "bilateral",
  "cooperation",
  "alliance",
  "partnership",
  "treaty",
];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Classify a headline's threat level.
 */
export function classify(
  headline: string,
  _categories: string[] = [],
): ThreatLevel {
  if (matchesKeywords(headline, CRITICAL_KEYWORDS)) return "critical";
  if (matchesKeywords(headline, HIGH_KEYWORDS)) return "high";
  if (matchesKeywords(headline, MEDIUM_KEYWORDS)) return "medium";
  if (matchesKeywords(headline, LOW_KEYWORDS)) return "low";
  return "info";
}
