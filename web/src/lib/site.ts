/**
 * Site-wide copy and every placeholder the team still needs to fill in.
 * Search the repo for "PLACEHOLDER" or "[" + "TEAM" to find the rest.
 */
export const site = {
  /** PLACEHOLDER: product name (team to decide). */
  name: "[PRODUCT NAME]",
  description:
    "Camera-free, wearable-free fall alerts for senior living. Existing WiFi detects possible falls and alerts staff faster. Prototype. Not a medical device.",
  pitch:
    "No pendant, no camera, no new device per room. The WiFi that's already there notices when someone falls and doesn't get up, and alerts staff right away.",
  /** Demo tenant. Never use a real facility's name. */
  tenantName: "Demo Community (sample)",
  /** PLACEHOLDER: pilot price. */
  pilotPrice: "[PILOT PRICE / per room per month: TEAM TO DECIDE]",
  school: "Cal Poly SLO",
  event: "CPVC AI Hackathon",
  /** PLACEHOLDER: team roster. */
  team: [
    { name: "[TEAM MEMBER 1 NAME]", role: "[ROLE]" },
    { name: "[TEAM MEMBER 2 NAME]", role: "[ROLE]" },
    { name: "[TEAM MEMBER 3 NAME]", role: "[ROLE]" },
  ],
  /** PLACEHOLDER: contact email for pilots. */
  contactEmail: "[CONTACT EMAIL]",
  medicalDisclaimer: "Prototype. Not a medical device.",
} as const;

/**
 * Statistics shown on the site. Each MUST link to its primary source.
 * VERIFY: the URLs below are best-guess candidates. Confirm each one says
 * exactly what we quote before demo day, or replace it.
 */
export const stats = [
  {
    id: "falls",
    value: 37,
    suffix: "M",
    label: "falls among older adults each year in the U.S.",
    source: "CDC",
    href: "https://www.cdc.gov/falls/data-research/facts-stats/index.html", // [SOURCE LINK] verify
  },
  {
    id: "injuries",
    value: 9,
    suffix: "M",
    label: "fall injuries among older adults each year",
    source: "CDC",
    href: "https://www.cdc.gov/falls/data-research/facts-stats/index.html", // [SOURCE LINK] verify
  },
  {
    id: "ed",
    value: 3,
    suffix: "M",
    label: "emergency department visits for falls each year",
    source: "CDC",
    href: "https://www.cdc.gov/falls/data-research/facts-stats/index.html", // [SOURCE LINK] verify
  },
  {
    id: "long-lie",
    value: 30,
    suffix: "%",
    label:
      "of people over 90 in one study who fell had lain on the floor for an hour or more. Call alarms were usually not used.",
    source: "Fleming & Brayne, BMJ 2008",
    href: "https://www.bmj.com/content/337/bmj.a2227", // [SOURCE LINK] verify
  },
] as const;
