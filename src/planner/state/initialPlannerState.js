export const initialPlannerState = {
  mode: "guided",

  event: {
    type: null,
    city: "Tupã",
    date: "",
    startTime: "",
    durationHours: 4,
  },

  guests: {
    adults: 0,
    children: 0,
  },

  preferences: {
    profile: "balanced",
    selectedCategoryIds: [],
  },

  selection: {
    selectedItemIds: [],
    itemQuantities: {},
  },

  additionalServices: {
    disposableItems: true,
    waiterService: false,
    requestedWaiters: null,
  },
};

export default initialPlannerState;