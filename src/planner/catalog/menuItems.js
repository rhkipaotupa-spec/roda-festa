export const menuItems = [
  // MINI LANCHES
  {
    id: "mini-x-burger",
    name: "Mini X-Burguer",
    categoryId: "mini-snacks",
    serviceId: "mini-snack-cart",
    measurementUnit: "unit",

    assets: {
      scene: "burger",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },

  {
    id: "mini-hot-dog",
    name: "Mini Hot Dog",
    categoryId: "mini-snacks",
    serviceId: "mini-snack-cart",
    measurementUnit: "unit",

    assets: {
      scene: "hot-dog",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },

  // FRITURAS
  {
    id: "meat-pastel",
    name: "Pastel de Carne",
    categoryId: "fried-snacks",
    serviceId: "fried-snack-cart",
    measurementUnit: "unit",

    assets: {
      scene: "pastel",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },

  {
    id: "cheese-pastel",
    name: "Pastel de Queijo",
    categoryId: "fried-snacks",
    serviceId: "fried-snack-cart",
    measurementUnit: "unit",

    assets: {
      scene: "pastel",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },

  {
    id: "chicken-catupiry-coxinha",
    name: "Coxinha de Frango com Catupiry",
    categoryId: "fried-snacks",
    serviceId: "fried-snack-cart",
    measurementUnit: "unit",

    assets: {
      scene: "pastel",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },

  {
    id: "ham-cheese-risoles",
    name: "Risoles de Presunto e Queijo",
    categoryId: "fried-snacks",
    serviceId: "fried-snack-cart",
    measurementUnit: "unit",

    assets: {
      scene: "pastel",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },

  // BEBIDAS
  {
    id: "orange-juice-200ml",
    name: "Suco de Laranja 200 ml",
    categoryId: "drinks",
    serviceId: "drinks-station",
    measurementUnit: "unit",

    assets: {
      scene: "drink",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },

  // DOCES
  {
    id: "chocolate-brigadeiro",
    name: "Brigadeiro de Chocolate",
    categoryId: "desserts",
    serviceId: "desserts-and-cakes",
    measurementUnit: "unit",

    assets: {
      scene: "brigadeiro",
    },

    planning: {
      quantityRuleId: "party-sweets",
    },

    active: true,
  },

  {
    id: "ninho-brigadeiro",
    name: "Brigadeiro de Leite Ninho",
    categoryId: "desserts",
    serviceId: "desserts-and-cakes",
    measurementUnit: "unit",

    assets: {
      scene: "brigadeiro",
    },

    planning: {
      quantityRuleId: "party-sweets",
    },

    active: true,
  },

  // BOLOS
  {
    id: "custom-cake",
    name: "Bolo Personalizado",
    categoryId: "cakes",
    serviceId: "desserts-and-cakes",
    measurementUnit: "kg",

    assets: {
      scene: "cake",
    },

    planning: {
      quantityRuleId: "cake-by-weight",
    },

    active: true,
  },

  // TORTAS
  {
    id: "savory-pie",
    name: "Torta Salgada",
    categoryId: "pies",
    serviceId: "pies-service",
    measurementUnit: "unit",

    assets: {
      scene: "mini-pie",
    },

    planning: {
      quantityRuleId: "manual-unit",
    },

    active: true,
  },
];