import type { ProjectSlug } from "../content/portfolio";

/**
 * Garden-to-recruiter route adapter.
 *
 * Keep recruiter copy and evidence in the shared typed content source. This
 * adapter exists only so the garden can link there without importing recruiter
 * components (and their bundle) back into the game.
 */
const CASE_STUDY_PATH_BY_GARDEN_PROJECT = {
  wattch: "/work/wattch",
  whispbook: "/work/whispbook"
} as const satisfies Readonly<Partial<Record<ProjectSlug, `/work/${ProjectSlug}`>>>;

export function getGardenCaseStudyPath(projectId: string): string | undefined {
  return CASE_STUDY_PATH_BY_GARDEN_PROJECT[
    projectId as keyof typeof CASE_STUDY_PATH_BY_GARDEN_PROJECT
  ];
}
