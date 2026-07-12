"use client";

import { useCreateMaintenanceRecord, useFindUniqueVehicle, useUpdateMaintenanceRecord, useUpdateVehicle, useFindManyUser } from "@/app/lib/hooks";
import { formatLocalDate } from "@/app/lib/date-utils";
import { useSession } from "@/app/lib/auth-client";
import { transferVehicle } from "@/app/lib/actions/vehicle";
import { supabase } from "@/app/lib/supabase-client";
import {
  ActionIcon,
  Checkbox,
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCoin,
  IconGauge,
  IconNote,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTag,
  IconTool,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { use, useState, useMemo } from "react";
import { MaintenanceDetailsModal } from "../../components/veiculos/MaintenanceDetailsModal";
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
  const [editTechModalOpened, { open: openEditTechModal, close: closeEditTechModal }] = useDisclosure(false);
  const [selectedTechInfo, setSelectedTechInfo] = useState<any>(null);
  const [maintModalOpened, { open: openMaintModal, close: closeMaintModal }] = useDisclosure(false);
  const [detailsModalOpened, { open: openDetailsModal, close: closeDetailsModal }] = useDisclosure(false);

  const [saleDate, setSaleDate] = useState<Date | null>(null);
  const [savingSale, setSavingSale] = useState(false);
  const [shouldTransfer, setShouldTransfer] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const { data: session } = useSession();
  const { data: usersData } = useFindManyUser();

  const availableUsers = useMemo(() => {
    if (!usersData || !session?.user) return [];
    return usersData.filter(u => u.id !== session.user.id);
  }, [usersData, session?.user]);
  const [newKm, setNewKm] = useState<number | string>("");
  const [savingKm, setSavingKm] = useState(false);

  // Estados para Detalhes e Conclusão de Manutenção
  const createRecord = useCreateMaintenanceRecord();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [markAsDone, setMarkAsDone] = useState(false);
  const [doneDate, setDoneDate] = useState<Date | null>(new Date());
  const [doneKm, setDoneKm] = useState<number | string>("");
  const [doneCost, setDoneCost] = useState<number | string>("");
  const [doneObs, setDoneObs] = useState<string>("");
  const [doneFiles, setDoneFiles] = useState<File[]>([]);
  const [savingDone, setSavingDone] = useState(false);
  const [ignoreRecord, setIgnoreRecord] = useState(false);
  const [savingIgnore, setSavingIgnore] = useState(false);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editKm, setEditKm] = useState<number | string>("");
  const [savingKmEdit, setSavingKmEdit] = useState(false);
  // Suggested next values (editable)
  const [suggestedNextKm, setSuggestedNextKm] = useState<number | string>("");
  const [suggestedNextDate, setSuggestedNextDate] = useState<Date | null>(null);
  const [savingPrediction, setSavingPrediction] = useState(false);

  const updateRecord = useUpdateMaintenanceRecord();

  // UI state
  const [planOpened, setPlanOpened] = useState(false);
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"list" | "category">("list");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Notes state
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleOpenDetails = (record: any) => {
    setSelectedRecord(record);
    setMarkAsDone(false);
    setIgnoreRecord(false);
    setDoneDate(new Date());
    setDoneKm(vehicle?.currentKm ?? "");
    setDoneCost("");
    setDoneObs("");
    setDoneFiles([]);
    setEditDate(new Date(record.date));
    setEditKm(record.kmAtService);

    // Pre-fill suggested next values (editable)
    const techInfo = (vehicle as any)?.technicalInfos?.find((t: any) => t.id === record.technicalInfoId);
    if (record.nextKm) {
      setSuggestedNextKm(record.nextKm);
    } else if (techInfo?.kmInterval) {
      setSuggestedNextKm((vehicle?.currentKm ?? 0) + techInfo.kmInterval);
    } else {
      setSuggestedNextKm("");
    }
    if (record.nextDate) {
      setSuggestedNextDate(new Date(record.nextDate));
    } else if (techInfo?.timeIntervalMonths) {
      const nd = new Date();
      nd.setMonth(nd.getMonth() + techInfo.timeIntervalMonths);
      setSuggestedNextDate(nd);
    } else {
      setSuggestedNextDate(null);
    }

    openDetailsModal();
  };

  const handleIgnore = async () => {
    if (!selectedRecord) return;
    setSavingIgnore(true);
    try {
      await updateRecord.mutateAsync({
        where: { id: selectedRecord.id },
        data: { ignored: !selectedRecord.ignored },
      });
      notifications.show({ title: selectedRecord.ignored ? "Manutenção reativada" : "Manutenção ignorada", message: "", color: "blue" });
      closeDetailsModal();
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingIgnore(false);
    }
  };

  const handleSaveKm = async () => {
    if (!selectedRecord || !editKm || !editDate) return;
    const km = Number(editKm);
    const recordDate = new Date(editDate);
    recordDate.setHours(12, 0, 0, 0);
    setSavingKmEdit(true);
    try {
      await updateRecord.mutateAsync({
        where: { id: selectedRecord.id },
        data: { kmAtService: km, date: recordDate.toISOString() },
      });
      notifications.show({ title: "Manutenção atualizada!", message: "", color: "green" });
      setSelectedRecord({ ...selectedRecord, kmAtService: km, date: recordDate.toISOString() });
      refetch();
    } catch (e) {
      console.error(e);
      notifications.show({ title: "Erro", message: "Não foi possível salvar as alterações.", color: "red" });
    } finally {
      setSavingKmEdit(false);
    }
  };

  const handleSavePrediction = async () => {
    if (!selectedRecord) return;
    setSavingPrediction(true);
    try {
      let nextDate: string | null = null;
      if (suggestedNextDate) {
        const nd = new Date(suggestedNextDate);
        nd.setHours(12, 0, 0, 0);
        nextDate = nd.toISOString();
      }
      const nextKm = suggestedNextKm ? Number(suggestedNextKm) : null;

      await updateRecord.mutateAsync({
        where: { id: selectedRecord.id },
        data: { nextKm, nextDate },
      });
      notifications.show({ title: "Previsão atualizada!", message: "", color: "green" });
      setSelectedRecord({ ...selectedRecord, nextKm, nextDate });
      refetch();
    } catch (e) {
      console.error(e);
      notifications.show({ title: "Erro", message: "Não foi possível salvar a previsão.", color: "red" });
    } finally {
      setSavingPrediction(false);
    }
  };

  const handleSaveDone = async () => {
    if (!selectedRecord || !doneDate || !doneKm) return;
    setSavingDone(true);
    try {
      // Ajusta doneDate para o meio do dia local para evitar problemas de fuso horário na serialização
      const recordDate = new Date(doneDate);
      recordDate.setHours(12, 0, 0, 0);

      let nextKm: number | undefined = suggestedNextKm ? Number(suggestedNextKm) : undefined;
      let nextDate: string | undefined = undefined;

      if (suggestedNextDate) {
        const snd = new Date(suggestedNextDate);
        snd.setHours(12, 0, 0, 0);
        nextDate = snd.toISOString();
      }

      // Fall back to computing from technicalInfo if user didn't fill the suggestions
      if (!nextKm && !nextDate && selectedRecord.technicalInfoId) {
        const found = (vehicle as any).technicalInfos.find((t: any) => t.id === selectedRecord.technicalInfoId);
        if (found) {
          if (found.kmInterval) {
            nextKm = Number(doneKm) + found.kmInterval;
          }
          if (found.timeIntervalMonths) {
            const nd = new Date(recordDate);
            nd.setMonth(nd.getMonth() + found.timeIntervalMonths);
            nextDate = nd.toISOString();
          }
        }
      }

      const uploadedUrls: string[] = [];
      if (doneFiles.length > 0) {
        for (const file of doneFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${vehicle!.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('maintenance-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Upload error", uploadError);
            throw new Error("Erro ao fazer upload do anexo");
          }

          const { data: { publicUrl } } = supabase.storage
            .from('maintenance-attachments')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }
      }

      await createRecord.mutateAsync({
        data: {
          date: recordDate.toISOString(),
          kmAtService: Number(doneKm),
          description: selectedRecord.description,
          cost: doneCost ? Number(doneCost) : undefined,
          observations: doneObs || undefined,
          categoryId: selectedRecord.categoryId,
          technicalInfoId: selectedRecord.technicalInfoId,
          vehicleId: vehicle!.id,
          nextKm,
          nextDate,
          attachments: uploadedUrls,
        }
      });
      notifications.show({ title: "Manutenção registrada!", message: "Próximo ciclo agendado com sucesso.", color: "green" });
      closeDetailsModal();
      refetch();
    } catch (e) {
      console.error(e);
      notifications.show({ title: "Erro", message: "Não foi possível salvar.", color: "red" });
    } finally {
      setSavingDone(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!saleDate) return;
    if (shouldTransfer && !targetUserId) {
      notifications.show({ title: "Aviso", message: "Selecione o usuário de destino.", color: "orange" });
      return;
    }
    setSavingSale(true);
    try {
      let d: Date;
      const saleVal = saleDate as any;
      if (typeof saleVal === 'string' && saleVal.includes('-')) {
        const [year, month, day] = saleVal.split('-').map(Number);
        d = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        d = new Date(saleDate);
        d.setHours(12, 0, 0, 0);
      }

      if (shouldTransfer && targetUserId) {
        await transferVehicle(id, targetUserId, d);
        notifications.show({ title: "Veículo Transferido!", message: "Veículo marcado como vendido e transferido para o novo dono.", color: "green" });
      } else {
        await updateVehicle.mutateAsync({
          where: { id },
          data: { saleDate: d.toISOString() },
        });
        notifications.show({ title: "Veículo Vendido!", message: "Veículo marcado como vendido com sucesso.", color: "green" });
      }
      closeSellModal();
      refetch();
    } catch (e) {
      console.error(e);
      notifications.show({ title: "Erro", message: "Não foi possível realizar a venda/transferência.", color: "red" });
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

  const handleOpenNotes = () => {
    setNotesDraft([...(vehicle?.notes ?? [])]);
    setNewNoteText("");
    setNotesEditing(true);
  };

  const handleAddNote = () => {
    const trimmed = newNoteText.trim();
    if (!trimmed) return;
    setNotesDraft((prev) => [...prev, trimmed]);
    setNewNoteText("");
  };

  const handleRemoveNote = (index: number) => {
    setNotesDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveNotes = async () => {
    // Auto-inclui nota pendente caso o usuário não tenha clicado em "+"
    const finalNotes = newNoteText.trim()
      ? [...notesDraft, newNoteText.trim()]
      : notesDraft;
    setSavingNotes(true);
    try {
      await updateVehicle.mutateAsync({
        where: { id },
        data: { notes: { set: finalNotes } },
      });
      notifications.show({ title: "Notas salvas!", message: "", color: "green" });
      setNotesEditing(false);
      setNewNoteText("");
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
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
  const currentOwnerRecords = records.filter((r: any) => !r.previousOwner);
  const totalGasto: number = currentOwnerRecords.reduce(
    (acc: number, r: any) => acc + (r.cost ?? 0),
    0
  );
  const kmRodados = vehicle.currentKm - vehicle.initialKm;
  const custoPorKm = kmRodados > 0 ? totalGasto / kmRodados : 0;

  // ── Status de manutenções (4 níveis) ──────────────────────────────────────
  type AlertStatus = "overdue" | "critical" | "warning" | "notice" | null;
  type AlertReason = "km" | "data" | null;

  const now = new Date();
  const seenCategories = new Set<string>();
  const latestByCategory: any[] = []; // apenas o mais recente de cada categoria

  // records ordenados por data desc (já vem assim da query)
  records.forEach((r: any) => {
    if (!seenCategories.has(r.categoryId)) {
      seenCategories.add(r.categoryId);

      let status: AlertStatus = null;
      let reason: AlertReason = null;

      // Checar KM
      if (r.nextKm && !r.ignored) {
        const diffKm = r.nextKm - vehicle.currentKm;
        if (diffKm <= 0) { status = "overdue"; reason = "km"; }
        else if (diffKm <= 500) { status = "critical"; reason = "km"; }
        else if (diffKm <= 1000) { status = "warning"; reason = "km"; }
        else if (diffKm <= 2000) { status = "notice"; reason = "km"; }
      }

      // Checar Data (sobrescreve apenas se mais grave)
      if (r.nextDate && !r.ignored) {
        const nextD = new Date(r.nextDate);
        const diffDays = (nextD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        let dateStatus: AlertStatus = null;
        if (diffDays <= 0) dateStatus = "overdue";
        else if (diffDays <= 10) dateStatus = "critical";
        else if (diffDays <= 30) dateStatus = "warning";
        else if (diffDays <= 90) dateStatus = "notice";

        const severity = (s: AlertStatus) =>
          s === "overdue" ? 4 : s === "critical" ? 3 : s === "warning" ? 2 : s === "notice" ? 1 : 0;

        if (severity(dateStatus) > severity(status)) {
          status = dateStatus;
          reason = "data";
        } else if (severity(dateStatus) === severity(status) && dateStatus !== null) {
          reason = "km"; // km e data empatam - mantém km
        }
      }

      r._alertStatus = status;
      r._alertReason = reason;
      latestByCategory.push(r);
    }
  });

  const overdueRecords = latestByCategory.filter(r => r._alertStatus === "overdue" && !r.ignored);

  // 3 próximas a vencer (excluindo vencidas e ignoradas), ordenadas por urgência
  const upcoming = latestByCategory
    .filter(r => r._alertStatus && r._alertStatus !== "overdue" && !r.ignored)
    .sort((a, b) => {
      const scoreA = (a._alertStatus === "critical" ? 3 : a._alertStatus === "warning" ? 2 : 1);
      const scoreB = (b._alertStatus === "critical" ? 3 : b._alertStatus === "warning" ? 2 : 1);
      return scoreB - scoreA;
    })
    .slice(0, 3);

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

      {overdueRecords.length > 0 && (
        <Alert variant="outline" color="red" title="Manutenções Vencidas" icon={<IconAlertTriangle />} mb="sm">
          <Stack gap={6} mt={4}>
            {overdueRecords.map(r => (
              <Group key={r.id} justify="space-between" wrap="wrap" gap={4}>
                <Text size="sm" fw={600}>{r.description} <Text span c="red.2">({r.category.name})</Text></Text>
                <Group gap={6}>
                  {r.nextKm && r.nextKm <= vehicle.currentKm && (
                    <Badge color="red" variant="white" size="xs">KM: {r.nextKm.toLocaleString("pt-BR")}</Badge>
                  )}
                  {r.nextDate && new Date(r.nextDate) <= now && (
                    <Badge color="red" variant="white" size="xs">Data: {formatLocalDate(r.nextDate)}</Badge>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </Alert>
      )}

      {upcoming.length > 0 && (
        <Alert variant="light" color="orange" title="Próximas Manutenções" icon={<IconAlertTriangle />} mb="xl">
          <Stack gap={6} mt={4}>
            {upcoming.map(r => (
              <Group key={r.id} justify="space-between" wrap="wrap" gap={4}>
                <Text size="sm" fw={500}>{r.description} <Text span c="dimmed">({r.category.name})</Text></Text>
                <Group gap={6}>
                  <Badge size="xs" color={r._alertStatus === "critical" ? "orange" : r._alertStatus === "warning" ? "yellow" : "gray"} variant="filled">
                    {r._alertStatus === "critical" ? "Crítico" : r._alertStatus === "warning" ? "Atenção" : "Próxima"}
                  </Badge>
                  {r.nextKm && <Badge color="indigo" variant="light" size="xs">KM: {r.nextKm.toLocaleString("pt-BR")}</Badge>}
                  {r.nextDate && <Badge color="violet" variant="light" size="xs">Data: {formatLocalDate(r.nextDate)}</Badge>}
                </Group>
              </Group>
            ))}
          </Stack>
        </Alert>
      )}

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
            {((vehicle as any).frontTirePressure || (vehicle as any).rearTirePressure || (vehicle as any).fuelTankCapacity) && (
              <Text size="xs" c="dimmed" mt={4}>
                {(vehicle as any).frontTirePressure ? `Calibragem Dianteira: ${(vehicle as any).frontTirePressure} psi` : ""}
                {(vehicle as any).frontTirePressure && (vehicle as any).rearTirePressure ? " / " : ""}
                {(vehicle as any).rearTirePressure ? `Traseira: ${(vehicle as any).rearTirePressure} psi` : ""}
                {((vehicle as any).frontTirePressure || (vehicle as any).rearTirePressure) && (vehicle as any).fuelTankCapacity ? " • " : ""}
                {(vehicle as any).fuelTankCapacity ? `Tanque: ${(vehicle as any).fuelTankCapacity} litros` : ""}
              </Text>
            )}
          </div>
          <Group>
            {vehicle.saleDate ? (
              <Badge color="red" size="lg" leftSection={<IconCheck size={14} />}>
                Vendido em {formatLocalDate(vehicle.saleDate)}
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
            description={`KM atual: ${vehicle.currentKm.toLocaleString("pt-BR")} km`}
            placeholder="Informe o novo KM"
            hideControls
            suffix=" km"
            min={vehicle.currentKm}
            value={newKm}
            onChange={setNewKm}
            style={{ flex: 1 }}
          />
          <Button onClick={handleUpdateKm} loading={savingKm} disabled={!newKm}>
            Atualizar
          </Button>
        </Group>

        <Divider my="md" label="Notas" />

        {/* Seção de Notas */}
        {!notesEditing ? (
          <Stack gap="xs">
            {vehicle.notes.length === 0 ? (
              <Text c="dimmed" size="sm" fs="italic">Nenhuma nota cadastrada.</Text>
            ) : (
              vehicle.notes.map((note, i) => (
                <Group key={i} gap="xs" align="flex-start" wrap="nowrap"
                  style={{
                    borderLeft: "3px solid var(--mantine-color-blue-4)",
                    paddingLeft: "var(--mantine-spacing-xs)",
                  }}
                >
                  <IconNote size={14} color="var(--mantine-color-blue-5)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Text size="sm" style={{ flex: 1, whiteSpace: "pre-wrap" }}>{note}</Text>
                </Group>
              ))
            )}
            <Group justify="flex-end" mt={4}>
              <Button
                size="xs"
                variant="subtle"
                leftSection={<IconNote size={14} />}
                onClick={handleOpenNotes}
              >
                {vehicle.notes.length === 0 ? "Adicionar notas" : "Editar notas"}
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="sm">
            {notesDraft.map((note, i) => (
              <Group key={i} gap="xs" align="flex-start" wrap="nowrap">
                <Textarea
                  value={note}
                  onChange={(e) => {
                    const updated = [...notesDraft];
                    updated[i] = e.currentTarget.value;
                    setNotesDraft(updated);
                  }}
                  autosize
                  minRows={1}
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Tooltip label="Remover nota">
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    mt={4}
                    onClick={() => handleRemoveNote(i)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ))}

            <Group gap="xs" align="flex-end">
              <Textarea
                placeholder="Nova nota..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.currentTarget.value)}
                autosize
                minRows={1}
                style={{ flex: 1 }}
                size="sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <Tooltip label="Adicionar nota (Enter)">
                <ActionIcon variant="light" onClick={handleAddNote} disabled={!newNoteText.trim()} mb={1}>
                  <IconPlus size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Group justify="flex-end" gap="xs" mt={4}>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => setNotesEditing(false)}
                disabled={savingNotes}
              >
                Cancelar
              </Button>
              <Button size="xs" onClick={handleSaveNotes} loading={savingNotes}>
                Salvar notas
              </Button>
            </Group>
          </Stack>
        )}
      </Card>

      {/* ─── Plano de Manutenção (Referência) ─── */}
      <Group justify="space-between" mb="xs" style={{ cursor: "pointer" }} onClick={() => setPlanOpened(o => !o)}>
        <Group gap="xs">
          <IconSettings size={20} />
          <Title order={3}>Plano de Manutenção</Title>
          {(vehicle as any).technicalInfos.length > 0 && (
            <Badge variant="light" color="gray" size="sm">{(vehicle as any).technicalInfos.length}</Badge>
          )}
        </Group>
        <Group gap="xs">
          <Button size="sm" variant="subtle" leftSection={<IconPlus size={16} />} onClick={(e) => { e.stopPropagation(); openTechModal(); }}>
            Adicionar
          </Button>
          {planOpened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </Group>
      </Group>

      <Collapse expanded={planOpened} mb="xl">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {(vehicle as any).technicalInfos.length === 0 ? (
            <Text c="dimmed" size="sm">Nenhuma referência técnica cadastrada.</Text>
          ) : (
            (vehicle as any).technicalInfos.map((info: any) => (
              <div
                key={info.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedTechInfo(info);
                  openEditTechModal();
                }}
              >
                <TechnicalInfoCard
                  description={info.description}
                  notes={info.notes}
                  categoryName={info.category.name}
                  kmInterval={info.kmInterval}
                  timeIntervalMonths={info.timeIntervalMonths}
                />
              </div>
            ))
          )}
        </SimpleGrid>
      </Collapse>

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

      {records.length > 0 && (
        <Group mb="md" gap="sm" align="flex-end" wrap="wrap">
          <TextInput
            placeholder="Pesquisar manutenção..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 200 }}
            size="sm"
          />
          <SegmentedControl
            size="sm"
            value={groupBy}
            onChange={(v) => {
              setGroupBy(v as "list" | "category");
              setCategoryFilter(null);
            }}
            data={[
              { label: "Lista", value: "list" },
              { label: "Por categoria", value: "category" },
            ]}
          />
          {groupBy === "category" && (() => {
            const cats: { value: string; label: string }[] = Array.from(
              new Map<string, string>(records.map((r: any) => [r.categoryId as string, r.category.name as string])).entries()
            ).map(([value, label]) => ({ value, label }));
            return (
              <Select
                size="sm"
                placeholder="Todas as categorias"
                clearable
                data={cats}
                value={categoryFilter}
                onChange={(v) => setCategoryFilter(v)}
                style={{ minWidth: 180 }}
              />
            );
          })()}
        </Group>
      )}

      {(() => {
        if (records.length === 0) {
          return <Text c="dimmed" size="sm">Nenhuma manutenção registrada ainda.</Text>;
        }

        const searchLower = search.toLowerCase();
        const filtered: any[] = records.filter((r: any) =>
          r.description.toLowerCase().includes(searchLower) ||
          r.category.name.toLowerCase().includes(searchLower)
        );

        if (filtered.length === 0) {
          return <Text c="dimmed" size="sm">Nenhum resultado para "{search}".</Text>;
        }

        const statusOrder: Record<string, number> = {
          overdue: 0, critical: 1, warning: 2, notice: 3,
        };
        const sorted = [...filtered].sort((a, b) => {
          const sa = a._alertStatus && !a.ignored ? (statusOrder[a._alertStatus] ?? 4) : 4;
          const sb = b._alertStatus && !b.ignored ? (statusOrder[b._alertStatus] ?? 4) : 4;
          return sa - sb;
        });

        const renderCard = (record: any) => (
          <MaintenanceRecordCard
            key={record.id}
            date={record.date}
            kmAtService={record.kmAtService}
            description={record.description}
            categoryName={record.category.name}
            cost={record.cost}
            nextDate={record.nextDate}
            nextKm={record.nextKm}
            alertStatus={record._alertStatus}
            alertReason={record._alertReason}
            ignored={record.ignored}
            observations={record.observations}
            previousOwner={record.previousOwner}
            onClick={() => handleOpenDetails(record)}
          />
        );

        if (groupBy === "list") {
          return (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
              {sorted.map(renderCard)}
            </SimpleGrid>
          );
        }

        // Group by category — show only most recent per category (first in desc order)
        const grouped = new Map<string, { categoryName: string; records: any[] }>();
        sorted.forEach((r: any) => {
          if (!grouped.has(r.categoryId)) {
            grouped.set(r.categoryId, { categoryName: r.category.name, records: [] });
          }
          grouped.get(r.categoryId)!.records.push(r);
        });

        const groupEntries = categoryFilter
          ? Array.from(grouped.entries()).filter(([id]) => id === categoryFilter)
          : Array.from(grouped.entries());

        return (
          <Stack gap="lg" mb="xl">
            {groupEntries.map(([, { categoryName, records: catRecords }]) => (
              <div key={categoryName}>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">{categoryName}</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {catRecords.map(renderCard)}
                </SimpleGrid>
              </div>
            ))}
          </Stack>
        );
      })()}

      {/* ─── Modais ─── */}
      <Modal opened={sellModalOpened} onClose={closeSellModal} title="Marcar Veículo como Vendido">
        <DatePickerInput
          label="Data da Venda"
          placeholder="Selecione a data"
          valueFormat="DD/MM/YYYY"
          value={saleDate}
          onChange={(val) => setSaleDate(val as Date | null)}
          mb="md"
        />

        <Checkbox
          label="Transferir posse para outro usuário da plataforma"
          description="O novo proprietário terá uma cópia do veículo com o histórico de manutenções herdado (com custos e km zerados para ele)."
          checked={shouldTransfer}
          onChange={(e) => setShouldTransfer(e.currentTarget.checked)}
          mb="md"
        />

        {shouldTransfer && (
          <Select
            label="Selecione o Usuário de Destino"
            placeholder="Escolha um usuário"
            data={availableUsers.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            value={targetUserId}
            onChange={setTargetUserId}
            searchable
            clearable
            mb="md"
            withAsterisk
          />
        )}

        <Group justify="flex-end" mt="lg">
          <Button variant="subtle" onClick={closeSellModal}>Cancelar</Button>
          <Button 
            onClick={handleMarkAsSold} 
            loading={savingSale} 
            disabled={!saleDate || (shouldTransfer && !targetUserId)}
          >
            Confirmar
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

      <Modal opened={editTechModalOpened} onClose={closeEditTechModal} title="Editar Referência Técnica">
        {selectedTechInfo && (
          <TechnicalInfoForm
            vehicleId={vehicle.id}
            initialData={selectedTechInfo}
            onSuccess={() => { closeEditTechModal(); setSelectedTechInfo(null); refetch(); }}
            onCancel={() => { closeEditTechModal(); setSelectedTechInfo(null); }}
          />
        )}
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

      <MaintenanceDetailsModal
        opened={detailsModalOpened}
        onClose={closeDetailsModal}
        record={selectedRecord}
        editDate={editDate}
        setEditDate={setEditDate}
        editKm={editKm}
        setEditKm={setEditKm}
        savingKmEdit={savingKmEdit}
        onSaveKm={handleSaveKm}
        savingIgnore={savingIgnore}
        onIgnore={handleIgnore}
        markAsDone={markAsDone}
        setMarkAsDone={setMarkAsDone}
        doneDate={doneDate}
        setDoneDate={setDoneDate}
        doneKm={doneKm}
        setDoneKm={setDoneKm}
        doneCost={doneCost}
        setDoneCost={setDoneCost}
        doneObs={doneObs}
        setDoneObs={setDoneObs}
        doneFiles={doneFiles}
        setDoneFiles={setDoneFiles}
        suggestedNextKm={suggestedNextKm}
        setSuggestedNextKm={setSuggestedNextKm}
        suggestedNextDate={suggestedNextDate}
        setSuggestedNextDate={setSuggestedNextDate}
        savingPrediction={savingPrediction}
        onSavePrediction={handleSavePrediction}
        savingDone={savingDone}
        onSaveDone={handleSaveDone}
      />
    </Container>
  );
}

