import burgerOperation from "./operations/burger";

export const initialStageState = {
  carts: 1,

  selectedEvent: "birthday",

  operations: [burgerOperation],

  decor: [],

  sweetsTable: {
    visible: true,
    cake: true,
    brigadeiro: true,
    decoration: true,
  },
};