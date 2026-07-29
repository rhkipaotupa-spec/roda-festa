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
      "Coxinha de frango com catupiry",
      "Risoles de presunto e queijo",
      "Kibe",
      "Croquete",
      "Bolinha de queijo",
      "Mini pastel",
    ],
    extraText: "+ diversas outras opções",
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
      "Mini X-Burguer",
      "Mini Hot Dog",
      "Mini lanche de carne louca",
    ],
    extraText: "+ outras possibilidades",
    layout: "image-right",
  },
  {
    id: "tortas",
    chapter: "Capítulo 03",
    category: "Tortas",
    title: "Recheios generosos feitos para compartilhar.",
    description:
      "Receitas que acolhem, servem bem e transformam cada pedaço em mais um motivo para ficar à mesa.",
    image: tortasImage,
    imageAlt:
      "Torta artesanal preparada para uma celebração",
    suggestion: {
      quantity: "≈ 1",
      unit: "fatia",
      complement: "por pessoa",
    },
    items: [
      "Torta de frango",
      "Torta de palmito",
      "Torta de legumes",
      "Torta de carne",
    ],
    extraText: "+ consulte sabores disponíveis",
    layout: "image-left",
  },
  {
    id: "bolos",
    chapter: "Capítulo 04",
    category: "Bolos",
    title: "O momento que reúne olhares, sorrisos e aplausos.",
    description:
      "Da apresentação ao primeiro pedaço, cada bolo ajuda a tornar a celebração verdadeiramente especial.",
    image: bolosImage,
    imageAlt:
      "Bolo decorado preparado para um evento da Roda Festa",
    suggestion: {
      quantity: "≈ 100 g",
      unit: "de bolo",
      complement: "por pessoa",
    },
    items: [
      "Chocolate",
      "Leite Ninho",
      "Brigadeiro",
      "Doce de leite",
      "Frutas",
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
      "Brigadeiro de chocolate",
      "Brigadeiro de Leite Ninho",
      "Beijinho",
      "Casadinho",
      "Doces decorados",
    ],
    extraText: "+ diferentes sabores e apresentações",
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
      "Brigadeiro cremoso",
      "Doce de leite",
      "Creme de Leite Ninho",
      "Sabores especiais",
    ],
    extraText: "+ consulte as combinações disponíveis",
    layout: "image-right",
  },
];

export default menuData;