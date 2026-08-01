import {
  plannerProfiles,
} from "../catalog/plannerProfiles";

const profileVisuals = {
  economic: {
    eyebrow: "Mais enxuto",
    title: "Essencial",
    badge: null,
  },

  balanced: {
    eyebrow: "Mais escolhido",
    title: "Balanceado",
    badge: "Recomendado",
  },

  premium: {
    eyebrow: "Experiência completa",
    title: "Premium",
    badge: null,
  },
};

export default function PlannerProfileSelector({
  selectedProfile,
  onSelectProfile,
}) {
  function selectProfile(profileId) {
    onSelectProfile?.(profileId);
  }

  return (
    <section className="planner-profile-selector">
      <div className="planner-profile-selector__heading">
        <span>Agora, escolha o estilo da experiência...</span>

        <h2>Qual perfil combina com a sua festa?</h2>

        <p>
          Começaremos com uma sugestão pronta, mas você poderá
          acrescentar, trocar ou retirar itens depois.
        </p>
      </div>

      <div className="planner-profile-selector__grid">
        {plannerProfiles
          .filter((profile) => profile.active !== false)
          .map((profile) => {
            const isSelected =
              selectedProfile === profile.id;

            const visual =
              profileVisuals[profile.id] ?? {
                eyebrow: "Perfil da festa",
                title: profile.name,
                badge: null,
              };

            return (
              <button
                key={profile.id}
                type="button"
                className={[
                  "planner-profile-card",
                  profile.recommended
                    ? "planner-profile-card--recommended"
                    : "",
                  isSelected
                    ? "planner-profile-card--selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  selectProfile(profile.id)
                }
              >
                <div className="planner-profile-card__top">
                  <span className="planner-profile-card__eyebrow">
                    {visual.eyebrow}
                  </span>

                  {visual.badge && (
                    <span className="planner-profile-card__badge">
                      {visual.badge}
                    </span>
                  )}
                </div>

                <div className="planner-profile-card__body">
                  <h3>{visual.title}</h3>

                  <p>{profile.description}</p>
                </div>

                <div className="planner-profile-card__footer">
                  <span>
                    {isSelected
                      ? "Selecionado"
                      : "Escolher perfil"}
                  </span>

                  <span aria-hidden="true">
                    {isSelected ? "✓" : "→"}
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </section>
  );
}