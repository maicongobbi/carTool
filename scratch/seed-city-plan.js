const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const vehicleId = "cmpg44k6q0001fgzsee5fxnx6"; // Honda City Touring 2022 do usuário

  // Verifica se o veículo existe
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId }
  });

  if (!vehicle) {
    console.error("Veículo não encontrado!");
    process.exit(1);
  }

  const plan = [
    {
      category: "Troca de Óleo",
      items: [
        {
          description: "Óleo do motor e filtro",
          kmInterval: 10000,
          timeIntervalMonths: 12,
          notes: "Usar óleo recomendado (ex: 0W-20 sintético) e substituir o respectivo filtro de óleo."
        }
      ]
    },
    {
      category: "Filtro de Combustível",
      items: [
        {
          description: "Filtro de combustível",
          kmInterval: 10000,
          timeIntervalMonths: 12,
          notes: "Substituir o filtro de combustível externo."
        }
      ]
    },
    {
      category: "Filtros de Ar",
      items: [
        {
          description: "Filtro de ar do motor",
          kmInterval: 20000,
          timeIntervalMonths: 24,
          notes: "Substituir o elemento filtrante de ar do motor."
        },
        {
          description: "Filtro de cabine (Ar-Condicionado)",
          kmInterval: 20000,
          timeIntervalMonths: null,
          notes: "Substituir o filtro de pó e pólen da cabine."
        }
      ]
    },
    {
      category: "Freios",
      items: [
        {
          description: "Fluido de freio",
          kmInterval: null,
          timeIntervalMonths: 36,
          notes: "Troca completa do fluido de freio por tempo (independente de quilometragem)."
        }
      ]
    },
    {
      category: "Transmissão",
      items: [
        {
          description: "Fluido de transmissão CVT",
          kmInterval: 40000,
          timeIntervalMonths: 36,
          notes: "Troca do óleo da transmissão continuamente variável (CVT)."
        }
      ]
    },
    {
      category: "Motor",
      items: [
        {
          description: "Velas de ignição (Irídio)",
          kmInterval: 100000,
          timeIntervalMonths: null,
          notes: "Substituição das velas de ignição de irídio de longa duração."
        },
        {
          description: "Folga de válvulas",
          kmInterval: 40000,
          timeIntervalMonths: null,
          notes: "Inspecionar folga de válvulas sensorialmente e ajustar se necessário (ajuste recomendado aos 120.000 km)."
        }
      ]
    },
    {
      category: "Suspensão e Pneus",
      items: [
        {
          description: "Rodízio e alinhamento",
          kmInterval: 10000,
          timeIntervalMonths: null,
          notes: "Inspecionar alinhamento aos 10k e 20k km, depois a cada 20k km. Realizar rodízio de pneus a cada 10k km."
        }
      ]
    },
    {
      category: "Arrefecimento",
      items: [
        {
          description: "Fluido de arrefecimento do motor",
          kmInterval: 200000,
          timeIntervalMonths: 120,
          notes: "Primeira substituição com 200.000 km ou 10 anos, depois a cada 100.000 km ou 5 anos."
        }
      ]
    }
  ];

  for (const block of plan) {
    // 1. Encontra ou cria a categoria associada a este veículo
    let category = await prisma.maintenanceCategory.findFirst({
      where: { vehicleId, name: block.category }
    });

    if (!category) {
      category = await prisma.maintenanceCategory.create({
        data: {
          name: block.category,
          vehicleId
        }
      });
      console.log(`Categoria '${block.category}' criada.`);
    }

    // 2. Insere as especificações técnicas
    for (const item of block.items) {
      const exists = await prisma.technicalInfo.findFirst({
        where: { vehicleId, categoryId: category.id, description: item.description }
      });

      if (!exists) {
        await prisma.technicalInfo.create({
          data: {
            description: item.description,
            kmInterval: item.kmInterval,
            timeIntervalMonths: item.timeIntervalMonths,
            notes: item.notes,
            categoryId: category.id,
            vehicleId
          }
        });
        console.log(`Recomendação '${item.description}' inserida na categoria '${block.category}'.`);
      }
    }
  }

  console.log("Plano de manutenção inserido com sucesso!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
