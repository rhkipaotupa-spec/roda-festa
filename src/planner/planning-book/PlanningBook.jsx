import { useMemo, useRef, useState } from "react";

import "./PlanningBook.css";

import useBookNavigation, {
  BOOK_SHEETS,
} from "./useBookNavigation";

import {
  Book,
  BookHeader,
  BookProgress,
  BookFooter,
  BookFlip,
} from "./book";

import {
  PRODUCTS,
  calculateCarts,
  calculateDisposables,
  calculateInvestment,
  calculatePreparers,
  calculateSuggestedProductQuantity,
  calculateWaiters,
  evaluateSuggestion,
  generatePlanningSuggestion,
} from "./engine/planningRules";

import {
  buildPlanningScene,
} from "./engine/buildPlanningScene";

import rodaFestaLogo from "./assets/logo-roda-festa.png";
import rodaFestaLogoCreme from "./assets/logo-roda-festa-creme.png";
import carBurger from "./assets/car-burger.png";
import carFrituras from "./assets/car-frituras.png";
import carHotDog from "./assets/car-hot-dog.png";
import carBurgerHotDog from "./assets/car-burger-hot-dog.png";
import carDrinks from "./assets/car-drinks.png";
import tableBolo from "./assets/table-bolo.png";
import tableDoces from "./assets/table-doces.png";
import tableBoloDoces from "./assets/table-bolo-doces.png";


const SCENE_ASSETS = {
  fried: carFrituras,
  burger: carBurger,
  hotDog: carHotDog,
  burgerHotDog: carBurgerHotDog,
  drinks: carDrinks,
  cake: tableBolo,
  sweets: tableDoces,
  cakeSweets: tableBoloDoces,
};

function getSceneComposition(stations = []) {
  const byId = new Map(stations.map((station) => [station.id, station]));
  const result = [];

  const friedStation = byId.get("fried");
  if (friedStation?.items?.length) {
    result.push({
      id: "fried",
      kind: "cart",
      label: "Carrinho de frituras",
      src: SCENE_ASSETS.fried,
    });
  }

  const miniStation = byId.get("hotSandwiches");
  if (miniStation?.items?.length) {
    const itemIds = new Set(miniStation.items.map((item) => item.id));
    const hasBurger = itemIds.has("mini-x-burguer") || itemIds.has("mini-x-burger");
    const hasHotDog = itemIds.has("mini-hot-dog");

    let src = null;
    let label = "Carrinho de mini lanches";

    if (hasBurger && hasHotDog) {
      src = SCENE_ASSETS.burgerHotDog;
      label = "Carrinho de mini burger e hot dog";
    } else if (hasHotDog) {
      src = SCENE_ASSETS.hotDog;
      label = "Carrinho de mini hot dog";
    } else if (hasBurger) {
      src = SCENE_ASSETS.burger;
      label = "Carrinho de mini burger";
    }

    if (!src) {
      src = SCENE_ASSETS.burger;
      label = "Carrinho de mini lanches e tortas";
    }

    result.push({ id: "mini", kind: "cart", label, src });
  }

  const beverageStation = byId.get("beverages");
  if (beverageStation) {
    result.push({
      id: "drinks",
      kind: "cart",
      label: "Carrinho de bebidas",
      src: SCENE_ASSETS.drinks,
    });
  }

  const dessertStation = byId.get("desserts");
  if (dessertStation?.items?.length) {
    const hasCake = dessertStation.items.some(
      (item) => item.operationalGroup === "cake"
    );
    const hasSweets = dessertStation.items.some(
      (item) =>
        item.operationalGroup === "sweets" ||
        String(item.id).includes("brigadeiro") ||
        String(item.id).includes("doce")
    );

    if (hasCake || hasSweets) {
      result.push({
        id: "desserts",
        kind: "table",
        label: hasCake && hasSweets
          ? "Mesa ilustrativa com bolo e doces"
          : hasCake
            ? "Mesa ilustrativa com bolo"
            : "Mesa ilustrativa com doces",
        src: hasCake && hasSweets
          ? SCENE_ASSETS.cakeSweets
          : hasCake
            ? SCENE_ASSETS.cake
            : SCENE_ASSETS.sweets,
      });
    }
  }

  return result;
}

function SceneAssetComposition({ stations = [] }) {
  const objects = getSceneComposition(stations);

  return (
    <div
      className={`planning-book__asset-scene planning-book__asset-scene--count-${objects.length}`}
      aria-label="Visualização das escolhas do evento"
    >
      <div className="planning-book__asset-scene-ground" aria-hidden="true" />
      <div className="planning-book__asset-scene-row">
        {objects.map((object) => (
          <figure
            key={object.id}
            className={[
              "planning-book__asset-scene-object",
              `planning-book__asset-scene-object--${object.kind}`,
              `planning-book__asset-scene-object--${object.id}`,
            ].join(" ")}
          >
            <img src={object.src} alt={object.label} />
          </figure>
        ))}
      </div>
    </div>
  );
}

const EVENT_OPTIONS = [
  {
    id: "infantil",
    label: "Festa Infantil",
    description:
      "Uma experiência acolhedora, descontraída e pensada para toda a família.",
  },
  {
    id: "casamento",
    label: "Casamento",
    description:
      "Uma composição elegante para celebrar um momento único.",
  },
  {
    id: "corporativo",
    label: "Evento Corporativo",
    description:
      "Atendimento organizado e adequado ao ambiente profissional.",
  },
];

const MENU_CATEGORIES = [
  { id: "mini-lanches", title: "Mini Lanches", commercialCategory: "Mini lanches", note: "Escolha os mini lanches que combinam com o seu evento." },
  { id: "salgadinhos-fritos", title: "Salgadinhos Fritos", commercialCategory: "Petiscos", note: "Selecione os sabores que deseja servir durante a festa." },
  { id: "tortas", title: "Tortas", commercialCategory: "Tortas", note: "A recomendação será calculada em porções de 150 g por pessoa." },
  { id: "doces", title: "Doces", commercialCategory: "Doces", note: "Escolha os doces que deseja incluir na composição." },
  { id: "bolos", title: "Bolos", commercialCategory: "Bolos", note: "A recomendação será calculada em porções de 120 g por pessoa." },
  { id: "bebidas", title: "Bebidas (Consignação)", commercialCategory: "Bebidas", note: "Cobradas conforme o consumo e fora do investimento contratado." },
];

const ANALYSIS_STEPS = [
  "Entendendo o perfil do evento",
  "Interpretando o número de convidados",
  "Dimensionando a estrutura",
  "Organizando a equipe",
  "Interpretando suas escolhas de cardápio",
  "Calculando o investimento",
  "Finalizando sua recomendação",
];

const ANALYSIS_DELAY = 1120;

const COMMERCIAL_TERMS = {
  validity: "5 dias",
  paymentMethod: "Pix ou dinheiro",
  reservation: "50% no ato da contratação para reserva da data.",
  balance: "50% até 24 horas antes do evento.",
  consignment: "Bebidas consumidas serão cobradas em até 2 dias úteis após o evento.",
  serviceArea: "Atendimento incluído apenas para eventos em Tupã.",
  contact: "(14) 99896-0208",
  instagram: "@rodafesta",
};

const CANCELLATION_TERMS = [
  "Cancelamento com até 10 dias de antecedência: cobrança de 50% do orçamento.",
  "Cancelamento com até 3 dias de antecedência: cobrança integral do orçamento.",
  "Alteração de data com até 5 dias de antecedência: taxa de 50%, com a nova data sujeita à disponibilidade.",
];

const ELECTRICAL_TERMS = [
  "Utilizamos tomadas 110V e 220V.",
  "Fios, extensões e transformadores já estão contemplados no orçamento.",
  "A amperagem necessária será informada previamente e deverá ser providenciada pelo cliente.",
  "A Roda Festa não se responsabiliza por eventuais quedas de energia.",
];

const PRODUCT_CATALOG = Object.values(PRODUCTS);

function getStationIdForProduct(product) {
  if (product.operationalGroup === "sweets" || product.operationalGroup === "cake") {
    return "desserts";
  }

  return product.operationalGroup;
}

function getProductsForStation(stationId) {
  return PRODUCT_CATALOG.filter(
    (product) => product.active && getStationIdForProduct(product) === stationId
  );
}

const STATION_META = {
  fried: {
    id: "fried",
    title: "Estação de Petiscos",
    description: "Frituras preparadas em pequenos lotes durante o evento.",
  },
  hotSandwiches: {
    id: "hotSandwiches",
    title: "Estação de Mini Lanches e Tortas",
    description: "Mini lanches e tortas finalizados e servidos durante a festa.",
  },
  desserts: {
    id: "desserts",
    title: "Mesa de Doces e Bolo",
    description: "Levamos os doces e o bolo prontos. A mesa, a montagem e a disponibilização aos convidados devem ser providenciadas pelo cliente no local do evento.",
  },
  beverages: {
    id: "beverages",
    title: "Estação de Bebidas",
    description: "Bebidas em consignação, cobradas conforme o consumo.",
  },
};

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "Data a definir";

  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;

  return `${day}/${month}/${year}`;
}

function getTodayDateInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function createPlanningCode() {
  const now = new Date();
  const datePart = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  let sequence = 1;

  try {
    const storageKey = `roda-festa-planning-sequence-${datePart}`;
    sequence = Number(window.localStorage.getItem(storageKey) || 0) + 1;
    window.localStorage.setItem(storageKey, String(sequence));
  } catch {
    sequence = Number(String(Date.now()).slice(-5));
  }

  return `RF-${datePart}-${String(sequence).padStart(5, "0")}`;
}

function formatQuantity(item) {
  const quantity = Number(item?.quantity) || 0;

  if (item?.priceUnit === "portion150g") {
    return `${quantity.toLocaleString("pt-BR")} ${quantity === 1 ? "porção" : "porções"} de 150 g`;
  }

  if (item?.priceUnit === "portion120g") {
    return `${quantity.toLocaleString("pt-BR")} ${quantity === 1 ? "porção" : "porções"} de 120 g`;
  }

  if (item?.priceUnit === "kg") {
    return `${quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  }

  return `${quantity.toLocaleString("pt-BR")} un.`;
}

function formatSummaryQuantity(item) {
  const quantity = Number(item?.quantity) || 0;

  if (item?.priceUnit === "portion120g") {
    const kilograms = (quantity * 120) / 1000;
    return `${kilograms.toLocaleString("pt-BR", {
      minimumFractionDigits: kilograms % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 2,
    })} kg`;
  }

  return formatQuantity(item);
}

function getConsignmentEstimate(items = []) {
  return items
    .filter((item) => item.consignment || item.operationalGroup === "beverages")
    .reduce(
      (total, item) =>
        total + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
}

function getStationSummaryLabel(station) {
  const labels = {
    fried: "Petiscos",
    hotSandwiches: "Mini lanches e tortas",
    desserts: "Doces e bolos",
    beverages: "Bebidas em consignação",
  };

  return labels[station?.id] || station?.title || "Categoria";
}

function getEventIntroduction(eventId) {
  const texts = {
    infantil:
      "Para uma festa infantil, buscamos criar um atendimento leve, contínuo e confortável para adultos e crianças.",
    casamento:
      "Para um casamento, priorizamos uma apresentação elegante, atendimento fluido e uma experiência cuidadosa durante toda a celebração.",
    corporativo:
      "Para um evento corporativo, recomendamos uma operação objetiva, organizada e adequada ao ritmo dos convidados.",
  };

  return (
    texts[eventId] ??
    "Vamos dimensionar uma estrutura adequada ao perfil do seu evento."
  );
}

function getCartGroupLabel(groupId) {
  const labels = {
    fried: "Petiscos",
    hotSandwiches: "Mini Lanches e Tortas",
    beverages: "Bebidas",
  };

  return labels[groupId] ?? "Atendimento";
}

function getCartAllocationDetails(groups = []) {
  const reasons = {
    fried:
      "Carrinho exclusivo para frituras, responsável pelo preparo contínuo dos salgados durante o evento.",
    hotSandwiches:
      "Carrinho exclusivo para mini lanches ou tortas, sem compartilhar a operação com frituras.",
    beverages:
      "Carrinho exclusivo para organizar e servir as bebidas em consignação durante o evento.",
  };

  return groups.map((group) => {
    const stationLabel = getCartGroupLabel(group.operationalGroup);
    const itemNames = group.items.map((item) => item.name).filter(Boolean);

    return {
      id: group.operationalGroup,
      stationLabel,
      cartsRequired: 1,
      itemSummary:
        itemNames.length > 0 ? itemNames.join(", ") : "Itens selecionados",
      reason:
        reasons[group.operationalGroup] ??
        "Carrinho exclusivo para esta estação durante o atendimento.",
    };
  });
}

function getStructureExplanation({ carts, adults, children, duration, groups }) {
  const cartText = carts === 1 ? "um carrinho" : `${carts} carrinhos`;
  const audienceText = [
    adults > 0 ? `${adults} ${adults === 1 ? "adulto" : "adultos"}` : null,
    children > 0 ? `${children} ${children === 1 ? "criança" : "crianças"}` : null,
  ].filter(Boolean).join(" e ");

  return {
    summary: `Para atender ${audienceText || "seus convidados"} durante ${duration} horas, recomendamos ${cartText}. Cada carrinho fica dedicado a uma operação específica para manter o atendimento organizado e contínuo.`,
    allocation: getCartAllocationDetails(groups),
    supportNote:
      "Doces e bolo não ocupam carrinho e não incluem mesa: a Roda Festa entrega somente os itens, e o cliente disponibiliza no local a mesa, o aparador e a forma de servi-los aos convidados.",
  };
}

function getTeamExplanation({ preparers, waiters }) {
  const preparerText =
    preparers === 1
      ? "um profissional de preparo"
      : `${preparers} profissionais de preparo`;

  if (waiters > 0) {
    const waiterText = waiters === 1 ? "um garçom" : `${waiters} garçons`;
    return `A estrutura contará com ${preparerText} nos carrinhos e ${waiterText} para apoiar o atendimento aos convidados.`;
  }

  return `A estrutura contará com ${preparerText}, responsável pelo preparo e atendimento em cada estação. Garçons não foram incluídos nesta primeira sugestão.`;
}

function buildStations(items = [], includeBeverages = false) {
  const groups = new Map();

  items.forEach((item) => {
    let stationId = item.operationalGroup;

    if (stationId === "sweets" || stationId === "cake") {
      stationId = "desserts";
    }

    if (!STATION_META[stationId]) return;

    if (!groups.has(stationId)) {
      groups.set(stationId, {
        ...STATION_META[stationId],
        items: [],
      });
    }

    groups.get(stationId).items.push(item);
  });

  if (includeBeverages && !groups.has("beverages")) {
    groups.set("beverages", {
      ...STATION_META.beverages,
      items: [],
    });
  }

  return Array.from(groups.values());
}

export default function PlanningBook() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [olderChildren, setOlderChildren] = useState(0);
  const [duration, setDuration] = useState(4);
  const [includeWaiters, setIncludeWaiters] = useState(false);
  const [includeDisposables, setIncludeDisposables] = useState(false);
  const [includeBeverages, setIncludeBeverages] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [expandedMenuCategories, setExpandedMenuCategories] = useState([]);
  const [generatedSuggestion, setGeneratedSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [isSuggestionRevealed, setIsSuggestionRevealed] = useState(false);
  const [revealTransitionKey, setRevealTransitionKey] = useState(0);
  const [isOpeningRecommendation, setIsOpeningRecommendation] = useState(false);
  const [additionalProductIds, setAdditionalProductIds] = useState([]);
  const [sceneNotice, setSceneNotice] = useState("");
  const [pendingProductAddition, setPendingProductAddition] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isOpeningBook, setIsOpeningBook] = useState(false);
  const [isClosingBook, setIsClosingBook] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [planningCode, setPlanningCode] = useState("");
  const [welcomeErrors, setWelcomeErrors] = useState({});

  const planningCodeRef = useRef("");
  const summaryPageRef = useRef(null);
  const scenePageRef = useRef(null);

  const navigation = useBookNavigation();

  const planningAdults = adults + olderChildren;

  const equivalentGuests = useMemo(
    () => planningAdults + children * 0.5,
    [planningAdults, children]
  );

  const realGuests = adults + olderChildren + children;
  const minimumEventDate = useMemo(() => getTodayDateInputValue(), []);

  const selectedEventData =
    EVENT_OPTIONS.find((option) => option.id === selectedEvent) ?? null;

  const menuCategories = useMemo(
    () =>
      MENU_CATEGORIES.map((category) => ({
        ...category,
        products: PRODUCT_CATALOG.filter(
          (product) => product.active && product.commercialCategory === category.commercialCategory
        ),
      })),
    []
  );

  const selectedMenuCategoriesCount = menuCategories.filter((category) =>
    category.products.some((product) => selectedProductIds.includes(product.id))
  ).length;

  const selectedMenuDetails = useMemo(
    () => menuCategories
      .map((category) => ({
        id: category.id,
        title: category.title,
        products: category.products.filter((product) => selectedProductIds.includes(product.id)),
      }))
      .filter((category) => category.products.length > 0),
    [menuCategories, selectedProductIds]
  );

  const canGenerateSuggestion =
    Boolean(selectedEvent) &&
    realGuests > 0 &&
    selectedProductIds.length > 0 &&
    !isAnalyzing;

  const stations = useMemo(
    () =>
      generatedSuggestion
        ? buildStations(generatedSuggestion.items, includeBeverages)
        : [],
    [generatedSuggestion, includeBeverages]
  );

  const selectedStation =
    stations.find((station) => station.id === navigation.selectedStation) ??
    null;

  const sceneResult = useMemo(() => {
    if (!generatedSuggestion) return null;

    return buildPlanningScene({
      suggestion: generatedSuggestion,
      eventType: selectedEvent,
    });
  }, [generatedSuggestion, selectedEvent]);

  const canShowScene =
    Boolean(sceneResult) &&
    !isAnalyzing &&
    (isSuggestionRevealed ||
      navigation.currentSheet === BOOK_SHEETS.STATION ||
      navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION);

  const sceneStations = useMemo(
    () =>
      stations
        .filter((station) => station.id !== "desserts")
        .map((station) => ({
          id: station.id,
          title: station.title,
          itemCount: station.items.length,
        })),
    [stations]
  );

  const sceneDeliveredItems = useMemo(() => {
    const dessertStation = stations.find((station) => station.id === "desserts");

    if (!dessertStation) return [];

    return dessertStation.items.map((item) => item.name);
  }, [stations]);

  const recommendation = generatedSuggestion
    ? {
        introduction: getEventIntroduction(selectedEvent),
        structure: getStructureExplanation({
          carts: generatedSuggestion.carts.totalCarts,
          adults: planningAdults,
          children,
          duration,
          groups: generatedSuggestion.carts.groups,
        }),
        team: getTeamExplanation({
          preparers: generatedSuggestion.preparers,
          waiters: generatedSuggestion.waiters.quantity,
        }),
      }
    : null;

  async function handleOpenPlanningBook(event) {
    event?.preventDefault();
    if (isOpeningBook) return;

    const errors = {};
    const cleanName = clientName.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!cleanName) errors.clientName = "Informe seu nome para continuar.";
    if (!phoneDigits || phoneDigits.length < 10) {
      errors.phone = "Informe um telefone válido com DDD.";
    }
    if (!eventDate) {
      errors.eventDate = "Escolha a data do evento.";
    } else if (eventDate < minimumEventDate) {
      errors.eventDate = "A data do evento não pode ser anterior a hoje.";
    }

    setWelcomeErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setClientName(cleanName);
    setIsOpeningBook(true);
    await wait(920);
    setShowWelcome(false);
    window.setTimeout(() => setIsOpeningBook(false), 80);
  }

  function scrollToMobileSection(sectionRef, delay = 80) {
    if (typeof window === "undefined" || window.innerWidth > 760) return;

    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, delay);
  }

  function invalidateSuggestion() {
    if (isAnalyzing) return;
    setGeneratedSuggestion(null);
    setAnalysisStep(-1);
    setIsSuggestionRevealed(false);
    setAdditionalProductIds([]);
  }

  function handleAdultChange(value) {
    setAdults(Math.min(100, Math.max(0, Number(value) || 0)));
    invalidateSuggestion();
  }

  function handleChildrenChange(value) {
    setChildren(Math.min(100, Math.max(0, Number(value) || 0)));
    invalidateSuggestion();
  }

  function handleOlderChildrenChange(value) {
    setOlderChildren(Math.min(100, Math.max(0, Number(value) || 0)));
    invalidateSuggestion();
  }

  function toggleMenuCategory(category) {
    const productIds = category.products.map((product) => product.id);
    const hasSelection = productIds.some((id) => selectedProductIds.includes(id));

    setExpandedMenuCategories((current) =>
      current.includes(category.id)
        ? current.filter((id) => id !== category.id)
        : [...current, category.id]
    );

    if (hasSelection) {
      setSelectedProductIds((current) => current.filter((id) => !productIds.includes(id)));
      if (category.id === "bebidas") setIncludeBeverages(false);
    } else {
      setSelectedProductIds((current) => [...new Set([...current, ...productIds])]);
      if (category.id === "bebidas") setIncludeBeverages(true);
    }

    invalidateSuggestion();
  }

  function toggleMenuProduct(product, categoryId) {
    setSelectedProductIds((current) => {
      const next = current.includes(product.id)
        ? current.filter((id) => id !== product.id)
        : [...current, product.id];

      if (categoryId === "bebidas") {
        const beverageIds = menuCategories
          .find((category) => category.id === "bebidas")
          ?.products.map((item) => item.id) ?? [];
        setIncludeBeverages(next.some((id) => beverageIds.includes(id)));
      }

      return next;
    });

    invalidateSuggestion();
  }

  async function handleGenerateSuggestion() {
    if (!canGenerateSuggestion) return;

    setGeneratedSuggestion(null);
    setAnalysisStep(-1);
    setIsSuggestionRevealed(false);
    setAdditionalProductIds([]);
    setIsAnalyzing(true);
    navigation.goToSuggestion();
    scrollToMobileSection(summaryPageRef, 140);

    const suggestion = generatePlanningSuggestion({
      adults: planningAdults,
      children,
      serviceHours: duration,
      selectedProductIds,
      includeWaiters,
      includeDisposables,
      includeBeverages: selectedProductIds.some((id) => PRODUCTS[Object.keys(PRODUCTS).find((key) => PRODUCTS[key].id === id)]?.consignment),
      additionalProductIds: [],
    });

    for (let index = 0; index < ANALYSIS_STEPS.length; index += 1) {
      await wait(ANALYSIS_DELAY);
      setAnalysisStep(index);
    }

    await wait(760);
    setGeneratedSuggestion(suggestion);
    setIsAnalyzing(false);
    setIsSuggestionRevealed(false);
  }

  function handleRestartPlanning() {
    const shouldRestart = window.confirm(
      "Deseja refazer o planejamento? As informações preenchidas serão apagadas."
    );

    if (!shouldRestart) return;

    setClientName("");
    setPhone("");
    setEventDate("");
    setSelectedEvent("");
    setAdults(0);
    setChildren(0);
    setOlderChildren(0);
    setDuration(4);
    setIncludeWaiters(false);
    setIncludeDisposables(false);
    setIncludeBeverages(false);
    setSelectedProductIds([]);
    setExpandedMenuCategories([]);
    setGeneratedSuggestion(null);
    setIsAnalyzing(false);
    setAnalysisStep(-1);
    setIsSuggestionRevealed(false);
    setIsOpeningRecommendation(false);
    setAdditionalProductIds([]);
    setSceneNotice("");
    setPendingProductAddition(null);
    navigation.restart();
  }

  async function handleRevealSuggestion() {
    if (isOpeningRecommendation) return;

    setIsOpeningRecommendation(true);
    await wait(520);
    setIsSuggestionRevealed(true);
    setRevealTransitionKey((current) => current + 1);
    scrollToMobileSection(summaryPageRef, 120);
    await wait(360);
    setIsOpeningRecommendation(false);
  }

  function handleAddOptionalGroup(groupId) {
    const groupProducts = {
      fried: ["coxinha-frango-catupiry"],
      hotSandwiches: ["mini-x-burguer"],
      desserts: ["brigadeiro-chocolate", "bolo-beatriz"],
      beverages: [],
    };

    if (!generatedSuggestion) return;

    if (groupId === "beverages") {
      setIncludeBeverages(true);

      const nextSuggestion = generatePlanningSuggestion({
        adults: planningAdults,
        children,
        serviceHours: duration,
        selectedProductIds,
        includeWaiters,
        includeDisposables,
        includeBeverages: true,
        additionalProductIds,
      });

      setGeneratedSuggestion(nextSuggestion);
      setSceneNotice("Bebidas adicionadas à visualização");
      window.setTimeout(() => setSceneNotice(""), 2400);
      return;
    }

    const productIds = groupProducts[groupId] ?? [];
    if (productIds.length === 0) return;

    const nextAdditionalProductIds = Array.from(
      new Set([...additionalProductIds, ...productIds])
    );

    setAdditionalProductIds(nextAdditionalProductIds);

    const nextSuggestion = generatePlanningSuggestion({
      adults: planningAdults,
      children,
      serviceHours: duration,
      selectedProductIds,
      includeWaiters,
      includeDisposables,
      includeBeverages: selectedProductIds.some((id) => PRODUCTS[Object.keys(PRODUCTS).find((key) => PRODUCTS[key].id === id)]?.consignment),
      additionalProductIds: nextAdditionalProductIds,
    });

    setGeneratedSuggestion(nextSuggestion);

    const groupLabel =
      groupId === "fried"
        ? "Petiscos adicionados à visualização"
        : groupId === "hotSandwiches"
          ? "Mini lanches e tortas adicionados à visualização"
          : "Doces e bolos adicionados à visualização";

    setSceneNotice(groupLabel);
    window.setTimeout(() => {
      setSceneNotice("");
    }, 2400);
  }

  function handleRemoveOptionalGroup(groupId) {
    if (!generatedSuggestion) return;

    const nextItems = generatedSuggestion.items.filter(
      (item) => getStationIdForProduct(item) !== groupId
    );

    if (groupId === "beverages") {
      setIncludeBeverages(false);
    }

    setAdditionalProductIds((current) =>
      current.filter((productId) => {
        const product = PRODUCT_CATALOG.find((item) => item.id === productId);
        return !product || getStationIdForProduct(product) !== groupId;
      })
    );

    rebuildSuggestionWithItems(nextItems);
    setSceneNotice(
      groupId === "fried"
        ? "Petiscos retirados do planejamento"
        : groupId === "hotSandwiches"
          ? "Mini lanches e tortas retirados do planejamento"
          : groupId === "desserts"
          ? "Doces e bolos retirados do planejamento"
          : "Bebidas retiradas do planejamento"
    );
    window.setTimeout(() => setSceneNotice(""), 2000);
    navigation.goToSuggestion();
  }

  function rebuildSuggestionWithItems(nextItems) {
    if (!generatedSuggestion) return;

    const normalizedItems = nextItems
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => ({
        ...item,
        estimatedValue: item.consignment
          ? 0
          : Number(item.quantity) * Number(item.unitPrice || 0),
      }));

    const carts = calculateCarts({
      items: normalizedItems,
      serviceHours: duration,
      equivalentGuests,
    });
    const preparers = calculatePreparers(carts.totalCarts);
    const waiters = calculateWaiters({ realGuests, includeWaiters });
    const disposables = calculateDisposables({
      equivalentGuests,
      includeDisposables,
    });
    const investment = calculateInvestment({
      items: normalizedItems,
      totalCarts: carts.totalCarts,
      serviceHours: duration,
      waiters,
      disposables,
    });
    const evaluation = evaluateSuggestion({
      equivalentGuests,
      items: normalizedItems,
      totalCarts: carts.totalCarts,
    });

    setGeneratedSuggestion((current) => ({
      ...current,
      items: normalizedItems,
      carts,
      preparers,
      waiters,
      disposables,
      investment,
      evaluation,
    }));
  }

  function handleItemQuantityChange(itemId, nextQuantity) {
    if (!generatedSuggestion) return;

    const currentItem = generatedSuggestion.items.find((item) => item.id === itemId);
    if (!currentItem) return;

    const lotSize = Number(currentItem.lotSize) || 1;
    const rawValue = Math.max(0, Number(nextQuantity) || 0);
    const normalizedQuantity = currentItem.priceUnit === "kg"
      ? Math.round(rawValue / lotSize) * lotSize
      : Math.round(rawValue / lotSize) * lotSize;

    rebuildSuggestionWithItems(
      generatedSuggestion.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, normalizedQuantity) }
          : item
      )
    );
  }

  function handleRemoveItem(itemId) {
    if (!generatedSuggestion) return;

    const itemToRemove = generatedSuggestion.items.find((item) => item.id === itemId);
    const stationId = itemToRemove ? getStationIdForProduct(itemToRemove) : null;
    const stationItems = stationId
      ? generatedSuggestion.items.filter(
          (item) => getStationIdForProduct(item) === stationId
        )
      : [];
    const removesLastItemFromStation = Boolean(stationId) && stationItems.length === 1;

    const nextItems = generatedSuggestion.items.filter((item) => item.id !== itemId);

    setAdditionalProductIds((current) =>
      current.filter((productId) => productId !== itemId)
    );

    if (removesLastItemFromStation && stationId === "beverages") {
      setIncludeBeverages(false);
    }

    rebuildSuggestionWithItems(nextItems);

    if (removesLastItemFromStation) {
      setSceneNotice("Categoria retirada do planejamento");
      window.setTimeout(() => setSceneNotice(""), 1800);

      navigation.goTo(BOOK_SHEETS.SUGGESTION, {
        replace: true,
        direction: "backward",
      });
      return;
    }

    setSceneNotice("Item retirado da recomendação");
    window.setTimeout(() => setSceneNotice(""), 1800);
  }

  function getCategorySuggestedTotal(product) {
    const categoryProducts = PRODUCT_CATALOG.filter(
      (item) => item.active && item.commercialCategory === product.commercialCategory
    );
    const unitsPerGuest = Math.max(
      0,
      ...categoryProducts.map((item) => Number(item.suggestedUnitsPerEquivalentGuest) || 0)
    );
    return Math.max(0, equivalentGuests * unitsPerGuest);
  }

  function distributeCategoryTotal(products, targetTotal) {
    if (!products.length) return [];

    const allocations = products.map((product) => ({
      product,
      quantity: Number(product.lotSize) || 1,
    }));
    let allocated = allocations.reduce((sum, item) => sum + item.quantity, 0);
    let cursor = 0;
    let guard = 0;

    while (allocated < targetTotal && guard < 100000) {
      const entry = allocations[cursor % allocations.length];
      const lot = Number(entry.product.lotSize) || 1;
      entry.quantity += lot;
      allocated += lot;
      cursor += 1;
      guard += 1;
    }

    return allocations;
  }

  function handleAddProduct(productId) {
    if (!generatedSuggestion) return;
    if (generatedSuggestion.items.some((item) => item.id === productId)) return;

    const product = PRODUCT_CATALOG.find((item) => item.id === productId);
    if (!product) return;

    const sameCategoryItems = generatedSuggestion.items.filter(
      (item) => item.commercialCategory === product.commercialCategory
    );
    const suggestedTotal = getCategorySuggestedTotal(product);
    const currentTotal = sameCategoryItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );

    if (sameCategoryItems.length > 0 && currentTotal >= suggestedTotal) {
      setPendingProductAddition({
        product,
        suggestedTotal,
        currentTotal,
        extraQuantity: Number(product.lotSize) || 1,
      });
      return;
    }

    const quantity = Math.max(
      Number(product.lotSize) || 1,
      Math.min(
        calculateSuggestedProductQuantity({ product, equivalentGuests }),
        Math.max(Number(product.lotSize) || 1, suggestedTotal - currentTotal)
      )
    );

    confirmProductAddition(product, quantity);
  }

  function confirmProductAddition(product, quantity) {
    const safeQuantity = Math.max(
      Number(product.lotSize) || 1,
      Number(quantity) || Number(product.lotSize) || 1
    );

    rebuildSuggestionWithItems([
      ...generatedSuggestion.items,
      {
        ...product,
        quantity: safeQuantity,
        estimatedValue: product.consignment ? 0 : safeQuantity * product.unitPrice,
      },
    ]);

    if (product.operationalGroup === "beverages") setIncludeBeverages(true);
    setPendingProductAddition(null);
    setSceneNotice(`${product.name} adicionado à recomendação`);
    window.setTimeout(() => setSceneNotice(""), 1800);
  }

  function redistributeWithPendingProduct() {
    if (!generatedSuggestion || !pendingProductAddition) return;
    const { product, suggestedTotal } = pendingProductAddition;
    const categoryItems = generatedSuggestion.items.filter(
      (item) => item.commercialCategory === product.commercialCategory
    );
    const otherItems = generatedSuggestion.items.filter(
      (item) => item.commercialCategory !== product.commercialCategory
    );
    const allocations = distributeCategoryTotal([...categoryItems, product], suggestedTotal);
    const redistributed = allocations.map(({ product: item, quantity }) => ({
      ...item,
      quantity,
      estimatedValue: item.consignment ? 0 : quantity * item.unitPrice,
    }));

    rebuildSuggestionWithItems([...otherItems, ...redistributed]);
    if (product.operationalGroup === "beverages") setIncludeBeverages(true);
    setPendingProductAddition(null);
    setSceneNotice("Quantidade total redistribuída entre os sabores");
    window.setTimeout(() => setSceneNotice(""), 2200);
  }

  function ensurePlanningCode() {
    if (planningCodeRef.current) return planningCodeRef.current;

    const nextCode = createPlanningCode();
    planningCodeRef.current = nextCode;
    setPlanningCode(nextCode);

    try {
      window.localStorage.setItem("roda-festa-last-planning-code", nextCode);
    } catch {
      // O código continua válido durante esta sessão mesmo sem armazenamento local.
    }

    return nextCode;
  }

  function handlePrintProposal() {
    if (!generatedSuggestion) return;

    const currentPlanningCode = ensurePlanningCode();

    const proposalWindow = window.open("", "_blank");
    if (!proposalWindow) {
      window.alert("Permita a abertura de pop-ups para gerar a proposta em PDF.");
      return;
    }

    proposalWindow.opener = null;

    const escapeHtml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const absoluteLogoUrl = new URL(rodaFestaLogo, window.location.href).href;
    const consignmentEstimate = getConsignmentEstimate(generatedSuggestion.items);
    const hasDesserts = stations.some((station) => station.id === "desserts");
    const clientDisplayName = clientName.trim() || "Cliente";
    const eventDisplayName = selectedEventData?.label || "Evento";

    const stationPages = stations
      .map((station) => {
        const items = station.items
          .map(
            (item) => `
              <div class="item-row">
                <span>${escapeHtml(item.name)}</span>
                <strong>${escapeHtml(formatSummaryQuantity(item))}</strong>
              </div>`
          )
          .join("");

        return `
          <section class="station-card">
            <h3>${escapeHtml(getStationSummaryLabel(station))}</h3>
            ${items}
          </section>`;
      })
      .join("");

    const cancellationHtml = CANCELLATION_TERMS.map(
      (term) => `<p>${escapeHtml(term)}</p>`
    ).join("");

    const electricalHtml = ELECTRICAL_TERMS.map(
      (term) => `<p>${escapeHtml(term)}</p>`
    ).join("");

    const proposalHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Proposta Roda Festa ${escapeHtml(currentPlanningCode)} - ${escapeHtml(clientDisplayName)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #3b281d; }
    body { font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { position: relative; width: 210mm; min-height: 297mm; height: 297mm; max-height: 297mm; padding: 20mm; break-after: page; page-break-after: always; background: #fbf6ee; overflow: hidden; }
    .page:last-child { page-break-after: auto; }
    .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: linear-gradient(145deg, #f8f0e4, #ead7bd); }
    .cover::before { content: ""; position: absolute; inset: 9mm; border: 1px solid #b6803d; }
    .cover img { width: 54mm; max-height: 45mm; object-fit: contain; margin-bottom: 14mm; opacity: .96; filter: brightness(0) saturate(100%) invert(22%) sepia(30%) saturate(1120%) hue-rotate(343deg) brightness(82%) contrast(92%); }
    .cover .eyebrow, .brandline { color: #8c5a27; font-size: 9pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
    .cover h1 { margin: 5mm 0 0; color: #392419; font: 400 30pt/1 Georgia, serif; }
    .cover h2 { margin: 7mm 0 10mm; color: #9a6728; font: italic 18pt Georgia, serif; }
    .cover .meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 8mm; color: #5f4838; font-size: 10pt; }
    .brandline { display: flex; align-items: center; justify-content: space-between; padding-bottom: 5mm; border-bottom: 1px solid #d8bea0; }
    h2 { margin: 9mm 0 6mm; color: #382419; font: 400 24pt Georgia, serif; }
    h3 { margin: 0 0 3mm; color: #8d5a27; font-size: 10pt; letter-spacing: .1em; text-transform: uppercase; }
    .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
    .fact { padding: 4mm; border: 1px solid #dfcbb3; border-radius: 3mm; background: rgba(255,255,255,.58); }
    .fact span { display: block; margin-bottom: 2mm; color: #94704d; font-size: 7pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
    .fact strong { color: #3c291d; font: 400 11pt Georgia, serif; }
    .station-card { margin-bottom: 4mm; padding: 4mm 5mm; border-left: 2mm solid #9b672c; background: #fffaf3; break-inside: avoid; }
    .station-card h3 { margin-bottom: 2mm; color: #3c291d; font: 400 13pt Georgia, serif; letter-spacing: 0; text-transform: none; }
    .item-row { display: flex; justify-content: space-between; gap: 8mm; padding: 1.6mm 0; border-top: .2mm solid #eadbca; color: #5e4938; font-size: 8.5pt; }
    .item-row strong { white-space: nowrap; color: #7a4b25; }
    .investment { padding: 8mm; border-radius: 4mm; background: #5a2b16; color: #fff4df; }
    .investment span { display: block; font-size: 8pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    .investment strong { display: block; margin: 3mm 0; font: 400 29pt Georgia, serif; }
    .investment small { font-size: 8pt; opacity: .82; }
    .consignment { margin-top: 5mm; padding: 5mm; border: 1px solid #c79a60; border-radius: 3mm; background: #fffaf3; }
    .consignment span { color: #94622d; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
    .consignment strong { display: block; margin: 2mm 0; font: 400 19pt Georgia, serif; }
    .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
    .terms-card { padding: 5mm; border: 1px solid #dfcbb3; border-radius: 3mm; background: rgba(255,255,255,.55); break-inside: avoid; }
    .terms-card p { margin: 2.2mm 0; color: #5f4b3b; font-size: 8.5pt; line-height: 1.45; }
    .footer { position: static; width: 100%; margin-top: 8mm; padding: 6mm 7mm; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12mm; border: 1px solid #d8bea0; border-radius: 3mm; background: #fffaf3; break-inside: avoid; page-break-inside: avoid; }
    .footer div { display: flex; flex-direction: column; gap: 1mm; min-width: 42mm; color: #5b402e; font-size: 8.5pt; line-height: 1.35; }
    .footer p { margin: 0; padding-left: 8mm; border-left: 1px solid #d8bea0; color: #8b653f; font: italic 10pt/1.45 Georgia, serif; text-align: center; }
    .closing { padding: 14mm 18mm 35mm; }
    .closing h2 { margin: 6mm 0 4mm; }
    .closing .investment { padding: 6mm; }
    .closing .consignment { margin-top: 4mm; padding: 4mm; }
    .closing .terms-grid { gap: 5mm; }
    .closing .terms-card { padding: 4.5mm; }
    .closing .terms-card p { margin: 1.6mm 0; font-size: 8pt; line-height: 1.34; }
    .closing .footer { position: absolute; left: 18mm; right: 18mm; bottom: 10mm; width: auto; margin: 0; padding: 4mm 5mm; min-height: 21mm; }
    .print-note { display: none; }
    @media screen {
      body { background: #2a160d; padding: 20px 0; }
      .page { margin: 0 auto 20px; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
      .print-note { display: block; position: sticky; top: 0; z-index: 10; width: 210mm; margin: 0 auto 12px; padding: 10px 14px; border-radius: 8px; background: #fff; color: #4b2d1c; text-align: center; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
    }
    @media print {
      html, body { width: 210mm; margin: 0 !important; padding: 0 !important; }
      .print-note { display: none !important; }
      .page { width: 210mm !important; height: 297mm !important; min-height: 297mm !important; max-height: 297mm !important; margin: 0 !important; box-shadow: none !important; break-after: page !important; page-break-after: always !important; overflow: hidden !important; }
      .page:last-child { break-after: auto !important; page-break-after: auto !important; }
      .closing { padding: 14mm 18mm 35mm !important; }
      .closing .footer { position: absolute !important; left: 18mm !important; right: 18mm !important; bottom: 10mm !important; width: auto !important; margin: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="print-note">Na janela de impressão, escolha “Salvar como PDF”.</div>

  <section class="page cover">
    <img src="${escapeHtml(absoluteLogoUrl)}" alt="Roda Festa" />
    <div class="eyebrow">Proposta comercial</div>
    <div style="margin-top:4mm;color:#8c5a27;font-size:8pt;font-weight:700;letter-spacing:.12em;">${escapeHtml(currentPlanningCode)}</div>
    <h1>${escapeHtml(eventDisplayName)}</h1>
    <h2>${escapeHtml(clientDisplayName)}</h2>
    <div class="meta">
      <span>${escapeHtml(formatDate(eventDate))}</span>
      <span>${escapeHtml(`${adults} adultos${olderChildren > 0 ? ` • ${olderChildren} crianças 7+` : ""}${children > 0 ? ` • ${children} crianças 0–6` : ""}`)}</span>
      <span>${escapeHtml(`${duration} horas`)}</span>
    </div>
  </section>

  <section class="page">
    <div class="brandline"><strong>RODA FESTA</strong><span>Gastronomia que encanta</span></div>
    <h2>Resumo do evento</h2>
    <div class="facts">
      <div class="fact"><span>Código</span><strong>${escapeHtml(currentPlanningCode)}</strong></div>
      <div class="fact"><span>Cliente</span><strong>${escapeHtml(clientDisplayName)}</strong></div>
      <div class="fact"><span>Telefone</span><strong>${escapeHtml(phone || "Não informado")}</strong></div>
      <div class="fact"><span>Data</span><strong>${escapeHtml(formatDate(eventDate))}</strong></div>
      <div class="fact"><span>Evento</span><strong>${escapeHtml(eventDisplayName)}</strong></div>
      <div class="fact"><span>Convidados</span><strong>${escapeHtml(`${adults} adultos${olderChildren > 0 ? `, ${olderChildren} crianças 7+` : ""}${children > 0 ? ` e ${children} crianças 0–6` : ""}`)}</strong></div>
      <div class="fact"><span>Estrutura</span><strong>${escapeHtml(`${generatedSuggestion.carts.totalCarts} ${generatedSuggestion.carts.totalCarts === 1 ? "carrinho" : "carrinhos"}`)}</strong></div>
    </div>
    <h2 style="font-size:20pt;margin-top:10mm;">Cardápio e quantidades</h2>
    ${stationPages}
  </section>

  <section class="page closing">
    <div class="brandline"><strong>RODA FESTA</strong><span>Proposta comercial</span></div>
    <h2>Investimento</h2>
    <div class="investment">
      <span>Investimento contratado</span>
      <strong>${escapeHtml(formatCurrency(generatedSuggestion.investment.total))}</strong>
      <small>Bebidas em consignação não estão incluídas neste valor.</small>
    </div>
    ${consignmentEstimate > 0 ? `
      <div class="consignment">
        <span>Estimativa de consignação</span>
        <strong>${escapeHtml(formatCurrency(consignmentEstimate))}</strong>
        <p>Cobrança em até 2 dias úteis após o evento, apenas das unidades efetivamente consumidas.</p>
      </div>` : ""}

    <h2 style="font-size:20pt;">Condições comerciais e operacionais</h2>
    <div class="terms-grid">
      <div class="terms-card">
        <h3>Condições comerciais</h3>
        <p><strong>Validade:</strong> ${escapeHtml(COMMERCIAL_TERMS.validity)}.</p>
        <p><strong>Pagamento:</strong> ${escapeHtml(COMMERCIAL_TERMS.paymentMethod)}.</p>
        <p><strong>Reserva:</strong> ${escapeHtml(COMMERCIAL_TERMS.reservation)}</p>
        <p><strong>Saldo:</strong> ${escapeHtml(COMMERCIAL_TERMS.balance)}</p>
        <p><strong>Consignação:</strong> ${escapeHtml(COMMERCIAL_TERMS.consignment)}</p>
        <p><strong>Área de atendimento:</strong> ${escapeHtml(COMMERCIAL_TERMS.serviceArea)}</p>
        ${cancellationHtml}
      </div>
      <div class="terms-card">
        <h3>Condições operacionais</h3>
        ${electricalHtml}
        <p>Ao término do evento, todos os alimentos contratados e não consumidos serão entregues aos anfitriões.</p>
        ${hasDesserts ? "<p>Para doces e bolos, o cliente deverá disponibilizar mesa ou aparador e responsabilizar-se pela montagem e exposição.</p>" : ""}
      </div>
    </div>
    <footer class="footer">
      <div><strong>Roda Festa</strong><span>${escapeHtml(COMMERCIAL_TERMS.contact)}</span><span>${escapeHtml(COMMERCIAL_TERMS.instagram)}</span></div>
      <p>Agradecemos a oportunidade de fazer parte deste momento especial.</p>
    </footer>
  </section>

  <script>
    window.addEventListener("load", () => {
      window.setTimeout(() => window.print(), 350);
    });
  <\/script>
</body>
</html>`;

    proposalWindow.document.open();
    proposalWindow.document.write(proposalHtml);
    proposalWindow.document.close();
  }

  function handleOpenWhatsApp() {
    const currentPlanningCode = generatedSuggestion ? ensurePlanningCode() : planningCode;
    const consignmentEstimate = generatedSuggestion
      ? getConsignmentEstimate(generatedSuggestion.items)
      : 0;

    const message = generatedSuggestion
      ? [
          "Olá!",
          "",
          "Concluí meu planejamento no Roda Festa Planner e gostaria de solicitar minha proposta oficial.",
          "",
          `Código: ${currentPlanningCode}`,
          `Cliente: ${clientName.trim() || "Não informado"}`,
          `Evento: ${selectedEventData?.label || "Evento"}`,
          `Data: ${formatDate(eventDate)}`,
          `Convidados: ${realGuests} no total`,
          `Investimento estimado: ${formatCurrency(generatedSuggestion.investment.total)}`,
          `Estimativa de consignação: ${consignmentEstimate > 0 ? formatCurrency(consignmentEstimate) : "Sem consignação"}`,
          "",
          "Peço, por favor, a revisão das informações e o preparo da proposta oficial.",
        ].join("\n")
      : [
          "Olá, Roda Festa!",
          `Gostaria de conversar sobre o evento de ${clientName.trim() || "meu evento"}.`,
          eventDate ? `Data: ${formatDate(eventDate)}.` : "",
        ].filter(Boolean).join(" ");

    window.open(
      `https://wa.me/5514998960208?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleRequestOfficialProposal() {
    if (!generatedSuggestion || isClosingBook) return;

    ensurePlanningCode();
    setIsClosingBook(true);
    await wait(900);
    setShowCompleted(true);
    setIsClosingBook(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  function renderBriefing() {
    return (
      <>
        <header className="planning-book__header">
          <span className="planning-book__eyebrow">Meu planejamento</span>
          <h1 className="planning-book__title">Seu evento está tomando forma.</h1>
          <p className="planning-book__intro">
            Conte um pouco sobre sua festa. Nós transformaremos suas escolhas em
            uma primeira recomendação.
          </p>
        </header>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Seus dados</span>
          <h2>Para quem estamos planejando?</h2>

          <label className="planning-book__field">
            <span>Nome</span>
            <input
              type="text"
              value={clientName}
              disabled={isAnalyzing}
              placeholder="Como podemos chamar você?"
              autoComplete="name"
              onChange={(event) => {
                setClientName(event.target.value);
                invalidateSuggestion();
              }}
            />
          </label>

          <label className="planning-book__field">
            <span>Telefone</span>
            <input
              type="tel"
              value={phone}
              disabled={isAnalyzing}
              placeholder="(00) 00000-0000"
              autoComplete="tel"
              onChange={(event) => {
                setPhone(event.target.value);
                invalidateSuggestion();
              }}
            />
          </label>

          <label className="planning-book__field">
            <span>Data do evento</span>
            <input
              type="date"
              value={eventDate}
              min={minimumEventDate}
              disabled={isAnalyzing}
              onChange={(event) => {
                const nextDate = event.target.value;
                if (nextDate && nextDate < minimumEventDate) return;
                setEventDate(nextDate);
                invalidateSuggestion();
              }}
            />
            <small className="planning-book__date-guidance">
              Selecione a data de hoje ou uma data futura.
            </small>
          </label>
        </div>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Perfil do evento</span>
          <h2>Qual será a ocasião?</h2>

          <div className="planning-book__event-options">
            {EVENT_OPTIONS.map((option) => {
              const isSelected = option.id === selectedEvent;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isAnalyzing}
                  className={[
                    "planning-book__event-option",
                    isSelected ? "planning-book__event-option--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSelectedEvent(option.id);
                    invalidateSuggestion();
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="planning-book__section planning-book__guest-section">
          <span className="planning-book__chapter">Capítulo 1 · Convidados</span>
          <h2>Quem estará na festa?</h2>
          <p className="planning-book__section-intro">Separe os convidados por faixa etária para montarmos uma proposta mais precisa.</p>

          <div className="planning-book__guest-grid">
            <div className="planning-book__counter-row">
              <div>
                <strong>Adultos</strong>
                <span>18 anos ou mais</span>
              </div>
              <div className="planning-book__counter">
                <button type="button" onClick={() => handleAdultChange(adults - 1)}>−</button>
                <input type="number" min="0" max="100" inputMode="numeric" aria-label="Quantidade de adultos" value={adults} onFocus={(event) => event.target.select()} onChange={(event) => handleAdultChange(event.target.value)} />
                <button type="button" onClick={() => handleAdultChange(adults + 1)}>+</button>
              </div>
            </div>

            <div className="planning-book__counter-row">
              <div>
                <strong>Crianças até 6 anos</strong>
                <span>Até 6 anos</span>
              </div>
              <div className="planning-book__counter">
                <button type="button" onClick={() => handleChildrenChange(children - 1)}>−</button>
                <input type="number" min="0" max="100" inputMode="numeric" aria-label="Crianças de até 6 anos" value={children} onFocus={(event) => event.target.select()} onChange={(event) => handleChildrenChange(event.target.value)} />
                <button type="button" onClick={() => handleChildrenChange(children + 1)}>+</button>
              </div>
            </div>

            <div className="planning-book__counter-row">
              <div>
                <strong>Crianças acima de 6 anos</strong>
                <span>Mais de 6 anos</span>
              </div>
              <div className="planning-book__counter">
                <button type="button" onClick={() => handleOlderChildrenChange(olderChildren - 1)}>−</button>
                <input type="number" min="0" max="100" inputMode="numeric" aria-label="Crianças acima de 6 anos" value={olderChildren} onFocus={(event) => event.target.select()} onChange={(event) => handleOlderChildrenChange(event.target.value)} />
                <button type="button" onClick={() => handleOlderChildrenChange(olderChildren + 1)}>+</button>
              </div>
            </div>
          </div>

          <div className="planning-book__guest-summary planning-book__guest-summary--public">
            <div><span>Total de convidados</span><strong>{realGuests}</strong></div>
          </div>
        </div>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Duração</span>
          <h2>Por quanto tempo será a sua festa?</h2>

          <label className="planning-book__field">
            <span>Tempo de atendimento</span>
            <select
              value={duration}
              onChange={(event) => {
                setDuration(Number(event.target.value));
                invalidateSuggestion();
              }}
            >
              {[4, 5, 6, 7, 8].map((hours) => (
                <option key={hours} value={hours}>
                  {hours} horas
                </option>
              ))}
            </select>
          </label>

          <div className="planning-book__duration-notice">
            <span aria-hidden="true">i</span>
            <p>
              O pacote inclui 4 horas de atendimento. Acima desse período,
              haverá acréscimo por hora adicional, por carrinho e, quando
              houver, por garçom.
            </p>
          </div>
        </div>

        <div className="planning-book__section planning-book__menu-selection">
          <span className="planning-book__chapter">Capítulo 2 · Seu cardápio</span>
          <h2>O que você gostaria de servir?</h2>
          <p className="planning-book__section-intro">
            Escolha as categorias e os produtos que combinam com a sua festa. A Roda Festa usará essas preferências para recomendar as quantidades ideais.
          </p>

          <div className="planning-book__menu-summary">
            <div><span>Categorias escolhidas</span><strong>{selectedMenuCategoriesCount}</strong></div>
            <div><span>Produtos escolhidos</span><strong>{selectedProductIds.length}</strong></div>
          </div>

          <div className="planning-book__menu-categories">
            {menuCategories.map((category) => {
              const categoryProductIds = category.products.map((product) => product.id);
              const selectedCount = categoryProductIds.filter((id) => selectedProductIds.includes(id)).length;
              const isExpanded = expandedMenuCategories.includes(category.id);
              const isSelected = selectedCount > 0;

              return (
                <section key={category.id} className={["planning-book__menu-category", isSelected ? "planning-book__menu-category--selected" : ""].filter(Boolean).join(" ")}>
                  <div className="planning-book__menu-category-header">
                    <button type="button" className="planning-book__menu-category-toggle" onClick={() => toggleMenuCategory(category)}>
                      <span className="planning-book__menu-check" aria-hidden="true">{isSelected ? "✓" : "+"}</span>
                      <span><strong>{category.title}</strong><small>{category.note}</small></span>
                    </button>
                    <button type="button" className="planning-book__menu-expand" aria-expanded={isExpanded} onClick={() => setExpandedMenuCategories((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])}>
                      {isExpanded ? "Fechar" : "Escolher produtos"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="planning-book__menu-products">
                      {category.products.map((product) => {
                        const checked = selectedProductIds.includes(product.id);
                        return (
                          <label key={product.id} className={["planning-book__menu-product", checked ? "planning-book__menu-product--selected" : ""].filter(Boolean).join(" ")}>
                            <input type="checkbox" checked={checked} onChange={() => toggleMenuProduct(product, category.id)} />
                            <span>
                              <strong>{product.name}</strong>
                              {product.description && <small>{product.description}</small>}
                              <em>{product.priceUnit === "portion150g" ? `R$ ${product.unitPrice.toFixed(2).replace(".", ",")} / 150 g` : product.priceUnit === "portion120g" ? `R$ ${product.unitPrice.toFixed(2).replace(".", ",")} / 120 g` : `R$ ${product.unitPrice.toFixed(2).replace(".", ",")} / un`}</em>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {selectedProductIds.length === 0 && (
            <p className="planning-book__menu-guidance">Escolha pelo menos um produto para gerar sua recomendação.</p>
          )}
        </div>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Serviços opcionais</span>
          <h2>O que deseja incluir?</h2>

          <div className="planning-book__choices">
            {[
              {
                checked: includeWaiters,
                setChecked: setIncludeWaiters,
                title: "Garçons",
                text: "Para atendimento e serviço nas mesas.",
              },
              {
                checked: includeDisposables,
                setChecked: setIncludeDisposables,
                title: "Descartáveis",
                text: "Pratos, copos, guardanapos e talheres.",
              },
            ].map((choice) => (
              <label key={choice.title} className="planning-book__choice">
                <input
                  type="checkbox"
                  checked={choice.checked}
                  onChange={(event) => {
                    choice.setChecked(event.target.checked);
                    invalidateSuggestion();
                  }}
                />
                <span>
                  <strong>{choice.title}</strong>
                  <small>{choice.text}</small>
                </span>
              </label>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderSuggestion() {
    if (isAnalyzing) {
      return (
        <div className="planning-book__analysis" aria-live="polite">
          <div className="planning-book__analysis-heading">
            <span>Interpretando suas escolhas</span>
            <div className="planning-book__analysis-pulse" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="planning-book__analysis-steps">
            {ANALYSIS_STEPS.map((step, index) => {
              const isCompleted = index <= analysisStep;
              const isCurrent = index === analysisStep + 1;

              return (
                <div
                  key={step}
                  className={[
                    "planning-book__analysis-step",
                    isCompleted
                      ? "planning-book__analysis-step--completed"
                      : "",
                    isCurrent
                      ? "planning-book__analysis-step--current"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span
                    className={[
                      "planning-book__analysis-status",
                      isCurrent ? "planning-book__analysis-status--wheel" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden="true"
                  >
                    {isCompleted ? (
                      "✓"
                    ) : isCurrent ? (
                      <svg
                        className="planning-book__wheel-svg"
                        viewBox="0 0 40 40"
                        role="presentation"
                      >
                        <circle cx="20" cy="20" r="17" />
                        <circle cx="20" cy="20" r="4" />
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(
                          (angle) => (
                            <line
                              key={angle}
                              x1="20"
                              y1="20"
                              x2="20"
                              y2="5"
                              transform={`rotate(${angle} 20 20)`}
                            />
                          )
                        )}
                      </svg>
                    ) : (
                      "•"
                    )}
                  </span>
                  <p>{step}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (!generatedSuggestion || !recommendation) {
      return (
        <div className="planning-book__empty-recommendation">
          <span aria-hidden="true">✦</span>
          <h3>Esta folha será escrita especialmente para o seu evento.</h3>
          <p>Volte ao planejamento e gere uma nova sugestão.</p>
        </div>
      );
    }

    return (
      <div className="planning-book__recommendation">
        <div className="planning-book__recommendation-opening">
          <span>{clientName.trim() ? `Planejamento de ${clientName.trim()}` : "Planejamento do evento"}</span>
          <h3>Uma estrutura pensada para receber bem.</h3>
          <p>
            Planejamos esta sugestão para {adults} {adults === 1 ? "adulto" : "adultos"}
            {olderChildren > 0 ? `, ${olderChildren} ${olderChildren === 1 ? "criança acima de 6 anos" : "crianças acima de 6 anos"}` : ""}
            {children > 0 ? ` e ${children} ${children === 1 ? "criança de até 6 anos" : "crianças de até 6 anos"}` : ""},
            com {duration} horas de atendimento.
          </p>
        </div>


        <section className="planning-book__recommendation-section">
          <span>Estrutura recomendada</span>
          <div className="planning-book__structure-hero">
            <div className="planning-book__structure-hero-count">
              <strong>{generatedSuggestion.carts.totalCarts}</strong>
              <span>
                {generatedSuggestion.carts.totalCarts === 1 ? "carrinho" : "carrinhos"}
              </span>
            </div>

            <div className="planning-book__structure-hero-copy">
              <h5>Estrutura recomendada</h5>
              <p>{recommendation.structure.summary}</p>
            </div>
          </div>

          <div className="planning-book__cart-allocation">
            {recommendation.structure.allocation.map((allocation) => (
              <button
                key={allocation.id}
                type="button"
                className="planning-book__cart-allocation-item"
                onClick={() => navigation.goToStation(allocation.id)}
                aria-label={`Abrir itens da estação de ${allocation.stationLabel}`}
              >
                <div className="planning-book__cart-allocation-copy">
                  <h5>Estação de {allocation.stationLabel}</h5>
                  <p>{allocation.reason}</p>
                  <small>{allocation.itemSummary}</small>
                </div>

                <div className="planning-book__cart-allocation-count">
                  <strong>{allocation.cartsRequired}</strong>
                  <span>
                    {allocation.cartsRequired === 1 ? "carrinho" : "carrinhos"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="planning-book__structure-support-note">
            {recommendation.structure.supportNote}
          </p>
        </section>

        <section className="planning-book__recommendation-section">
          <span>Equipe de atendimento</span>
          <h4>
            {generatedSuggestion.preparers}{" "}
            {generatedSuggestion.preparers === 1 ? "profissional" : "profissionais"}
            {generatedSuggestion.waiters.quantity > 0
              ? ` + ${generatedSuggestion.waiters.quantity} ${
                  generatedSuggestion.waiters.quantity === 1 ? "garçom" : "garçons"
                }`
              : ""}
          </h4>
          <p>{recommendation.team}</p>
        </section>

        <section className="planning-book__recommendation-section">
          <span>Serviços selecionados</span>

          <div className="planning-book__recommendation-tags">
            <em>{includeWaiters ? "✓ Garçons incluídos" : "— Sem garçons"}</em>
            <em>
              {includeDisposables
                ? "✓ Descartáveis incluídos"
                : "— Sem descartáveis"}
            </em>
            <em>
              {includeBeverages
                ? "✓ Bebidas em consignação"
                : "— Sem bebidas"}
            </em>
            <em>✓ {duration} horas de atendimento</em>
          </div>
        </section>

        <section className="planning-book__optional-groups">
          <span>Personalize as categorias</span>
          <p>
            Acrescente ou retire categorias do planejamento. A estrutura, o
            investimento e a visualização serão recalculados automaticamente.
          </p>
          <div>
            {stations.some((station) => station.id === "fried") ? (
              <button
                type="button"
                className="planning-book__optional-group-toggle is-active"
                onClick={() => handleRemoveOptionalGroup("fried")}
              >
                <span>✓ Petiscos</span>
                <small>Retirar categoria</small>
              </button>
            ) : (
              <button type="button" onClick={() => handleAddOptionalGroup("fried")}>
                <span>+ Petiscos</span>
                <small>Adicionar categoria</small>
              </button>
            )}

            {stations.some((station) => station.id === "hotSandwiches") ? (
              <button
                type="button"
                className="planning-book__optional-group-toggle is-active"
                onClick={() => handleRemoveOptionalGroup("hotSandwiches")}
              >
                <span>✓ Mini lanches e tortas</span>
                <small>Retirar categoria</small>
              </button>
            ) : (
              <button type="button" onClick={() => handleAddOptionalGroup("hotSandwiches")}>
                <span>+ Mini lanches e tortas</span>
                <small>Adicionar categoria</small>
              </button>
            )}

            {stations.some((station) => station.id === "desserts") ? (
              <button
                type="button"
                className="planning-book__optional-group-toggle is-active"
                onClick={() => handleRemoveOptionalGroup("desserts")}
              >
                <span>✓ Doces e bolos</span>
                <small>Retirar categoria</small>
              </button>
            ) : (
              <button type="button" onClick={() => handleAddOptionalGroup("desserts")}>
                <span>+ Doces e bolos</span>
                <small>Adicionar categoria</small>
              </button>
            )}

            {includeBeverages ? (
              <button
                type="button"
                className="planning-book__optional-group-toggle is-active"
                onClick={() => handleRemoveOptionalGroup("beverages")}
              >
                <span>✓ Bebidas em consignação</span>
                <small>Retirar categoria</small>
              </button>
            ) : (
              <button type="button" onClick={() => handleAddOptionalGroup("beverages")}>
                <span>+ Bebidas em consignação</span>
                <small>Adicionar categoria</small>
              </button>
            )}
          </div>
        </section>

        <p className="planning-book__recommendation-signature">
          Cada detalhe pensado para tornar o seu momento inesquecível.
        </p>

        <section className="planning-book__stations">
          <div className="planning-book__stations-heading">
            <span>Estações sugeridas</span>
            <p>Abra cada estação para conferir produtos e quantidades.</p>
          </div>

          <div className="planning-book__station-cards">
            {stations.map((station) => (
              <button
                key={station.id}
                type="button"
                className="planning-book__station-card"
                onClick={() => navigation.goToStation(station.id)}
              >
                <span>{station.title}</span>
                <strong>{station.items.length} itens</strong>
                <small>Ver o que está incluso →</small>
              </button>
            ))}
          </div>
        </section>

        <section className="planning-book__finalize-card">
          <span>Planejamento finalizado?</span>
          <h4>Confira o resumo completo e gere sua proposta.</h4>
          <p>Revise estrutura, cardápio, investimento, consignação e condições comerciais antes de salvar o PDF.</p>
          <button type="button" onClick={navigation.goToSummary}>
            Ir para o resumo final <span aria-hidden="true">→</span>
          </button>
        </section>

      </div>
    );
  }

  function renderStation() {
    if (!selectedStation) {
      return (
        <div className="planning-book__empty-recommendation">
          <h3>Selecione uma estação.</h3>
          <button type="button" onClick={navigation.goBack}>
            ← Voltar à sugestão
          </button>
        </div>
      );
    }

    const stationConsignmentEstimate = selectedStation.id === "beverages"
      ? selectedStation.items.reduce(
          (total, item) => total + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
          0
        )
      : 0;

    return (
      <div className="planning-book__station-sheet">
        <div className="planning-book__station-intro">
          <span className="planning-book__eyebrow">Detalhes da estação</span>
          <h2>{selectedStation.title}</h2>
          <p>{selectedStation.description}</p>
          <span className="planning-book__station-included-label">Itens incluídos na sugestão</span>
        </div>

        {selectedStation.id === "desserts" && (
          <div className="planning-book__client-structure-note">
            <strong>Estrutura necessária no local</strong>
            <span>O cliente deve disponibilizar mesa ou aparador, espaço adequado e responsáveis pela montagem e oferta dos itens aos convidados.</span>
          </div>
        )}

        {selectedStation.id === "beverages" && (
          <div className="planning-book__consignment-summary">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Estimativa em consignação</strong>
              <b>{formatCurrency(stationConsignmentEstimate)}</b>
              <p>
                Referência para as quantidades atuais caso todas as unidades sejam
                consumidas. Este valor não está incluído no investimento principal;
                a cobrança final será conforme o consumo real.
              </p>
            </div>
          </div>
        )}

        <div className="planning-book__station-items">
          {selectedStation.items.length > 0 ? (
            selectedStation.items.map((item) => (
              <div key={item.id} className="planning-book__station-item">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.commercialCategory}</span>
                </div>
                <b>{formatQuantity(item)}</b>
              </div>
            ))
          ) : (
            <p className="planning-book__station-empty">
              Os itens desta estação serão definidos na personalização.
            </p>
          )}
        </div>

        <button
          type="button"
          className="planning-book__primary-action"
          onClick={() => navigation.goToCustomization(selectedStation.id)}
        >
          Personalizar esta estação <span>→</span>
        </button>
      </div>
    );
  }

  function renderCustomization() {
    if (!selectedStation) {
      return (
        <div className="planning-book__empty-recommendation">
          <h3>Esta categoria não possui mais itens.</h3>
          <p>Ela foi retirada do planejamento. Volte à recomendação para acrescentá-la novamente ou escolher outra estação.</p>
          <button
            type="button"
            className="planning-book__primary-action planning-book__empty-return"
            onClick={() =>
              navigation.goTo(BOOK_SHEETS.SUGGESTION, {
                replace: true,
                direction: "backward",
              })
            }
          >
            <span>←</span> Voltar à recomendação
          </button>
        </div>
      );
    }

    const availableProducts = getProductsForStation(selectedStation.id);
    const selectedIds = new Set(selectedStation.items.map((item) => item.id));
    const productsToAdd = availableProducts.filter((item) => !selectedIds.has(item.id));
    const consignmentEstimate = selectedStation.id === "beverages"
      ? selectedStation.items.reduce(
          (total, item) => total + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
          0
        )
      : 0;

    const customizationGroups = selectedStation.id === "desserts"
      ? [
          {
            id: "sweets",
            title: "Doces — por unidade",
            description: "As quantidades são ajustadas em lotes de unidades.",
            items: selectedStation.items.filter((item) => item.operationalGroup === "sweets"),
          },
          {
            id: "cake",
            title: "Bolos — porções de 120 g",
            description: "Cada unidade do controle corresponde a uma porção de 120 g.",
            items: selectedStation.items.filter((item) => item.operationalGroup === "cake"),
          },
        ]
      : selectedStation.id === "hotSandwiches"
        ? [
            {
              id: "mini-lanches",
              title: "Mini lanches — por unidade",
              description: "X-Burguer, X-Salada, Hot dog e Carne louca.",
              items: selectedStation.items.filter((item) => item.priceUnit !== "portion150g"),
            },
            {
              id: "tortas",
              title: "Tortas — recheios em porções de 150 g",
              description: "Cada unidade do controle representa uma porção individual de 150 g.",
              items: selectedStation.items.filter((item) => item.priceUnit === "portion150g"),
            },
          ]
        : [
            {
              id: "all",
              title: null,
              description: null,
              items: selectedStation.items,
            },
          ];

    const productsToAddGroups = selectedStation.id === "desserts"
      ? [
          {
            id: "sweets",
            title: "Acrescentar doces",
            description: "Opções vendidas por unidade.",
            products: productsToAdd.filter((item) => item.operationalGroup === "sweets"),
          },
          {
            id: "cake",
            title: "Acrescentar bolos",
            description: "Sabores vendidos em porções de 120 g.",
            products: productsToAdd.filter((item) => item.operationalGroup === "cake"),
          },
        ]
      : selectedStation.id === "hotSandwiches"
        ? [
            {
              id: "mini-lanches",
              title: "Acrescentar mini lanches",
              description: "Opções servidas por unidade.",
              products: productsToAdd.filter((item) => item.priceUnit !== "portion150g"),
            },
            {
              id: "tortas",
              title: "Acrescentar tortas",
              description: "Escolha o recheio. Cada adição corresponde a uma porção de 150 g.",
              products: productsToAdd.filter((item) => item.priceUnit === "portion150g"),
            },
          ]
        : [{ id: "all", title: "Acrescentar item", description: null, products: productsToAdd }];

    return (
      <div className="planning-book__station-sheet planning-book__customization-sheet">
        <div className="planning-book__station-intro">
          <span className="planning-book__eyebrow">Personalizar estação</span>
          <h2>{selectedStation.title}</h2>
          <p>Altere quantidades, retire itens ou acrescente novas opções desta categoria.</p>
          <span className="planning-book__station-included-label">Composição atual</span>
        </div>

        {selectedStation.id === "hotSandwiches" && (
          <div className="planning-book__portion-guidance">
            <span aria-hidden="true">✦</span>
            <p><strong>Tortas:</strong> a referência recomendada é de aproximadamente 150 g por pessoa. Cada clique adiciona ou retira uma porção de 150 g.</p>
          </div>
        )}

        {selectedStation.id === "desserts" && selectedStation.items.some((item) => item.priceUnit === "portion120g") && (
          <div className="planning-book__portion-guidance">
            <span aria-hidden="true">✦</span>
            <p><strong>Bolos:</strong> a referência recomendada é de aproximadamente 120 g por pessoa. Cada clique adiciona ou retira uma porção de 120 g.</p>
          </div>
        )}

        {selectedStation.id === "beverages" && (
          <div className="planning-book__consignment-notice">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Bebidas em consignação</strong>
              <p>As quantidades podem ser ajustadas para o planejamento, mas o consumo de bebidas é cobrado separadamente e não compõe o investimento estimado abaixo.</p>
              <div className="planning-book__consignment-estimate">
                <span>Estimativa para as quantidades atuais</span>
                <b>{formatCurrency(consignmentEstimate)}</b>
                <small>Valor de referência caso todas as unidades sejam consumidas. A cobrança final será feita conforme o consumo real.</small>
              </div>
            </div>
          </div>
        )}

        <div className="planning-book__customization-groups">
          {customizationGroups
            .filter((group) => group.items.length > 0)
            .map((group) => (
            <section key={group.id} className="planning-book__customization-group">
              {group.title && (
                <div className="planning-book__customization-group-heading">
                  <strong>{group.title}</strong>
                  <span>{group.description}</span>
                </div>
              )}

              <div className="planning-book__customization-items">
                {group.items.map((item) => {
                    const step = Number(item.lotSize) || 1;
                    return (
                      <article key={item.id} className="planning-book__customization-item">
                        <div className="planning-book__customization-item-copy">
                          <strong>{item.name}</strong>
                          <span>{item.commercialCategory}</span>
                          {item.description && <em>{item.description}</em>}
                          <small>
                            {item.priceUnit === "portion150g"
                              ? "Cada acréscimo corresponde a uma porção de 150 g"
                              : item.priceUnit === "portion120g"
                                ? "Cada acréscimo corresponde a uma porção de 120 g"
                                : `Lote de ${step.toLocaleString("pt-BR")} unidades`}
                          </small>
                        </div>

                        <div className="planning-book__quantity-control">
                          <button
                            type="button"
                            aria-label={`Diminuir ${item.name}`}
                            onClick={() => handleItemQuantityChange(item.id, Number(item.quantity) - step)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            step={step}
                            value={item.quantity}
                            aria-label={`Quantidade de ${item.name}`}
                            onFocus={(event) => event.target.select()}
                            onChange={(event) => handleItemQuantityChange(item.id, event.target.value)}
                          />
                          <button
                            type="button"
                            aria-label={`Aumentar ${item.name}`}
                            onClick={() => handleItemQuantityChange(item.id, Number(item.quantity) + step)}
                          >
                            +
                          </button>
                        </div>

                        <div className="planning-book__customization-item-footer">
                          <b>{formatQuantity(item)}</b>
                          <button
                            type="button"
                            className="planning-book__remove-item"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Retirar item
                          </button>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>

        {productsToAddGroups.map((group) =>
          group.products.length > 0 ? (
            <section key={group.id} className="planning-book__add-products">
              <span>{group.title}</span>
              <p>{group.description || "Escolha outras opções disponíveis neste grupo."}</p>
              <div>
                {group.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product.id)}
                  >
                    <strong>{product.name}</strong>
                    {product.description && <span>{product.description}</span>}
                    <small>
                      {formatCurrency(product.unitPrice)}{" "}
                      {product.priceUnit === "portion150g"
                        ? "/ 150 g"
                        : product.priceUnit === "portion120g"
                          ? "/ 120 g"
                          : "/ un."}{" "}
                      · + Adicionar
                    </small>
                  </button>
                ))}
              </div>
            </section>
          ) : null
        )}

      </div>
    );
  }

  function renderSummary() {
    if (!generatedSuggestion) {
      return (
        <div className="planning-book__empty-recommendation">
          <h3>Gere uma recomendação antes de finalizar a proposta.</h3>
          <button type="button" onClick={navigation.goToSuggestion}>
            ← Voltar à recomendação
          </button>
        </div>
      );
    }

    const consignmentEstimate = getConsignmentEstimate(generatedSuggestion.items);
    const dessertStation = stations.find((station) => station.id === "desserts");

    return (
      <div className="planning-book__final-summary">
        <div className="planning-book__final-summary-intro">
          <span className="planning-book__eyebrow">Resumo final</span>
          <h2>Seu planejamento está pronto.</h2>
          <p>Revise os detalhes abaixo antes de solicitar a análise da nossa especialista.</p>
          {planningCode && <strong className="planning-book__planning-code">{planningCode}</strong>}
        </div>

        <section className="planning-book__final-event-grid">
          <div><span>Cliente</span><strong>{clientName.trim() || "Não informado"}</strong></div>
          <div><span>Evento</span><strong>{selectedEventData?.label || "Evento"}</strong></div>
          <div><span>Data</span><strong>{formatDate(eventDate)}</strong></div>
          <div><span>Convidados</span><strong>{realGuests} no total</strong><small>{adults} adultos{olderChildren > 0 ? ` + ${olderChildren} crianças 7+` : ""}{children > 0 ? ` + ${children} crianças 0–6` : ""}</small></div>
          <div><span>Duração</span><strong>{duration} horas</strong></div>
          <div><span>Estrutura</span><strong>{generatedSuggestion.carts.totalCarts} {generatedSuggestion.carts.totalCarts === 1 ? "carrinho" : "carrinhos"}</strong></div>
        </section>

        <section className="planning-book__final-section">
          <div className="planning-book__final-section-heading">
            <span>Composição do evento</span>
            <strong>{stations.length} {stations.length === 1 ? "categoria" : "categorias"}</strong>
          </div>
          <div className="planning-book__final-stations">
            {stations.map((station) => (
              <article key={station.id}>
                <h3>{getStationSummaryLabel(station)}</h3>
                <ul>
                  {station.items.map((item) => (
                    <li key={item.id}>
                      <span>{item.name}</span>
                      <strong>{formatSummaryQuantity(item)}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="planning-book__final-financial">
          <div>
            <span>Investimento contratado</span>
            <strong>{formatCurrency(generatedSuggestion.investment.total)}</strong>
            <small>Não inclui o consumo das bebidas em consignação.</small>
          </div>
          {consignmentEstimate > 0 && (
            <div className="planning-book__final-consignment">
              <span>Estimativa de consignação</span>
              <strong>{formatCurrency(consignmentEstimate)}</strong>
              <small>Cobrança posterior somente das unidades efetivamente consumidas.</small>
            </div>
          )}
        </section>

        <section className="planning-book__final-notes">
          {dessertStation && (
            <div><strong>Doces e bolos</strong><p>A Roda Festa entrega os itens. Mesa ou aparador, montagem e exposição ficam por conta do cliente.</p></div>
          )}
          <div><strong>Alimentos remanescentes</strong><p>Ao término do evento, todos os alimentos contratados que não tiverem sido consumidos serão entregues aos anfitriões da festa.</p></div>
          <div><strong>Energia elétrica</strong><p>Utilizamos tomadas 110V e 220V. A amperagem necessária será informada previamente e deverá ser providenciada pelo cliente.</p></div>
        </section>

        <details className="planning-book__final-terms">
          <summary>Condições comerciais e operacionais</summary>
          <div>
            <p><strong>Validade:</strong> {COMMERCIAL_TERMS.validity}.</p>
            <p><strong>Pagamento:</strong> {COMMERCIAL_TERMS.paymentMethod}. {COMMERCIAL_TERMS.reservation} {COMMERCIAL_TERMS.balance}</p>
            <p><strong>Consignação:</strong> {COMMERCIAL_TERMS.consignment}</p>
            <p><strong>Área de atendimento:</strong> {COMMERCIAL_TERMS.serviceArea}</p>
            {CANCELLATION_TERMS.map((term) => <p key={term}>{term}</p>)}
            {ELECTRICAL_TERMS.map((term) => <p key={term}>{term}</p>)}
          </div>
        </details>

        <div className="planning-book__final-actions">
          <button type="button" className="planning-book__final-action planning-book__final-action--secondary" onClick={handlePrintProposal}>
            Gerar planejamento em PDF
          </button>
          <button type="button" className="planning-book__final-action" onClick={handleRequestOfficialProposal} disabled={isClosingBook}>
            {isClosingBook ? "Finalizando planejamento..." : "Solicitar proposta oficial"} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    );
  }

  const isBriefing = navigation.currentSheet === BOOK_SHEETS.BRIEFING;

  const headerProps = {
    clientName,
    phone,
    eventDate,
    eventLabel: selectedEventData?.label ?? "Evento",
    adults,
    children,
    olderChildren,
    equivalentGuests,
    duration,
    includeWaiters,
    includeDisposables,
    includeBeverages,
    selectedMenuDetails,
  };

  function renderSheetHeader() {
    if (
      navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
      !isAnalyzing &&
      !isSuggestionRevealed
    ) {
      return null;
    }

    return (
      <header className="planning-book__summary-header">
        <span>
          {navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
            (isAnalyzing ? "Análise em andamento" : isSuggestionRevealed ? "Recomendação Roda Festa" : "")}
          {navigation.currentSheet === BOOK_SHEETS.STATION &&
            "Estação selecionada"}
          {navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION &&
            "Personalização"}
          {navigation.currentSheet === BOOK_SHEETS.SUMMARY &&
            "Proposta Roda Festa"}
          {navigation.currentSheet === BOOK_SHEETS.BRIEFING &&
            "Aguardando suas escolhas"}
        </span>

        <h2>
          {navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
            (isAnalyzing ? "Preparando seu evento" : isSuggestionRevealed ? "Nossa recomendação" : "")}
          {navigation.currentSheet === BOOK_SHEETS.STATION &&
            selectedStation?.title}
          {navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION &&
            "Seu cardápio"}
          {navigation.currentSheet === BOOK_SHEETS.SUMMARY &&
            "Resumo final"}
          {navigation.currentSheet === BOOK_SHEETS.BRIEFING &&
            "Seu planejamento"}
        </h2>
      </header>
    );
  }

  function renderDynamicSheet() {
    return (
      <>
        {renderSheetHeader()}

        <div className="planning-book__dynamic-sheet-content">
          {navigation.currentSheet === BOOK_SHEETS.BRIEFING && (
            <div className="planning-book__empty-recommendation">
              <span aria-hidden="true">✦</span>
              <h3>Esta folha será escrita especialmente para o seu evento.</h3>
              <p>
                Preencha as informações ao lado para receber uma recomendação
                inicial de estrutura, equipe, cardápio e investimento.
              </p>
            </div>
          )}

          {navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
            (isAnalyzing || isSuggestionRevealed ? renderSuggestion() : (
              <div className="planning-book__suggestion-closed" aria-hidden="true" />
            ))}

          {navigation.currentSheet === BOOK_SHEETS.STATION &&
            renderStation()}

          {navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION &&
            renderCustomization()}

          {navigation.currentSheet === BOOK_SHEETS.SUMMARY &&
            renderSummary()}
        </div>
      </>
    );
  }

  return (
    <main className={[
      "planning-book",
      showWelcome ? "planning-book--welcome" : "",
      isOpeningBook ? "planning-book--opening" : "",
      isClosingBook ? "planning-book--closing" : "",
      showCompleted ? "planning-book--completed" : "",
    ].filter(Boolean).join(" ")}>
      {showWelcome && (
        <section className="planning-welcome" aria-label="Abrir planejamento Roda Festa">
          <div className="planning-welcome__ambient" aria-hidden="true" />
          <form className="planning-welcome__book" onSubmit={handleOpenPlanningBook}>
            <div className="planning-welcome__spine" aria-hidden="true" />
            <div className="planning-welcome__cover">
              <div className="planning-welcome__ornament" aria-hidden="true">✦</div>
              <div className="planning-welcome__logo-crop">
                <img src={rodaFestaLogoCreme} alt="Roda Festa" />
              </div>
              <span className="planning-welcome__kicker">Gastronomia que encanta</span>
              <div className="planning-welcome__title">
                <h1><strong>Meu</strong><em>Planejamento</em></h1>
                <p>Toda grande festa começa com um bom planejamento.</p>
              </div>

              <div className="planning-welcome__fields">
                <label className={welcomeErrors.clientName ? "has-error" : ""}>
                  <span>Nome</span>
                  <input required aria-invalid={Boolean(welcomeErrors.clientName)} type="text" value={clientName} placeholder="Como podemos chamar você?" autoComplete="name" onChange={(event) => { setClientName(event.target.value); setWelcomeErrors((current) => ({ ...current, clientName: "" })); }} />
                  {welcomeErrors.clientName && <small>{welcomeErrors.clientName}</small>}
                </label>
                <label className={welcomeErrors.phone ? "has-error" : ""}>
                  <span>Telefone</span>
                  <input required aria-invalid={Boolean(welcomeErrors.phone)} type="tel" value={phone} placeholder="(00) 00000-0000" autoComplete="tel" onChange={(event) => { setPhone(event.target.value); setWelcomeErrors((current) => ({ ...current, phone: "" })); }} />
                  {welcomeErrors.phone && <small>{welcomeErrors.phone}</small>}
                </label>
                <label className={welcomeErrors.eventDate ? "has-error" : ""}>
                  <span>Data do evento</span>
                  <input required aria-invalid={Boolean(welcomeErrors.eventDate)} type="date" min={minimumEventDate} value={eventDate} onChange={(event) => { setEventDate(event.target.value); setWelcomeErrors((current) => ({ ...current, eventDate: "" })); }} />
                  {welcomeErrors.eventDate && <small>{welcomeErrors.eventDate}</small>}
                </label>
              </div>

              <button type="submit" className="planning-welcome__action" disabled={isOpeningBook}>
                <span>{isOpeningBook ? "Abrindo seu planejamento" : "Iniciar meu planejamento"}</span>
                <b aria-hidden="true">{isOpeningBook ? "•••" : "→"}</b>
              </button>
              <div className="planning-welcome__wheel" aria-hidden="true">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="43" />
                  <circle cx="50" cy="50" r="9" />
                  {[0,45,90,135].map((angle) => <line key={angle} x1="50" y1="14" x2="50" y2="86" transform={`rotate(${angle} 50 50)`} />)}
                </svg>
              </div>
              <small className="planning-welcome__edition">Uma experiência criada pela Roda Festa</small>
            </div>
          </form>
        </section>
      )}

      {showCompleted && generatedSuggestion && (
        <section className="planning-completed" aria-label="Planejamento concluído">
          <div className="planning-completed__card">
            <div className="planning-completed__logo-crop">
              <img src={rodaFestaLogoCreme} alt="Roda Festa" />
            </div>
            <span className="planning-completed__eyebrow">Planejamento enviado para revisão</span>
            <h1>Seu planejamento foi concluído.</h1>
            <p>Nossa especialista revisará todas as informações antes de preparar sua proposta oficial.</p>

            <div className="planning-completed__code">
              <span>Código do planejamento</span>
              <strong>{planningCode}</strong>
            </div>

            <div className="planning-completed__summary">
              <div><span>Cliente</span><strong>{clientName.trim()}</strong></div>
              <div><span>Evento</span><strong>{selectedEventData?.label || "Evento"}</strong></div>
              <div><span>Data</span><strong>{formatDate(eventDate)}</strong></div>
              <div><span>Convidados</span><strong>{realGuests}</strong></div>
              <div><span>Investimento estimado</span><strong>{formatCurrency(generatedSuggestion.investment.total)}</strong></div>
              <div><span>Consignação estimada</span><strong>{getConsignmentEstimate(generatedSuggestion.items) > 0 ? formatCurrency(getConsignmentEstimate(generatedSuggestion.items)) : "Sem consignação"}</strong></div>
            </div>

            <div className="planning-completed__actions">
              <button type="button" className="planning-completed__secondary" onClick={handlePrintProposal}>
                Baixar planejamento em PDF
              </button>
              <button type="button" className="planning-completed__primary" onClick={handleOpenWhatsApp}>
                Enviar pelo WhatsApp <span aria-hidden="true">→</span>
              </button>
            </div>

            <small>Guarde o código acima para acompanhar seu atendimento.</small>
          </div>
        </section>
      )}

      <button
        type="button"
        className="planning-book__whatsapp-float"
        onClick={handleOpenWhatsApp}
        aria-label="Fale com uma especialista da Roda Festa pelo WhatsApp"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 4.3A11.5 11.5 0 0 0 6.2 21.8L4.8 27l5.3-1.4A11.5 11.5 0 1 0 16 4.3Zm0 20.9c-2 0-3.9-.6-5.5-1.7l-.4-.2-3.1.8.8-3-.2-.4A9.3 9.3 0 1 1 16 25.2Zm5.1-7c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-1.8-.9-3-1.7-4.2-3.8-.3-.5.3-.5.9-1.7.1-.2 0-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9 0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.8 5.2.8.3 1.4.6 1.9.7.8.3 1.6.2 2.2.1.7-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z" />
        </svg>
        <span><strong>Fale com a especialista</strong><small>Atendimento pelo WhatsApp</small></span>
      </button>

      <div className="planning-book__app-signature" aria-label="Roda Festa — Planejamento inteligente para eventos">
        <strong>RODA FESTA</strong>
        <span>Planejamento inteligente para eventos</span>
      </div>

      <section
        className={[
          "planning-book__book",
          `planning-book__book--sheet-${navigation.currentSheet}`,
          `planning-book__book--turn-${navigation.direction}`,
        ].join(" ")}
      >
        <Book
          currentSheet={navigation.currentSheet}
          direction={navigation.direction}
        >
          <article
            className={[
              "planning-book__questions",
              !isBriefing ? "planning-book__questions--context" : "",
              navigation.currentSheet === BOOK_SHEETS.SUGGESTION && isSuggestionRevealed
                ? "planning-book__questions--recommendation-open"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="planning-book__questions-scroll">
              {isBriefing ? (
                renderBriefing()
              ) : isAnalyzing ? (
                <div
                  className="planning-book__context-waiting"
                  aria-label="Aguardando a conclusão da sugestão"
                />
              ) : (
                <div className="planning-book__context-stack">
                  <BookHeader
                    {...headerProps}
                    onEdit={navigation.goToBriefing}
                    onRestart={handleRestartPlanning}
                  />

                  {navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
                    Boolean(generatedSuggestion) && (
                      <div className="planning-book__reveal-slot">
                        <button
                          type="button"
                          className={[
                            "book-button",
                            "book-button--primary",
                            "planning-book__reveal-suggestion",
                            isSuggestionRevealed ? "is-hidden" : "",
                          ].filter(Boolean).join(" ")}
                          onClick={handleRevealSuggestion}
                          disabled={isOpeningRecommendation || isSuggestionRevealed}
                          aria-hidden={isSuggestionRevealed ? "true" : undefined}
                          tabIndex={isSuggestionRevealed ? -1 : 0}
                        >
                          {isOpeningRecommendation ? (
                            <>
                              <span className="planning-book__button-wheel" aria-hidden="true" />
                              Abrindo recomendação...
                            </>
                          ) : (
                            <>
                              Conhecer minha recomendação
                              <span aria-hidden="true">→</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                  <div className="planning-book__context-bottom">
                    <BookProgress
                      currentSheet={
                        navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
                        !isSuggestionRevealed
                          ? BOOK_SHEETS.BRIEFING
                          : navigation.currentSheet
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {isBriefing && (
              <footer className="planning-book__questions-footer">
                {!canGenerateSuggestion && !isAnalyzing && (
                  <p className="planning-book__generate-hint">
                    Selecione a ocasião e informe ao menos um convidado.
                  </p>
                )}

                <button
                  type="button"
                  className="planning-book__generate"
                  disabled={!canGenerateSuggestion}
                  onClick={handleGenerateSuggestion}
                >
                  <span>
                    {isAnalyzing
                      ? "Preparando a recomendação Roda Festa"
                      : "Gerar recomendação Roda Festa para meu evento"}
                  </span>
                  <span aria-hidden="true">{isAnalyzing ? "•••" : "→"}</span>
                </button>
              </footer>
            )}
          </article>

          <article ref={summaryPageRef} className="planning-book__summary">
            <BookFlip
              direction={navigation.direction}
              transitionKey={navigation.transitionKey + revealTransitionKey}
            >
              {renderDynamicSheet()}
            </BookFlip>

            {navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION &&
              generatedSuggestion &&
              !isAnalyzing && (
                <div className="planning-book__customization-docked-action">
                  <button
                    type="button"
                    className="planning-book__primary-action"
                    onClick={navigation.goBack}
                  >
                    <span>←</span> Concluir personalização
                  </button>
                </div>
              )}

            {generatedSuggestion && !isAnalyzing && !isBriefing &&
              navigation.currentSheet !== BOOK_SHEETS.SUMMARY &&
              (navigation.currentSheet !== BOOK_SHEETS.SUGGESTION || isSuggestionRevealed) && (
              <div className="planning-book__investment-footer">
                <div className="planning-book__recommendation-investment">
                  <span>Investimento inicial estimado</span>
                  <strong>
                    {formatCurrency(generatedSuggestion.investment.total)}
                  </strong>
                  <small>
                    {selectedStation?.id === "beverages"
                      ? "Bebidas são cobradas por consumo, em consignação, e não estão incluídas neste investimento."
                      : "Valor atualizado conforme a personalização do cardápio e dos serviços."}
                  </small>
                </div>
              </div>
            )}

            {!isAnalyzing &&
              (navigation.currentSheet !== BOOK_SHEETS.SUGGESTION || isSuggestionRevealed) && (
              <BookFooter
                currentSheet={navigation.currentSheet}
                canGoBack={navigation.canGoBack}
                onBack={navigation.goBack}
                onRecommendationHome={navigation.goToSuggestion}
                onSummary={navigation.goToSummary}
              />
            )}
          </article>
        </Book>

        <aside
          ref={scenePageRef}
          className={[
            "planning-book__scene",
            `planning-book__scene--${selectedEvent || "neutral"}`,
            isAnalyzing ? "planning-book__scene--analyzing" : "",
            canShowScene ? "planning-book__scene--ready" : "",
            canShowScene
              ? `planning-book__scene--carts-${generatedSuggestion?.carts?.totalCarts ?? sceneStations.length}`
              : "",
            canShowScene && sceneDeliveredItems.length > 0
              ? "planning-book__scene--has-desserts"
              : "",
            sceneNotice ? "planning-book__scene--updated" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="planning-book__event-scene" aria-hidden={!canShowScene}>
            {canShowScene ? (
              <SceneAssetComposition stations={stations} />
            ) : (
              <div className="planning-book__scene-placeholder">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {!generatedSuggestion && !isAnalyzing && (
            <div className="planning-book__scene-brandmark" aria-hidden="true">
              <img src={rodaFestaLogo} alt="" />
            </div>
          )}

          <div className="planning-book__scene-overlay">
            <span>
              {isAnalyzing
                ? "Construindo a experiência"
                : canShowScene
                  ? "Visualização das suas escolhas"
                  : "Visualização do planejamento"}
            </span>

            <h2>
              {isAnalyzing
                ? analysisStep < 2
                  ? "Entendendo o seu evento..."
                  : analysisStep < 4
                    ? "Dimensionando a estrutura..."
                    : analysisStep < 6
                      ? "Montando sua recomendação..."
                      : "Últimos detalhes..."
                : canShowScene
                  ? "Sua festa ganha vida!"
                  : "Aqui, sua festa começará a ganhar vida."}
            </h2>

            <p>
              {canShowScene
                ? "Esta é a composição visual das escolhas feitas no seu planejamento."
                : "Conforme você responde, transformamos suas escolhas em uma primeira composição para o evento."}
            </p>

            {canShowScene && (
              <>
                <div className="planning-book__scene-selections" aria-label="Escolhas representadas na visualização">
                  <div className="planning-book__scene-selections-heading">
                    <span>Estrutura Roda Festa</span>
                    <small>
                      {generatedSuggestion?.carts?.totalCarts ?? sceneStations.length}
                      {" "}
                      {(generatedSuggestion?.carts?.totalCarts ?? sceneStations.length) === 1
                        ? "carrinho"
                        : "carrinhos"}
                    </small>
                  </div>

                  <div className="planning-book__scene-selection-list">
                    {sceneStations.map((station) => (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => navigation.goToStation(station.id)}
                      >
                        <span>{station.title.replace("Estação de ", "")}</span>
                        <small>Carrinho incluso</small>
                      </button>
                    ))}
                  </div>

                  {sceneDeliveredItems.length > 0 && (
                    <button
                      type="button"
                      className="planning-book__scene-delivery"
                      onClick={() => navigation.goToStation("desserts")}
                    >
                      <span aria-hidden="true">✦</span>
                      <p>
                        <strong>Itens entregues separadamente.</strong>{" "}
                        Doces e bolo são entregues pela Roda Festa; mesa, montagem e exposição ficam por conta do cliente.
                      </p>
                    </button>
                  )}
                </div>

                <div className="planning-book__scene-guidance">
                  <span aria-hidden="true">✦</span>
                  <p>Explore a composição visual. Para alterar itens e quantidades, use a página ao lado.</p>
                </div>

                {sceneNotice && (
                  <div className="planning-book__scene-notice" role="status">
                    <span aria-hidden="true">✓</span>
                    {sceneNotice}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </section>

      {generatedSuggestion && (
        <article className="planning-book__print-proposal">
          <header className="proposal-print__cover">
            <img src={rodaFestaLogo} alt="Roda Festa" />
            <p>Proposta comercial</p>
            <h1>{selectedEventData?.label || "Evento"}</h1>
            <h2>{clientName.trim() || "Cliente"}</h2>
            <div>
              <span>{formatDate(eventDate)}</span>
              <span>{adults} adultos{children > 0 ? ` • ${children} crianças` : ""}</span>
              <span>{duration} horas</span>
            </div>
          </header>

          <section className="proposal-print__page">
            <div className="proposal-print__brandline"><strong>RODA FESTA</strong><span>Gastronomia que encanta</span></div>
            <h2>Resumo do evento</h2>
            <div className="proposal-print__facts">
              <div><span>Cliente</span><strong>{clientName.trim() || "Não informado"}</strong></div>
              <div><span>Telefone</span><strong>{phone || "Não informado"}</strong></div>
              <div><span>Data</span><strong>{formatDate(eventDate)}</strong></div>
              <div><span>Evento</span><strong>{selectedEventData?.label || "Evento"}</strong></div>
              <div><span>Convidados</span><strong>{adults} adultos{children > 0 ? ` e ${children} crianças` : ""}</strong></div>
              <div><span>Estrutura</span><strong>{generatedSuggestion.carts.totalCarts} {generatedSuggestion.carts.totalCarts === 1 ? "carrinho" : "carrinhos"}</strong></div>
            </div>
            <h3>Cardápio e quantidades</h3>
            {stations.map((station) => (
              <div key={station.id} className="proposal-print__station">
                <h4>{getStationSummaryLabel(station)}</h4>
                {station.items.map((item) => (
                  <div key={item.id}><span>{item.name}</span><strong>{formatSummaryQuantity(item)}</strong></div>
                ))}
              </div>
            ))}
          </section>

          <section className="proposal-print__page proposal-print__page--closing">
            <div className="proposal-print__brandline"><strong>RODA FESTA</strong><span>Proposta comercial</span></div>
            <h2>Investimento e condições</h2>
            <div className="proposal-print__financial-grid proposal-print__financial-grid--with-consignment">
              <div className="proposal-print__investment">
                <span>Investimento contratado</span>
                <strong>{formatCurrency(generatedSuggestion.investment.total)}</strong>
                <small>Bebidas em consignação não estão incluídas neste valor.</small>
              </div>
              <div className={`proposal-print__consignment ${getConsignmentEstimate(generatedSuggestion.items) > 0 ? "" : "proposal-print__consignment--empty"}`.trim()}>
                <span>Estimativa de consignação</span>
                {getConsignmentEstimate(generatedSuggestion.items) > 0 ? (
                  <>
                    <strong>{formatCurrency(getConsignmentEstimate(generatedSuggestion.items))}</strong>
                    <p>Cobrança posterior apenas das unidades efetivamente consumidas.</p>
                  </>
                ) : (
                  <>
                    <strong>Sem bebidas</strong>
                    <p>Este planejamento não possui bebidas em consignação.</p>
                  </>
                )}
              </div>
            </div>
            <div className="proposal-print__terms">
              <h3>Condições comerciais</h3>
              <p><strong>Validade:</strong> 5 dias.</p>
              <p><strong>Pagamento:</strong> Pix ou dinheiro. 50% na contratação e 50% até 24 horas antes do evento.</p>
              <p><strong>Cancelamento:</strong> com até 10 dias, cobrança de 50%; com até 3 dias, cobrança integral.</p>
              <p><strong>Alteração de data:</strong> com até 5 dias, taxa de 50%, sujeita à disponibilidade.</p>
              <p><strong>Área incluída:</strong> apenas Tupã.</p>
              <h3>Condições operacionais</h3>
              {ELECTRICAL_TERMS.map((term) => <p key={term}>{term}</p>)}
              <p>Ao término do evento, todos os alimentos contratados e não consumidos serão entregues aos anfitriões.</p>
              {stations.some((station) => station.id === "desserts") && (
                <p>Para doces e bolos, o cliente deverá disponibilizar mesa ou aparador e responsabilizar-se pela montagem e exposição.</p>
              )}
            </div>
            <footer className="proposal-print__footer">
              <div><strong>Roda Festa</strong><span>{COMMERCIAL_TERMS.contact}</span><span>{COMMERCIAL_TERMS.instagram}</span></div>
              <p>Agradecemos a oportunidade de fazer parte deste momento especial.</p>
            </footer>
          </section>
        </article>
      )}
          {pendingProductAddition && (
        <div className="planning-book__choice-modal" role="dialog" aria-modal="true" aria-labelledby="choice-modal-title">
          <div className="planning-book__choice-modal-card">
            <span className="planning-book__eyebrow">Adicionar novo sabor</span>
            <h3 id="choice-modal-title">{pendingProductAddition.product.name}</h3>
            <p>
              A quantidade recomendada para <strong>{pendingProductAddition.product.commercialCategory}</strong> já foi atingida.
              Como deseja incluir este novo item?
            </p>

            <button type="button" className="planning-book__choice-option" onClick={redistributeWithPendingProduct}>
              <strong>Redistribuir a quantidade recomendada</strong>
              <span>Manter o total da categoria e dividir novamente entre todos os sabores.</span>
            </button>

            <div className="planning-book__choice-extra">
              <strong>Acrescentar além da recomendação</strong>
              <span>Informe a quantidade adicional. O campo começa com o lote mínimo deste item.</span>
              <input
                type="number"
                min={pendingProductAddition.product.lotSize || 1}
                step={pendingProductAddition.product.lotSize || 1}
                value={pendingProductAddition.extraQuantity}
                onChange={(event) => setPendingProductAddition((current) => ({
                  ...current,
                  extraQuantity: event.target.value,
                }))}
              />
              <button
                type="button"
                onClick={() => confirmProductAddition(
                  pendingProductAddition.product,
                  pendingProductAddition.extraQuantity
                )}
              >
                Acrescentar esta quantidade
              </button>
            </div>

            <button type="button" className="planning-book__choice-cancel" onClick={() => setPendingProductAddition(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

</main>
  );
}
