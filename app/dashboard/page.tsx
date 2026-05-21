"use client";

import { useFindManyMaintenanceRecord, useFindManyVehicle } from "@/app/lib/hooks";
import { formatMonthYear } from "@/app/lib/date-utils";
import { BarChart, DonutChart, LineChart } from "@mantine/charts";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCar,
  IconCoin,
  IconGauge,
  IconPlus,
  IconTool,
  IconTrendingUp,
} from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  icon, color, label, value, sub,
}: {
  icon: React.ReactNode; color: string; label: string; value: string; sub?: string;
}) {
  return (
    <Card withBorder padding="lg" radius="md" shadow="sm">
      <Group justify="space-between" align="flex-start" mb="xs">
        <ThemeIcon color={color} variant="light" size="lg" radius="md">{icon}</ThemeIcon>
      </Group>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{label}</Text>
      <Text fw={800} size="xl" lh={1.2}>{value}</Text>
      {sub && <Text size="xs" c="dimmed" mt={4}>{sub}</Text>}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [includeSold, setIncludeSold] = useState(false);

  const { data: vehicles, isLoading: loadingVehicles } = useFindManyVehicle({
    orderBy: { createdAt: "desc" },
  });

  const { data: records, isLoading: loadingRecords } = useFindManyMaintenanceRecord({
    include: { category: true, vehicle: true },
    orderBy: { date: "asc" },
  });

  const isLoading = loadingVehicles || loadingRecords;

  // Opções do Select
  const vehicleOptions = useMemo(() => {
    if (!vehicles) return [];
    return vehicles
      .filter((v) => includeSold || !v.saleDate)
      .map((v) => ({
        value: v.id,
        label: `${v.brand} ${v.model} (${v.year})${v.saleDate ? " (Vendido)" : ""}`,
      }));
  }, [vehicles, includeSold]);

  // Handler para checkbox de incluir vendidos (reseta o select caso o veículo selecionado seja vendido e a checkbox desmarcada)
  const handleIncludeSoldChange = (checked: boolean) => {
    setIncludeSold(checked);
    if (!checked && selectedVehicleId && vehicles) {
      const selected = vehicles.find((v) => v.id === selectedVehicleId);
      if (selected?.saleDate) {
        setSelectedVehicleId(null);
      }
    }
  };

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    if (selectedVehicleId) {
      return vehicles.filter((v) => v.id === selectedVehicleId);
    }
    return vehicles.filter((v) => includeSold || !v.saleDate);
  }, [vehicles, selectedVehicleId, includeSold]);

  // Registros e veículos filtrados
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    const allowedVehicleIds = new Set(filteredVehicles.map((v) => v.id));
    return records.filter((r) => allowedVehicleIds.has((r as any).vehicleId));
  }, [records, filteredVehicles]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!filteredVehicles.length && !filteredRecords.length) return null;
    const activeVehicles = filteredVehicles.filter((v) => !v.saleDate);
    const totalCost = filteredRecords.reduce((s, r) => s + (r.cost ?? 0), 0);
    const totalKm = filteredVehicles.reduce((s, v) => s + (v.currentKm - v.initialKm), 0);
    const custoPorKm = totalKm > 0 ? totalCost / totalKm : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = filteredRecords.filter((r) => new Date(r.date) >= thirtyDaysAgo).length;

    // Manutenções vencidas: apenas o registro mais recente por (veículo + categoria),
    // igual à lógica da página de veículo — evita contar histórico antigo já atendido.
    const now = new Date();
    const seen = new Set<string>();
    let overdueCount = 0;
    // filteredRecords já vem ordenado por date asc; precisamos do mais recente → iterar ao contrário
    [...filteredRecords].reverse().forEach((r: any) => {
      const key = `${r.vehicleId}:${r.categoryId}`;
      if (seen.has(key) || r.ignored) return;
      seen.add(key);
      const vehicleCurrentKm = r.vehicle?.currentKm ?? 0;
      const kmOverdue = r.nextKm && r.nextKm <= vehicleCurrentKm;
      const dateOverdue = r.nextDate && new Date(r.nextDate) <= now;
      if (kmOverdue || dateOverdue) overdueCount++;
    });

    return { activeVehicles, totalCost, totalKm, custoPorKm, recentCount, overdueCount };
  }, [filteredVehicles, filteredRecords]);

  // ── Custo mensal ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[formatMonthYear(d)] = 0;
    }
    filteredRecords.forEach((r) => {
      if (!r.cost) return;
      const key = formatMonthYear(r.date);
      if (key in months) months[key] += r.cost;
    });
    return Object.entries(months).map(([month, custo]) => ({ month, custo }));
  }, [filteredRecords]);

  // ── Custo por categoria ───────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      if (!r.cost) return;
      const name = (r as any).category?.name ?? "Sem categoria";
      map[name] = (map[name] ?? 0) + r.cost;
    });
    const COLORS = ["blue", "teal", "violet", "orange", "pink", "cyan", "grape", "lime", "indigo", "yellow"];
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value], i) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        color: `${COLORS[i % COLORS.length]}.6`,
      }));
  }, [filteredRecords]);

  // ── KM por veículo ────────────────────────────────────────────────────────
  const kmData = useMemo(() => {
    return filteredVehicles
      .filter((v) => !v.saleDate)
      .map((v) => ({
        name: `${v.brand} ${v.model}`.slice(0, 18),
        km: v.currentKm - v.initialKm,
      }))
      .sort((a, b) => b.km - a.km);
  }, [filteredVehicles]);

  // ── Custo acumulado ───────────────────────────────────────────────────────
  const cumulativeData = useMemo(() => {
    let acc = 0;
    return filteredRecords
      .filter((r) => r.cost)
      .map((r) => {
        acc += r.cost ?? 0;
        return {
          data: formatMonthYear(r.date),
          total: parseFloat(acc.toFixed(2)),
        };
      });
  }, [filteredRecords]);

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Skeleton height={40} width={240} mb="xl" />
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="xl">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={110} radius="md" />)}
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={280} radius="md" />)}
        </SimpleGrid>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed" size="sm">Visão geral da sua frota</Text>
        </div>
        <Group gap="md" align="center" wrap="wrap">
          <Checkbox
            label="Incluir vendidos"
            checked={includeSold}
            onChange={(event) => handleIncludeSoldChange(event.currentTarget.checked)}
            size="sm"
          />
          <Select
            placeholder="Todos os veículos"
            data={vehicleOptions}
            value={selectedVehicleId}
            onChange={setSelectedVehicleId}
            clearable
            leftSection={<IconCar size={16} />}
            style={{ minWidth: 220 }}
            size="sm"
          />
          <Button component={Link} href="/veiculos/novo" leftSection={<IconPlus size={16} />} size="sm">
            Novo Veículo
          </Button>
        </Group>
      </Group>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="xl">
        <KpiCard
          icon={<IconCar size={20} />}
          color="blue"
          label="Veículos Ativos"
          value={String(kpis?.activeVehicles.length ?? 0)}
          sub={`${filteredVehicles.filter((v) => v.saleDate).length} vendido(s)`}
        />
        <KpiCard
          icon={<IconCoin size={20} />}
          color="teal"
          label="Total em Manutenção"
          value={(kpis?.totalCost ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          sub={`${filteredRecords.length} registros`}
        />
        <KpiCard
          icon={<IconGauge size={20} />}
          color="violet"
          label="Custo / KM"
          value={
            kpis && kpis.custoPorKm > 0
              ? kpis.custoPorKm.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "—"
          }
          sub={`${(kpis?.totalKm ?? 0).toLocaleString("pt-BR")} km rodados`}
        />
        <KpiCard
          icon={<IconAlertTriangle size={20} />}
          color={kpis && kpis.overdueCount > 0 ? "red" : "green"}
          label="Manutenções Vencidas"
          value={String(kpis?.overdueCount ?? 0)}
          sub={`${kpis?.recentCount ?? 0} nos últimos 30 dias`}
        />
      </SimpleGrid>

      {/* Gráficos */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="xl">

        {/* Custo mensal */}
        <Card withBorder padding="lg" radius="md" shadow="sm">
          <Group gap="xs" mb="md">
            <ThemeIcon color="teal" variant="light" size="sm" radius="sm"><IconCoin size={14} /></ThemeIcon>
            <Text fw={600} size="sm">Custo Mensal (últimos 12 meses)</Text>
          </Group>
          {monthlyData.every((d) => d.custo === 0) ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">Nenhum custo registrado</Text>
          ) : (
            <BarChart
              h={220} data={monthlyData} dataKey="month"
              series={[{ name: "custo", color: "teal.6", label: "R$" }]}
              tickLine="none" gridAxis="y"
              valueFormatter={(v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              withTooltip
            />
          )}
        </Card>

        {/* Custo por categoria */}
        <Card withBorder padding="lg" radius="md" shadow="sm">
          <Group gap="xs" mb="md">
            <ThemeIcon color="violet" variant="light" size="sm" radius="sm"><IconTool size={14} /></ThemeIcon>
            <Text fw={600} size="sm">Gasto por Categoria</Text>
          </Group>
          {categoryData.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">Nenhum dado disponível</Text>
          ) : (
            <Group justify="center" align="flex-start" gap="xl">
              <DonutChart
                data={categoryData} size={160} thickness={28}
                tooltipDataSource="segment"
                valueFormatter={(v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              />
              <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                {categoryData.map((d) => (
                  <Group key={d.name} justify="space-between" gap={4} wrap="nowrap">
                    <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--mantine-color-${d.color.replace(".", "-")})`, flexShrink: 0 }} />
                      <Text size="xs" truncate style={{ flex: 1 }}>{d.name}</Text>
                    </Group>
                    <Text size="xs" fw={600} style={{ whiteSpace: "nowrap" }}>
                      {d.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Group>
          )}
        </Card>

        {/* KM por veículo — oculto quando filtrando um único */}
        {!selectedVehicleId && (
          <Card withBorder padding="lg" radius="md" shadow="sm">
            <Group gap="xs" mb="md">
              <ThemeIcon color="blue" variant="light" size="sm" radius="sm"><IconGauge size={14} /></ThemeIcon>
              <Text fw={600} size="sm">KM Rodados por Veículo</Text>
            </Group>
            {kmData.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">Nenhum veículo ativo</Text>
            ) : (
              <BarChart
                h={220} data={kmData} dataKey="name"
                series={[{ name: "km", color: "blue.6", label: "km" }]}
                tickLine="none" gridAxis="y" orientation="vertical"
                valueFormatter={(v) => `${v.toLocaleString("pt-BR")} km`}
                withTooltip
              />
            )}
          </Card>
        )}

        {/* Custo acumulado */}
        <Card withBorder padding="lg" radius="md" shadow="sm">
          <Group gap="xs" mb="md">
            <ThemeIcon color="orange" variant="light" size="sm" radius="sm"><IconTrendingUp size={14} /></ThemeIcon>
            <Text fw={600} size="sm">Custo Acumulado</Text>
          </Group>
          {cumulativeData.length < 2 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">Registros insuficientes para o gráfico</Text>
          ) : (
            <LineChart
              h={220} data={cumulativeData} dataKey="data"
              series={[{ name: "total", color: "orange.6", label: "Total R$" }]}
              tickLine="none" gridAxis="y"
              valueFormatter={(v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              curveType="monotone" withDots={false} withTooltip
            />
          )}
        </Card>
      </SimpleGrid>

      {/* Lista de veículos */}
      <Title order={4} mb="md">
        {selectedVehicleId ? "Veículo Selecionado" : "Meus Veículos"}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {filteredVehicles.map((vehicle) => {
          const vRecords = (records ?? []).filter((r) => (r as any).vehicleId === vehicle.id);
          const vCost = vRecords.reduce((s, r) => s + (r.cost ?? 0), 0);
          const kmRodados = vehicle.currentKm - vehicle.initialKm;
          return (
            <Card key={vehicle.id} withBorder padding="md" radius="md" shadow="sm"
              component={Link} href={`/veiculos/${vehicle.id}`}
              style={{ textDecoration: "none", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--mantine-shadow-md)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
              <Group justify="space-between" mb="xs">
                <div>
                  <Text fw={700} size="sm">{vehicle.brand} {vehicle.model}</Text>
                  <Text size="xs" c="dimmed">{vehicle.type} • {vehicle.year}{vehicle.modelYear ? `/${vehicle.modelYear}` : ""}</Text>
                </div>
                {vehicle.saleDate
                  ? <Badge color="red" size="xs">Vendido</Badge>
                  : <Badge color="green" size="xs" variant="light">Ativo</Badge>}
              </Group>
              <SimpleGrid cols={2} spacing={4}>
                <div><Text size="xs" c="dimmed">KM Atual</Text><Text size="sm" fw={600}>{vehicle.currentKm.toLocaleString("pt-BR")} km</Text></div>
                <div><Text size="xs" c="dimmed">KM Rodados</Text><Text size="sm" fw={600}>{kmRodados.toLocaleString("pt-BR")} km</Text></div>
                <div><Text size="xs" c="dimmed">Gasto Total</Text><Text size="sm" fw={600}>{vCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Text></div>
                <div><Text size="xs" c="dimmed">Manutenções</Text><Text size="sm" fw={600}>{vRecords.length}</Text></div>
              </SimpleGrid>
            </Card>
          );
        })}
        {!selectedVehicleId && (
          <Card withBorder padding="md" radius="md" shadow="sm"
            component={Link} href="/veiculos/novo"
            style={{ textDecoration: "none", cursor: "pointer", borderStyle: "dashed" }}
          >
            <Stack align="center" justify="center" h="100%" gap="xs" py="md">
              <ThemeIcon variant="light" size="xl" radius="xl" color="gray"><IconPlus size={20} /></ThemeIcon>
              <Text size="sm" c="dimmed" fw={500}>Novo Veículo</Text>
            </Stack>
          </Card>
        )}
      </SimpleGrid>
    </Container>
  );
}
