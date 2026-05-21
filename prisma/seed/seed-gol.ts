import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VEICULO_ID = "cmpdb45ej0001l104svyb8f6t";

const parseNext = (str: string) => {
  if (!str) return { nextKm: null, observations: null };
  const match = str.match(/^(\d+)(.*)$/);
  if (match) {
    const km = parseInt(match[1], 10);
    const obs = match[2].trim() || null;
    return { nextKm: km, observations: obs };
  }
  return { nextKm: null, observations: str };
};

const parseCost = (str: string) => {
  if (!str) return null;
  const clean = str.replace('R$', '').replace('.', '').replace(',', '.').trim();
  return parseFloat(clean) || null;
};

// [Data, KM, Descrição, Próxima(Texto), Valor, Categoria]
const rawRecords: Array<[string, number, string, string, string, string]> = [
  // ── Arrefecimento ──
  ["2020-03-06", 120000, "TODO ARREFECIMENTO E LIMPEZA", "", "375,90", "Arrefecimento"],
  ["2020-03-13", 120000, "troca do radiador", "", "640,43", "Arrefecimento"],
  ["2020-03-13", 120000, "troca do cavalete água", "", "208,00", "Arrefecimento"],
  ["2021-07-15", 134000, "troca liquido", "", "", "Arrefecimento"],
  ["2022-06-01", 140200, "troca líquido", "170000 a trocar em outra manutencao", "", "Arrefecimento"],
  ["2022-06-01", 140200, "carcaça válvula termostática e cavalete de agua", "", "", "Arrefecimento"],
  ["2024-01-14", 157500, "compra peça cavalete completo com válvula termoestática original", "", "336,00", "Arrefecimento"],
  ["2024-01-29", 157500, "5L água desmineralizada 4L paraflu", "", "142,00", "Arrefecimento"],
  ["2024-02-01", 157500, "troca do líquido arrefecimento", "180000", "", "Arrefecimento"],
  ["2024-07-17", 166500, "bomba água original discautol", "280000", "299,61", "Arrefecimento"],
  ["2024-07-08", 166500, "paraflu 4l", "180000", "96,00", "Arrefecimento"],

  // ── Suspensão e Pneus ──
  ["2020-03-13", 120000, "troca bandejas frente", "", "", "Suspensão e Pneus"],
  ["2020-10-29", 126000, "alinhamento 3d", "", "", "Suspensão e Pneus"],
  ["2022-03-04", 139000, "troca das duas da bandeja e barra axial esq", "", "", "Suspensão e Pneus"],
  ["2022-03-04", 139000, "Troca 4 pneus Dunlop rm800 195 60 15", "", "2.750,00", "Suspensão e Pneus"],
  ["2022-09-23", 142000, "troca pivô lado esquerdo 135,00", "", "135,00", "Suspensão e Pneus"],
  ["2023-01-24", 147000, "alinhamento 3d", "", "75,00", "Suspensão e Pneus"],
  ["2023-12-15", 153000, "alinhamento 3d", "159000 feito", "110,00", "Suspensão e Pneus"],
  ["2024-02-02", 157500, "alinhamento 3d+ balanceamento", "164000 feito", "140,00", "Suspensão e Pneus"],
  ["2024-01-30", 157500, "Bieleta Par de Disco 2 Pivor bandeija 2 Bucha intermediario 2 Kit rolamento rodas traseira Fluido freio", "", "", "Suspensão e Pneus"],
  ["2024-03-01", 158000, "Adaptação dianteira reboque - Adão funilaria", "", "350,00", "Suspensão e Pneus"],
  ["2024-09-20", 168000, "alinhamento 3d", "178000", "95,00", "Suspensão e Pneus"],

  // ── Histórico Geral (Motor, Óleo, Filtros, etc) ──
  ["2019-06-08", 111500, "correia trocada - todo conjunto", "", "335,00", "Histórico"],
  ["2020-03-06", 120000, "troca filtro óleo, gasolina e ar", "", "", "Histórico"],
  ["2021-07-15", 134000, "óleo", "", "370,75", "Histórico"],
  ["2022-06-01", 140200, "óleo mobil", "148000 trocado", "", "Histórico"],
  ["2022-06-01", 140200, "retífica cabeçote", "", "", "Histórico"],
  ["2022-06-01", 140200, "troca bomba de óleo e interruptor", "", "", "Histórico"],
  ["2022-06-01", 140200, "troca filtro óleo, gasolina e ar", "156000 trocado", "", "Histórico"],
  ["2022-06-01", 140200, "troca somente correia", "181500", "", "Histórico"],
  ["2022-06-01", 140200, "troca velas Bosh", "160000 trocado", "", "Histórico"],
  ["2022-11-07", 143100, "troca tensor e da correia dentada 165.00 peças e 120 MO", "190000", "285,00", "Histórico"],
  ["2023-02-24", 148000, "troca de óleo 160 + 60MO", "156000 trocado", "220,00", "Histórico"],
  ["2023-04-16", 148000, "análise do módulo de injeção", "", "400,00", "Histórico"],
  ["2023-05-08", 148000, "Diagnostico modulo", "", "150,00", "Histórico"],
  ["2023-05-08", 148000, "correia dentada compra ainda não trocou", "", "200,00", "Histórico"],
  ["2023-05-30", 149900, "retifica motor, troca do virabrequim, mancais e bronzina, troca da engrenagem do virabrequim", "", "3.076,00", "Histórico"],
  ["2023-05-30", 149900, "troca da embreagem", "", "", "Histórico"],
  ["2023-05-30", 149900, "troca da correia dentada e tensor", "200000", "", "Histórico"],
  ["2023-05-30", 149000, "troca de óleo e filtro de óleo", "157000 trocado", "", "Histórico"],
  ["2023-05-30", 149000, "peças: engrenagem, embreagem, oleo", "", "840,00", "Histórico"],
  ["2023-05-30", 149000, "trocar filtros de cabine, gasolina e oleo", "157000 trocado", "", "Histórico"],
  ["2024-01-03", 156600, "Jogo de vela NGK", "180000", "110,00", "Histórico"],
  ["2024-01-03", 156600, "Cabo de vela NGK", "180000", "230,00", "Histórico"],
  ["2024-01-03", 156600, "Bomba de combustível", "", "380,00", "Histórico"],
  ["2024-01-03", 156600, "Limpeza bicos", "180000", "100,00", "Histórico"],
  ["2024-01-03", 156600, "MO Mec Kita", "", "450,00", "Histórico"],
  ["2024-01-05", 156600, "Sonda Lambda 2", "", "0,00", "Histórico"],
  ["2024-01-14", 156600, "Compra peça: Kit revisão 6L óleo 5w40 - 502 1 filtro óleo 1 filtro combust 1 bujão 1 filtro ar", "", "376,00", "Histórico"],
  ["2024-01-31", 157500, "óleo cambio plug sensor temperatura correia 6pk e 3pk (ar e acessorios)", "", "2.560,00", "Histórico"],
  ["2024-01-31", 157500, "Troca óleo", "163500 trocado", "", "Histórico"],
  ["2024-01-31", 157500, "Filtro de gasolina, óleo", "169500 ok", "", "Histórico"],
  ["2024-04-12", 165303, "troca de óleo 189,00 óleo + 80 MO troca", "173000 ok", "269,00", "Histórico"],
  ["2024-05-09", 165500, "Troca sensor de detonação", "", "90,00", "Histórico"],
  ["2024-05-09", 165500, "Troca antichama + MO troca sensor rotação", "185500", "200,00", "Histórico"],
  ["2024-05-20", 166208, "Sensor de detonação ainda com mensagem de erro Levei na Santi - feito reparo no plug do sensor de detonação reparo no coletor - flauta - oring injeção", "", "450,00", "Histórico"],
  ["2024-06-17", 166308, "Diagnóstico compressão", "", "410,00", "Histórico"],
  ["2024-07-02", 166400, "óleo nao trocado", "", "199,00", "Histórico"],
  ["2024-07-23", 166500, "oleo priemiros 1k", "167500 - trocado", "150,00", "Histórico"],
  ["2024-07-23", 166500, "guia vareta oleo e outras peças", "", "112,99", "Histórico"],
  ["2024-06-21", 166200, "diagnóstico detonacao", "", "410,00", "Histórico"],
  ["2024-10-16", 169000, "Troca óleo", "179000 trocado", "85,00", "Histórico"],
  ["2024-01-31", 157500, "trocar filtro de oleo, ar e gasolina", "173500 trocado", "", "Histórico"],
  ["2025-09-10", 177000, "trocar óleo filtro e gasolina", "193000", "", "Histórico"],
  ["2025-09-10", 177000, "trocar óleo", "185000", "", "Histórico"],

  // ── Diversos (Impostos, Seguros, Outros) ──
  ["2019-08-15", 112700, "Manutenção no alternador, trocado regulador de voltagem e rolamentos", "", "534,64", "Diversos"],
  ["2019-08-14", 112700, "Manutenção (complemento 1)", "", "397,60", "Diversos"],
  ["2019-08-16", 112700, "Manutenção (complemento 2)", "", "154,71", "Diversos"],
  ["2022-05-25", 141000, "troca do catalisador", "", "600,00", "Diversos"],
  ["2022-06-01", 140200, "troca filtro cabine", "164000 feito", "", "Diversos"],
  ["2022-06-01", 140200, "higiene ar", "164000 feito com ar quente", "", "Diversos"],
  ["2022-09-20", 142090, "troca da caixa de DH original gol 1200,00 +400 instalação", "", "1.595,00", "Diversos"],
  ["2022-06-02", 140200, "210.00 imposto ipva", "", "210,00", "Diversos"],
  ["2022-12-28", 144200, "mão de obra troca do rolamento direito, lubrificação do rolamento esquerdo, troca do antichamas", "", "360,00", "Diversos"],
  ["2022-12-28", 144200, "peças", "", "146,00", "Diversos"],
  ["2022-12-28", 144200, "troca bateria de zeta que durou 3 anos e 8 meses para moura 420,00", "", "420,00", "Diversos"],
  ["2023-01-31", 145000, "ipva", "", "737,20", "Diversos"],
  ["2022-03-01", 139000, "MO retifica motor e peças", "", "2.900,00", "Diversos"],
  ["2023-07-01", 147000, "insulfim nano carbon", "", "1.500,00", "Diversos"],
  ["2024-01-10", 157000, "ipva24", "", "712,00", "Diversos"],
  ["2024-03-25", 158000, "Seguro ThinkSeg encerramento 1927,90 total km Custo mensaldade 23 meses 1150 + 468,00 km abatido durante o uso TOTAL GERAL", "", "3.545,90", "Diversos"],
  ["2024-03-01", 158000, "Seguro Porto seguro", "", "1.733,00", "Diversos"],
  ["2024-07-23", 166500, "Santi retífica cabeçote, retífica motor, troca aneis, troca eixo comando válvula, coxim motor, pescador bomba óleo, jg aneis std, bronzina", "", "6.176,23", "Diversos"],
  ["2024-07-23", 166500, "filtro cabine", "190000", "", "Diversos"],
  ["2024-07-23", 166500, "filtro oleo e combustível", "185000", "", "Diversos"],
  ["2024-10-01", 168500, "par farol", "", "888,00", "Diversos"],
  ["2024-10-01", 168500, "kit parachoque completo", "", "315,00", "Diversos"],
  ["2024-10-11", 168500, "Reparo parachoque", "", "650,00", "Diversos"],
  ["2024-10-15", 169000, "troca vidro traseiro seguro porto", "", "257,00", "Diversos"],
  ["2024-06-17", 165500, "troca módulo injeção", "", "600,00", "Diversos"],
  ["2025-01-06", 171300, "Bobina NGK", "", "550,00", "Diversos"],
  ["2025-02-17", 171400, "Cilindro Receptor Atuador Câmbio Fox Gol Polo Original", "", "158,00", "Diversos"],
  ["2025-02-17", 171400, "mao de obra santi", "", "200,00", "Diversos"],
  ["2025-01-01", 171000, "ipva25", "", "710,02", "Diversos"],
  ["2024-05-15", 165000, "higiene ar quente ar condicionado", "185000", "", "Diversos"],
  ["2026-01-10", 175000, "ipva", "", "717,14", "Diversos"],
];

async function main() {
  // Limpar os registros antigos de manutenção deste veículo para evitar duplicações e conflitos
  await prisma.maintenanceRecord.deleteMany({
    where: { vehicleId: VEICULO_ID }
  });

  const categoryMap = new Map<string, string>();

  const getCatId = async (name: string) => {
    const key = name.toLowerCase();
    if (categoryMap.has(key)) return categoryMap.get(key)!;
    let cat = await prisma.maintenanceCategory.findFirst({
      where: { vehicleId: VEICULO_ID, name }
    });
    if (!cat) {
      cat = await prisma.maintenanceCategory.create({
        data: { name, vehicleId: VEICULO_ID }
      });
    }
    categoryMap.set(key, cat.id);
    return cat.id;
  };

  const getTargetCategoryName = (desc: string, originalCat: string) => {
    const d = desc.toLowerCase();
    const orig = originalCat.toLowerCase();
    
    if (orig === "histórico" || orig === "historico" || orig === "outros" || orig === "diversos") {
      if (
        d.includes("óleo") || 
        d.includes("oleo") || 
        d.includes("filtro") || 
        d.includes("lubrificação")
      ) {
        return "Troca oleo";
      } 
      if (
        d.includes("correia") || 
        d.includes("tensor")
      ) {
        return "correia dentada";
      } 
      if (
        d.includes("injeção") || 
        d.includes("injecao") || 
        d.includes("módulo") || 
        d.includes("modulo") || 
        d.includes("bico") || 
        d.includes("combustível") || 
        d.includes("combustivel") || 
        d.includes("sonda lambda")
      ) {
        return "sistema injeção";
      } 
      if (
        d.includes("ipva") || 
        d.includes("imposto") || 
        d.includes("seguro")
      ) {
        return "impostos";
      } 
      if (
        d.includes("direção") || 
        d.includes("direcao") || 
        d.includes("dh") || 
        d.includes("hidráulica") ||
        d.includes("hidraulica")
      ) {
        return "direção hidráulica";
      } 
      if (
        d.includes("mão de obra") || 
        d.includes("mao de obra") || 
        d.includes("mo ") || 
        d.startsWith("mo") || 
        d.includes("m.o")
      ) {
        return "Mao de obra mecanica";
      } 
      if (
        d.includes("cabeçote") || 
        d.includes("motor") || 
        d.includes("virabrequim") || 
        d.includes("mancais") || 
        d.includes("bronzina") || 
        d.includes("engrenagem") || 
        d.includes("válvula") || 
        d.includes("valvula") || 
        d.includes("velas") || 
        d.includes("vela") || 
        d.includes("bobina") || 
        d.includes("antichama") || 
        d.includes("embreagem") || 
        d.includes("catalisador")
      ) {
        return "motor";
      }
    }
    return originalCat;
  };

  // Insert records
  let count = 0;
  for (const [dStr, km, desc, next, val, origCatName] of rawRecords) {
    const { nextKm, observations } = parseNext(next);
    const cost = parseCost(val);
    
    // Resolve a categoria alvo correta (remapeando itens de Histórico/Diversos para as novas específicas)
    const targetCatName = getTargetCategoryName(desc, origCatName);
    const categoryId = await getCatId(targetCatName);

    await prisma.maintenanceRecord.create({
      data: {
        date: new Date(`${dStr}T12:00:00Z`),
        kmAtService: km,
        description: desc,
        cost,
        nextKm,
        observations,
        vehicleId: VEICULO_ID,
        categoryId,
      }
    });
    count++;
  }

  // ── Seeding do Plano de Manutenção Técnica (TechnicalInfo) ──
  const planItems = [
    {
      description: "Troca do líquido de arrefecimento",
      kmInterval: 32000,
      timeIntervalMonths: 24,
      notes: "Não passar de 2 anos",
      categoryName: "Arrefecimento"
    },
    {
      description: "Troca de óleo",
      kmInterval: 6000,
      timeIntervalMonths: null,
      notes: "Usar óleo 5w40 sintético vw 502.00 / 508.88 a cada 6k (troca padrão a cada 8k)",
      categoryName: "Troca oleo"
    },
    {
      description: "Troca de velas",
      kmInterval: 24000,
      timeIntervalMonths: null,
      notes: "Manual recomenda 30k",
      categoryName: "motor"
    },
    {
      description: "Troca de filtros (Ar, Óleo e Gasolina)",
      kmInterval: 16000,
      timeIntervalMonths: null,
      notes: "Pula uma troca de óleo (a cada 16k então)",
      categoryName: "Troca oleo"
    },
    {
      description: "Troca de correia dentada e tensor",
      kmInterval: 72000,
      timeIntervalMonths: null,
      notes: null,
      categoryName: "correia dentada"
    },
    {
      description: "Troca do antichama",
      kmInterval: 20000,
      timeIntervalMonths: null,
      notes: null,
      categoryName: "motor"
    },
    {
      description: "Troca do filtro de cabine",
      kmInterval: 24000,
      timeIntervalMonths: null,
      notes: null,
      categoryName: "Diversos"
    },
    {
      description: "Higienização do ar condicionado",
      kmInterval: 24000,
      timeIntervalMonths: null,
      notes: null,
      categoryName: "Diversos"
    }
  ];

  let technicalInfosCount = 0;
  for (const item of planItems) {
    const categoryId = await getCatId(item.categoryName);
    
    // Evita duplicatas buscando por descrição e veículo
    const existsPlan = await prisma.technicalInfo.findFirst({
      where: { vehicleId: VEICULO_ID, description: item.description }
    });

    if (!existsPlan) {
      await prisma.technicalInfo.create({
        data: {
          description: item.description,
          kmInterval: item.kmInterval,
          timeIntervalMonths: item.timeIntervalMonths,
          notes: item.notes,
          categoryId,
          vehicleId: VEICULO_ID
        }
      });
      technicalInfosCount++;
    }
  }

  console.log(`Seed finalizado: ${count} novos registros e ${technicalInfosCount} regras do plano inseridas.`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
