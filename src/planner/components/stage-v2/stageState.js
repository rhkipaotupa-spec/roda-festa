import burgerOperation from "./operations/burger";

export const initialStageState = {
  carts: 1,

  operations: [burgerOperation],

  dessertTable: {
    visible: true,
    cake: true,
    brigadeiro: true,
    decoration: true,
  },
};