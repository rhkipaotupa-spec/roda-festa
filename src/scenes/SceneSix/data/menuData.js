import heroCardapioImage from "../assets/hero-cardapio.jpg";
import petiscosImage from "../assets/petiscos.jpg";
import miniLanchesImage from "../assets/mini-lanches.jpg";
import tortasImage from "../assets/tortas.jpg";
import bolosImage from "../assets/bolos.jpg";
import docesImage from "../assets/doces.jpg";
import docesTachoImage from "../assets/doces-tacho.jpg";

export const heroCardapio = {
  image: heroCardapioImage,
  imageAlt:
    "Mesa gastronômica preparada pela Roda Festa para uma celebração",
};

const menuData = [
  {
    id: "petiscos",
    chapter: "Capítulo 01",
    category: "Petiscos",
    title: "Aquele cheirinho que reúne todo mundo.",
    description:
      "Clássicos servidos quentinhos para fazer a celebração começar antes mesmo da primeira conversa.",
    image: petiscosImage,
    imageAlt:
      "Petiscos variados preparados para uma celebração da Roda Festa",

    suggestion: {
      quantity: "≈ 10",
      unit: "unidades",
      complement: "por pessoa",
    },

    items: [
      {
        title: "Coxinha",
        subtitle: "Frango com catupiry",
      },
      {
        title: "Bolinha",
        subtitle: "Queijo",
      },
      {
        title: "Risoles",
        subtitle: "Presunto e queijo",
      },
      {
        title: "Kibe",
        subtitle: "Carne",
      },
      {
        title: "Croquete",
        subtitle: "Carne",
      },
      {
        title: "Linguiça",
        subtitle: "Acebolada",
      },
      {
        title: "Pastelzinho",
        subtitle: "Carne",
      },
      {
        title: "Pastelzinho",
        subtitle: "Queijo",
      },
      {
        title: "Pastelzinho",
        subtitle: "Pizza",
      },
      {
        title: "Pastelzinho",
        subtitle: "Calabresa",
      },
      {
        title: "Enroladinho",
        subtitle: "Salsicha",
      },
      {
        title: "Bruxola",
        subtitle: "Carne",
      },
      {
        title: "Bruxola",
        subtitle: "Queijo",
      },
      {
        title: "Kibe recheado",
        subtitle: "Queijo",
      },
    ],

    extraText: "+ consulte outras opções disponíveis",
    layout: "image-left",
  },

  {
    id: "mini-lanches",
    chapter: "Capítulo 02",
    category: "Mini Lanches",
    title: "Pequenos no tamanho. Inesquecíveis no sabor.",
    description:
      "Preparados para servir com praticidade, personalidade e aquele verdadeiro gosto de festa.",
    image: miniLanchesImage,
    imageAlt:
      "Mini lanches preparados pela Roda Festa durante um evento",

    suggestion: {
      quantity: "≈ 2",
      unit: "mini lanches",
      complement: "por pessoa",
    },

    items: [
      {
        title: "Mini X-Burguer",
        subtitle: "Hambúrguer, queijo e molho especial",
      },
      {
        title: "Mini Hot Dog",
        subtitle: "Salsicha ao molho e acompanhamentos",
      },
      {
        title: "Mini Carne Louca",
        subtitle: "Carne desfiada e bem temperada",
      },
    ],

    extraText: "+ outras possibilidades disponíveis",
    layout: "image-right",
  },

  {
    id: "tortas",
    chapter: "Capítulo 03",
    category: "Tortas",
    title: "Recheios generosos feitos para compartilhar.",
    description:
      "Receitas artesanais com massas macias e recheios generosos, preparadas para servir bem e deixar cada pedaço ainda mais especial.",
    image: tortasImage,
    imageAlt:
      "Torta artesanal preparada para uma celebração",

    suggestion: {
      quantity: "≈ 1",
      unit: "fatia",
      complement: "por pessoa",
    },

    items: [
      {
        title: "Torta de frango",
        subtitle: "Frango temperado com recheio cremoso",
      },
      {
        title: "Torta de palmito",
        subtitle: "Palmito refogado ao molho cremoso",
      },
      {
        title: "Torta de legumes",
        subtitle: "Legumes selecionados e temperos da casa",
      },
      {
        title: "Torta de carne",
        subtitle: "Carne desfiada e bem temperada",
      },
    ],

    extraText: "+ consulte os sabores disponíveis",
    layout: "image-left",
  },

  {
    id: "bolos",
    chapter: "Capítulo 04",
    category: "Bolos",
    title: "O momento que reúne olhares, sorrisos e aplausos.",
    description:
      "Bolos preparados com massas macias, recheios generosos e combinações pensadas para tornar o momento do parabéns ainda mais especial.",
    image: bolosImage,
    imageAlt:
      "Bolo decorado preparado para um evento da Roda Festa",

    suggestion: {
      quantity: "≈ 100 g",
      unit: "de bolo",
      complement: "por pessoa",
    },

    items: [
      {
        title: "Beatriz",
        subtitle: "Leite condensado com morango",
      },
      {
        title: "Bolo de brigadeiro",
        subtitle: "Massa de chocolate com recheio de brigadeiro",
      },
      {
        title: "Bolo de nozes",
        subtitle: "Doce de leite com nozes",
      },
      {
        title: "Bolo de abacaxi",
        subtitle: "Creme branco com abacaxi",
      },
      {
        title: "Bolo de chocolate",
        subtitle: "Recheio de brigadeiro de chocolate",
      },
    ],

    extraText: "+ recheios e acabamentos personalizados",
    layout: "image-right",
  },

  {
    id: "doces",
    chapter: "Capítulo 05",
    category: "Doces",
    title: "Pequenos detalhes que permanecem na memória.",
    description:
      "Delicados, bonitos e irresistíveis. Doces pensados para completar a mesa e encantar os convidados.",
    image: docesImage,
    imageAlt:
      "Seleção de doces preparados para uma celebração",

    suggestion: {
      quantity: "≈ 5",
      unit: "doces",
      complement: "por pessoa",
    },

    items: [
      {
        title: "Brigadeiro",
        subtitle: "Chocolate",
      },
      {
        title: "Brigadeiro",
        subtitle: "Leite Ninho",
      },
      {
        title: "Beijinho",
        subtitle: "Coco",
      },
      {
        title: "Casadinho",
        subtitle: "Chocolate e leite condensado",
      },
    ],

    extraText: "+ consulte outras combinações disponíveis",
    layout: "image-left",
  },

  {
    id: "doces-no-tacho",
    chapter: "Capítulo 06",
    category: "Doces no Tacho",
    title: "Um final preparado para ser saboreado sem pressa.",
    description:
      "Receitas cremosas preparadas e servidas de um jeito acolhedor, convidando todos para mais uma colherada.",
    image: docesTachoImage,
    imageAlt:
      "Doce cremoso preparado no tacho durante uma celebração",

    suggestion: {
      quantity: "Sob medida",
      unit: "para o evento",
      complement: "e seus convidados",
    },

    items: [
      {
        title: "Brigadeiro cremoso",
        subtitle: "Chocolate",
      },
      {
        title: "Doce de leite",
        subtitle: "Cremoso e servido no tacho",
      },
      {
        title: "Creme de Leite Ninho",
        subtitle: "Cremoso e delicado",
      },
      {
        title: "Sabores especiais",
        subtitle: "Consulte as opções disponíveis",
      },
    ],

    extraText: "+ consulte as combinações disponíveis",
    layout: "image-right",
  },
];

export default menuData;