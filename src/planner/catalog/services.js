export const services = [
  {
    id: "mini-snack-cart",
    name: "Carrinho de Mini Lanches",
    categoryIds: ["mini-snacks"],
    type: "cart",

    operation: {
      defaultAttendants: 1,
      allowsExtraHours: true,
    },

    scene: {
      component: "Cart",
      visible: true,
    },

    active: true,
  },

  {
    id: "fried-snack-cart",
    name: "Carrinho de Petiscos",
    categoryIds: ["fried-snacks"],
    type: "cart",

    operation: {
      defaultAttendants: 1,
      allowsExtraHours: true,
    },

    scene: {
      component: "Cart",
      visible: true,
    },

    active: true,
  },

  {
    id: "drinks-station",
    name: "Serviço de Bebidas",
    categoryIds: ["drinks"],
    type: "station",

    operation: {
      defaultAttendants: 1,
      allowsExtraHours: true,
    },

    scene: {
      component: "Cart",
      visible: true,
    },

    active: true,
  },

  {
    id: "desserts-and-cakes",
    name: "Fornecimento de Doces e Bolos",
    categoryIds: ["desserts", "cakes"],
    type: "off-cart",

    operation: {
      defaultAttendants: 0,
      allowsExtraHours: false,
      includesFurniture: false,
    },

    scene: {
      component: "DessertTable",
      visible: true,
      visualOnly: true,
    },

    active: true,
  },

  {
    id: "pies-service",
    name: "Fornecimento de Tortas",
    categoryIds: ["pies"],
    type: "off-cart",

    operation: {
      defaultAttendants: 0,
      allowsExtraHours: false,
      includesFurniture: false,
    },

    scene: {
      component: "DessertTable",
      visible: true,
      visualOnly: true,
    },

    active: true,
  },
];