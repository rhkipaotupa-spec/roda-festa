export const plannerProfiles = [
  {
    id: "economic",
    name: "Econômico",
    description:
      "Uma composição mais enxuta, com excelente custo-benefício.",
    recommended: false,
    active: true,
  },

  {
    id: "balanced",
    name: "Balanceado",
    description:
      "A combinação mais equilibrada entre variedade, estrutura e investimento.",
    recommended: true,
    active: true,
  },

  {
    id: "premium",
    name: "Premium",
    description:
      "Uma experiência mais completa, com maior variedade de produtos e estrutura.",
    recommended: false,
    active: true,
  },
];

export function findPlannerProfile(profileId) {
  return (
    plannerProfiles.find(
      (profile) =>
        profile.active !== false &&
        profile.id === profileId
    ) ?? null
  );
}

export default plannerProfiles;