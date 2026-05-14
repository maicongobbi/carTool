"use client";

import { useFindUniqueVehicle, useUpdateVehicle } from "@/app/lib/hooks";
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconCoin,
  IconGauge,
  IconPlus,
  IconSettings,
  IconTag,
  IconTool,
} from "@tabler/icons-react";
import Link from "next/link";
import { use, useState } from "react";
import { MaintenanceRecordCard } from "../../components/veiculos/MaintenanceRecordCard";
import { MaintenanceRecordForm } from "../../components/veiculos/MaintenanceRecordForm";
import { TechnicalInfoCard } from "../../components/veiculos/TechnicalInfoCard";
import { TechnicalInfoForm } from "../../components/veiculos/TechnicalInfoForm";

export default function VeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: vehicle, isLoading, refetch } = useFindUniqueVehicle({
    where: { id },
    include: {
      technicalInfos: { include: { category: true } },
      maintenanceRecords: {
        include: { category: true },
        orderBy: { date: "desc" },
      },
    },
  });

  const updateVehicle = useUpdateVehicle();

  const [sellModalOpened, { open: openSellModal, close: closeSellModal }] = useDisclosure(false);
  const [techModalOpened, { open: openTechModal, close: closeTechModal }] = useDisclosure(false);
  const [maintModalOpened, { open: openMaintModal, close: closeMaintModal }] = useDisclosure(false);

  const [saleDate, setSaleDate] = useState<Date | null>(null);
  const [savingSale, setSavingSale] = useState(false);
  const [newKm, setNewKm] = useState<number | string>("");
  const [savingKm, setSavingKm] = useState(false);

  const handleMarkAsSold = async () => {
    if (!saleDate) return;
    setSavingSale(true);
    try {
      await updateVehicle.mutateAsync({
        where: { id },
        data: { saleDate: saleDate.toISOString() },
      });
      closeSellModal();
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSale(false);
    }
  };

  const handleUpdateKm = async () => {
    const km = typeof newKm === "string" ? parseInt(newKm) : newKm;
    if (!km || km <= 0) return;
    setSavingKm(true);
    try {
      await updateVehicle.mutateAsync({
        where: { id },
        data: { currentKm: km },
      });
      notifications.show({ title: "KM atualizado!", message: "", color: "green" });
      setNewKm("");
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingKm(false);
    }
  };

  if (isLoading) {
    return (
      <Container size="md" py="xl" ta="center">
        <Loader />
      </Container>
    );
  }

  if (!vehicle) {
    return (
      <Container size="md" py="xl">
        <Text>Veículo não encontrado.</Text>
      </Container>
    );
  }

  // KPIs calculados
  const records = (vehicle as any).maintenanceRecords ?? [];
  const totalGasto: number = records.reduce(
    (acc: number, r: any) => acc + (r.cost ?? 0),
    0
  );
  const kmRodados = vehicle.currentKm - vehicle.initialKm;
  const custoPorKm = kmRodados > 0 ? totalGasto / kmRodados : 0;

  return (
    <Container size="lg" py="xl">
      <Group mb="xl">
        <Button
          component={Link}
          href="/home"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Voltar para Home
        </Button>
      </Group>

      {/* ─── Card do Veículo ─── */}
      <Card withBorder padding="lg" radius="md" mb="xl" shadow="sm">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <div>
            <Title order={2}>
              {vehicle.brand} {vehicle.model}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {vehicle.type} • {vehicle.year}
              {vehicle.modelYear ? `/${vehicle.modelYear}` : ""} •{" "}
              {vehicle.fipeCode ? `FIPE: ${vehicle.fipeCode}` : "Sem código FIPE"}
            </Text>
          </div>
          <Group>
            {vehicle.saleDate ? (
              <Badge color="red" size="lg" leftSection={<IconCheck size={14} />}>
                Vendido em {new Date(vehicle.saleDate).toLocaleDateString("pt-BR")}
              </Badge>
            ) : (
              <Button variant="light" color="red" leftSection={<IconTag size={16} />} onClick={openSellModal}>
                Marcar como Vendido
              </Button>
            )}
          </Group>
        </Group>

        <Divider my="md" />

        {/* KPIs */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <Stack gap={2}>
            <Group gap={6} c="dimmed">
              <IconGauge size={16} />
              <Text size="xs">KM Atual</Text>
            </Group>
            <Text fw={700} size="lg">
              {vehicle.currentKm.toLocaleString("pt-BR")} km
            </Text>
          </Stack>

          <Stack gap={2}>
            <Group gap={6} c="dimmed">
              <IconGauge size={16} />
              <Text size="xs">KM Rodados</Text>
            </Group>
            <Text fw={700} size="lg">
              {kmRodados.toLocaleString("pt-BR")} km
            </Text>
          </Stack>

          <Stack gap={2}>
            <Group gap={6} c="dimmed">
              <IconCoin size={16} />
              <Text size="xs">Total em Manutenção</Text>
            </Group>
            <Text fw={700} size="lg">
              {totalGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Text>
          </Stack>

          <Stack gap={2}>
            <Group gap={6} c="dimmed">
              <IconCoin size={16} />
              <Text size="xs">Custo / KM</Text>
            </Group>
            <Text fw={700} size="lg">
              {custoPorKm > 0
                ? custoPorKm.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "—"}
            </Text>
          </Stack>
        </SimpleGrid>

        <Divider my="md" label="Atualizar KM" />

        {/* Atualização rápida de KM */}
        <Group align="flex-end" gap="sm">
          <NumberInput
            label="Novo KM atual"
            placeholder={`Atual: ${vehicle.currentKm.toLocaleString("pt-BR")}`}
            hideControls
            suffix=" km"
            value={newKm}
            onChange={setNewKm}
            style={{ flex: 1 }}
          />
          <Button onClick={handleUpdateKm} loading={savingKm} disabled={!newKm}>
            Atualizar
          </Button>
        </Group>
      </Card>

      {/* ─── Plano de Manutenção (Referência) ─── */}
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconSettings size={20} />
          <Title order={3}>Plano de Manutenção</Title>
        </Group>
        <Button size="sm" leftSection={<IconPlus size={16} />} onClick={openTechModal}>
          Adicionar Referência
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
        {(vehicle as any).technicalInfos.length === 0 ? (
          <Text c="dimmed" size="sm">
            Nenhuma referência técnica cadastrada.
          </Text>
        ) : (
          (vehicle as any).technicalInfos.map((info: any) => (
            <TechnicalInfoCard
              key={info.id}
              description={info.description}
              categoryName={info.category.name}
              kmInterval={info.kmInterval}
              timeIntervalMonths={info.timeIntervalMonths}
            />
          ))
        )}
      </SimpleGrid>

      {/* ─── Manutenções Realizadas ─── */}
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconTool size={20} />
          <Title order={3}>Manutenções Realizadas</Title>
        </Group>
        <Button size="sm" leftSection={<IconPlus size={16} />} onClick={openMaintModal}>
          Registrar Manutenção
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
        {records.length === 0 ? (
          <Text c="dimmed" size="sm">
            Nenhuma manutenção registrada ainda.
          </Text>
        ) : (
          records.map((record: any) => (
            <MaintenanceRecordCard
              key={record.id}
              date={record.date}
              kmAtService={record.kmAtService}
              description={record.description}
              categoryName={record.category.name}
              cost={record.cost}
              nextDate={record.nextDate}
              nextKm={record.nextKm}
            />
          ))
        )}
      </SimpleGrid>

      {/* ─── Modais ─── */}
      <Modal opened={sellModalOpened} onClose={closeSellModal} title="Marcar Veículo como Vendido">
        <DatePickerInput
          label="Data da Venda"
          placeholder="Selecione a data"
          valueFormat="DD/MM/YYYY"
          value={saleDate}
          onChange={setSaleDate}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={closeSellModal}>Cancelar</Button>
          <Button onClick={handleMarkAsSold} loading={savingSale} disabled={!saleDate}>
            Salvar
          </Button>
        </Group>
      </Modal>

      <Modal opened={techModalOpened} onClose={closeTechModal} title="Nova Referência Técnica">
        <TechnicalInfoForm
          vehicleId={vehicle.id}
          onSuccess={() => { closeTechModal(); refetch(); }}
          onCancel={closeTechModal}
        />
      </Modal>

      <Modal
        opened={maintModalOpened}
        onClose={closeMaintModal}
        title="Registrar Manutenção"
        size="lg"
      >
        <MaintenanceRecordForm
          vehicleId={vehicle.id}
          vehicleCurrentKm={vehicle.currentKm}
          onSuccess={() => { closeMaintModal(); refetch(); }}
          onCancel={closeMaintModal}
        />
      </Modal>
    </Container>
  );
}
