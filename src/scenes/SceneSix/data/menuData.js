import heroCardapioImage from "../assets/hero-cardapio.jpg";
import petiscosImage from "../assets/petiscos.jpg";
import miniLanchesImage from "../assets/mini-lanches.jpg";
import tortasImage from "../assets/tortas.jpg";
import bolosImage from "../assets/bolos.jpg";
import docesImage from "../assets/doces.jpg";
import docesTachoImage from "../assets/doces-tacho.jpg";

export const heroCardapio = {
  image: heroCardapioImage,
  imageAlt: "Mesa gastronômica preparada pela Roda Festa para uma celebração",
};

const loadingText = "Carregando opções atualizadas do catálogo...";

const menuData = [
  {
    id: "petiscos",
    commercialCategory: "Petiscos",
    category: "Petiscos",
    title: "Aquele cheirinho que reúne todo mundo.",
    description: "Clássicos servidos quentinhos para fazer a celebração começar antes mesmo da primeira conversa.",
    image: petiscosImage,
    imageAlt: "Petiscos variados preparados para uma celebração da Roda Festa",
    items: [], extraText: loadingText, layout: "image-left",
  },
  {
    id: "mini-lanches",
    commercialCategory: "Mini lanches",
    category: "Mini Lanches",
    title: "Pequenos no tamanho. Inesquecíveis no sabor.",
    description: "Preparados para servir com praticidade, personalidade e aquele verdadeiro gosto de festa.",
    image: miniLanchesImage,
    imageAlt: "Mini lanches preparados pela Roda Festa durante um evento",
    items: [], extraText: loadingText, layout: "image-right",
  },
  {
    id: "tortas",
    commercialCategory: "Tortas",
    category: "Tortas",
    title: "Recheios generosos feitos para compartilhar.",
    description: "Receitas artesanais com massas macias e recheios generosos, preparadas para servir bem e deixar cada pedaço ainda mais especial.",
    image: tortasImage,
    imageAlt: "Torta artesanal preparada para uma celebração",
    items: [], extraText: loadingText, layout: "image-left",
  },
  {
    id: "bolos",
    commercialCategory: "Bolos",
    category: "Bolos",
    title: "O momento que reúne olhares, sorrisos e aplausos.",
    description: "Bolos preparados para tornar o momento do parabéns ainda mais especial.",
    image: bolosImage,
    imageAlt: "Bolo decorado preparado para um evento da Roda Festa",
    items: [], extraText: loadingText, layout: "image-right",
  },
  {
    id: "doces",
    commercialCategory: "Doces",
    category: "Doces",
    title: "Pequenos detalhes que permanecem na memória.",
    description: "Doces pensados para completar a mesa e encantar os convidados.",
    image: docesImage,
    imageAlt: "Seleção de doces preparados para uma celebração",
    items: [], extraText: loadingText, layout: "image-left",
  },
  {
    id: "brigadeiro-no-tacho",
    commercialCategory: "Brigadeiro no tacho",
    category: "Brigadeiro no Tacho",
    title: "Um final preparado para ser saboreado sem pressa.",
    description: "Brigadeiro cremoso servido em porções de 80 g por pessoa, conforme as opções atuais do catálogo.",
    image: docesTachoImage,
    imageAlt: "Brigadeiro no tacho durante uma celebração",
    items: [], extraText: loadingText, layout: "image-right",
  },
  {
    id: "bebidas",
    commercialCategory: "Bebidas",
    category: "Bebidas",
    title: "Para acompanhar cada momento da celebração.",
    description: "As opções ativas do catálogo aparecem aqui e podem ser tratadas em consignação conforme a regra comercial vigente.",
    image: heroCardapioImage,
    imageAlt: "Mesa gastronômica preparada para uma celebração da Roda Festa",
    items: [], extraText: loadingText, layout: "image-left",
  },
];

export default menuData;
