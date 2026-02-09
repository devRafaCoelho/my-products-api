/**
 * Palavras-chave por categoria (ordem de verificação: primeira que bater vence).
 * Usado para inferir category a partir do nome do produto ao cadastrar via QR/nota fiscal.
 */
const PRODUCT_CATEGORY_KEYWORDS = {
  Limpeza: [
    "detergente",
    "det ",
    "det.",
    "sabão em pó",
    "sabao em po",
    "água sanitária",
    "agua sanitaria",
    "alvejante",
    "desinfetante",
    "multiuso",
    "limpa-vidros",
    "limpa vidros",
    "limp ",
    "limpa ",
    "álcool",
    "alcool",
    "alc ",
    "amaciante",
    "amac ",
    "esponja",
    "palha de aço",
    "palha de aco",
    "saco de lixo",
    "saco l ",
    "vassoura",
    "rodo",
    "balde",
    "sabão líquido",
    "sabao liquido",
    "cloro",
    "limpador",
    "desengordurante",
    "sabão em barra",
    "sabao em barra",
  ],
  Higiene: [
    "sabonete",
    "sab niv",
    "sab l ",
    "shampoo",
    "condicionador",
    "creme dental",
    "cr dent",
    "pasta de dente",
    "escova de dente",
    "escova",
    "fio dental",
    "enxaguante",
    "papel higiênico",
    "pap hig",
    "papel higienico",
    "pap toa",
    "lenço",
    "lenco",
    "desodorante",
    "deso ",
    "creme de barbear",
    "lâmina",
    "lamina",
    "absorvente",
    "fralda",
    "hidratante",
    "protetor solar",
    "cotonete",
    "algodão",
    "algodao",
  ],
  Bebidas: [
    "refrigerante",
    "cerveja",
    "cerv ",
    "suco",
    "néctar",
    "nectar",
    "água mineral",
    "agua mineral",
    "agu min",
    "água de coco",
    "agua de coco",
    "leite",
    "café",
    "cafe",
    "caf ",
    "chá",
    "cha",
    "vinho",
    "energético",
    "energetico",
    "bebida",
    "isotônico",
    "isotonico",
    "soda",
    "limonada",
  ],
  Alimentos: [
    "arroz",
    "feijão",
    "feijao",
    "feija",
    "óleo",
    "oleo",
    "açúcar",
    "acucar",
    "sal",
    "macarrão",
    "macarrao",
    "massa",
    "mas ",
    "massa ",
    "farinha",
    "farinh",
    "molho de tomate",
    "molho",
    "mol t ",
    "mol ",
    "leite condensado",
    "creme de leite",
    "cr lte",
    "carne",
    "frango",
    "peixe",
    "file ",
    "filé",
    "file",
    "ovo",
    "ovos",
    "pão",
    "pao ",
    "pao",
    "manteiga",
    "manteig",
    "margarina",
    "queijo",
    "qjo ",
    "presunto",
    "mortadela",
    "salsicha",
    "sals ",
    "iogurte",
    "iog ",
    "cereal",
    "biscoito",
    "bisc ",
    "bolacha",
    "chocolate",
    "achocolatado",
    "azeite",
    "azeit",
    "vinagre",
    "vinag",
    "maionese",
    "ketchup",
    "mostarda",
    "tempero",
    "temp ",
    "caldo",
    "sopa",
    "lasanha",
    "pizza",
    "hambúrguer",
    "hamburguer",
    "nugget",
    "batata",
    "mandioca",
    "banana",
    "maçã",
    "maca",
    "laranja",
    "tomate",
    "tomat",
    "cebola",
    "cebolinh",
    "alho",
    "alface",
    "brocol",
    "brócolis",
    "brocolis",
    "coentro",
    "coentr",
    "salsa",
    "manjericão",
    "manjeric",
    "oregano",
    "oregan",
    "cominho",
    "cominh",
    "canela",
    "açafrão",
    "acafr",
    "ext tom",
    "granola",
    "goma",
    "lentilha",
    "lentilh",
    "grão de bico",
    "grao bico",
    "grao ",
    "lte ",
    "verduras",
    "legumes",
    "abacaxi",
  ],
};

const CATEGORY_ORDER = ["Limpeza", "Higiene", "Bebidas", "Alimentos"];

/**
 * Normaliza string para comparação: trim, minúsculas, remove acentos, colapsa espaços.
 */
function normalizeForMatch(str) {
  if (str == null || typeof str !== "string") return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Dado o nome do produto, retorna o nome da categoria do banco (Limpeza, Higiene, Bebidas, Alimentos ou Outros).
 */
function getCategoryNameForProduct(productName) {
  const normalized = normalizeForMatch(productName);
  if (!normalized) return "Outros";

  for (const categoryName of CATEGORY_ORDER) {
    const keywords = PRODUCT_CATEGORY_KEYWORDS[categoryName];
    if (!keywords) continue;
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeForMatch(keyword);
      if (normalizedKeyword && normalized.includes(normalizedKeyword)) {
        return categoryName;
      }
    }
  }

  return "Outros";
}

/**
 * Capítulos NCM (2 primeiros dígitos) que correspondem a cada categoria.
 * Baseado na Nomenclatura Comum do Mercosul (SEFAZ).
 * Ordem de verificação: Bebidas e Limpeza/Higiene primeiro (mais específicos), depois Alimentos.
 */
const NCM_CHAPTER_TO_CATEGORY = {
  // Bebidas (cap. 22)
  22: "Bebidas",
  // Limpeza (sabões, agentes de superfície, preparações para lavar - cap. 34)
  34: "Limpeza",
  // Higiene (perfumaria, cosméticos, preparações para higiene - cap. 33)
  33: "Higiene",
  // Alimentos: reino animal (01-05), vegetal e preparações (06-21), resíduos alimentares (23)
  1: "Alimentos",
  2: "Alimentos",
  3: "Alimentos",
  4: "Alimentos",
  5: "Alimentos",
  6: "Alimentos",
  7: "Alimentos",
  8: "Alimentos",
  9: "Alimentos",
  10: "Alimentos",
  11: "Alimentos",
  12: "Alimentos",
  13: "Alimentos",
  14: "Alimentos",
  15: "Alimentos",
  16: "Alimentos",
  17: "Alimentos",
  18: "Alimentos",
  19: "Alimentos",
  20: "Alimentos",
  21: "Alimentos",
  23: "Alimentos",
};

/**
 * Dado o código NCM (2 ou 8 dígitos) do produto no XML da SEFAZ, retorna o nome da categoria
 * ou null se não houver mapeamento (usa-se então getCategoryNameForProduct no nome).
 */
function getCategoryNameFromNCM(ncm) {
  if (ncm == null || ncm === "") return null;
  const str = String(ncm).trim();
  if (str.length < 2) return null;
  const chapter = parseInt(str.substring(0, 2), 10);
  if (Number.isNaN(chapter)) return null;
  return NCM_CHAPTER_TO_CATEGORY[chapter] || null;
}

module.exports = {
  getCategoryNameForProduct,
  getCategoryNameFromNCM,
  PRODUCT_CATEGORY_KEYWORDS,
  CATEGORY_ORDER,
};
