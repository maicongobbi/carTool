"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  FileInput,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconExternalLink, IconFile, IconUpload } from "@tabler/icons-react";

interface MaintenanceDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  record: any;
  // Ignore
  savingIgnore: boolean;
  onIgnore: () => void;
  // Realize again
  markAsDone: boolean;
  setMarkAsDone: (v: boolean) => void;
  doneDate: Date | null;
  setDoneDate: (v: Date | null) => void;
  doneKm: number | string;
  setDoneKm: (v: number | string) => void;
  doneCost: number | string;
  setDoneCost: (v: number | string) => void;
  doneObs: string;
  setDoneObs: (v: string) => void;
  doneFiles: File[];
  setDoneFiles: (v: File[]) => void;
  suggestedNextKm: number | string;
  setSuggestedNextKm: (v: number | string) => void;
  suggestedNextDate: Date | null;
  setSuggestedNextDate: (v: Date | null) => void;
  savingDone: boolean;
  onSaveDone: () => void;
}

export function MaintenanceDetailsModal({
  opened,
  onClose,
  record,
  savingIgnore,
  onIgnore,
  markAsDone,
  setMarkAsDone,
  doneDate,
  setDoneDate,
  doneKm,
  setDoneKm,
  doneCost,
  setDoneCost,
  doneObs,
  setDoneObs,
  doneFiles,
  setDoneFiles,
  suggestedNextKm,
  setSuggestedNextKm,
  suggestedNextDate,
  setSuggestedNextDate,
  savingDone,
  onSaveDone,
}: MaintenanceDetailsModalProps) {
  if (!record) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Detalhes da Manutenção" size="md">
      <Stack>
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text fw={600} size="lg">{record.description}</Text>
            <Badge variant="light" color="teal" size="sm">{record.category.name}</Badge>
          </Stack>
          {record.ignored && <Badge color="gray">Ignorada</Badge>}
        </Group>

        {/* Dados */}
        <Group grow>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Data do Serviço</Text>
            <Text fw={500}>{new Date(record.date).toLocaleDateString("pt-BR")}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">KM no Ato</Text>
            <Text fw={500}>{record.kmAtService.toLocaleString("pt-BR")} km</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Custo</Text>
            <Text fw={500}>
              {record.cost
                ? record.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "—"}
            </Text>
          </Stack>
        </Group>

        {record.observations && (
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Observações</Text>
            <Text size="sm">{record.observations}</Text>
          </Stack>
        )}

        {record.attachments && record.attachments.length > 0 && (
          <Stack gap={4}>
            <Text size="xs" c="dimmed">Anexos ({record.attachments.length})</Text>
            <Group gap="xs">
              {record.attachments.map((url: string, index: number) => (
                <Button
                  key={index}
                  component="a"
                  href={url}
                  target="_blank"
                  variant="light"
                  size="xs"
                  leftSection={<IconFile size={14} />}
                  rightSection={<IconExternalLink size={14} />}
                >
                  Anexo {index + 1}
                </Button>
              ))}
            </Group>
          </Stack>
        )}

        {/* Previsão próxima — editável */}
        {(suggestedNextDate || suggestedNextKm) && (
          <Alert title="Previsão da próxima manutenção" color="blue" variant="light">
            <Group grow mt={6}>
              <DatePickerInput
                label="Data prevista"
                valueFormat="DD/MM/YYYY"
                clearable
                size="xs"
                value={suggestedNextDate}
                onChange={(val) => setSuggestedNextDate(val as Date | null)}
              />
              <NumberInput
                label="KM previsto"
                hideControls
                suffix=" km"
                size="xs"
                value={suggestedNextKm}
                onChange={setSuggestedNextKm}
              />
            </Group>
          </Alert>
        )}

        <Divider />

        {/* Ações */}
        <Checkbox
          label={record.ignored ? "Reativar esta manutenção" : "Ignorar esta manutenção"}
          description={record.ignored
            ? "Ela voltará a aparecer nos alertas."
            : "Ela não aparecerá mais em vermelho ou nos alertas."}
          checked={record.ignored ? true : undefined}
          onChange={onIgnore}
          color={record.ignored ? "blue" : "gray"}
          disabled={savingIgnore}
        />

        <Checkbox
          label="Realizar esta manutenção novamente"
          description="Cria um novo registro com base neste serviço."
          checked={markAsDone}
          onChange={(e) => setMarkAsDone(e.currentTarget.checked)}
          disabled={savingIgnore}
        />

        {markAsDone && (
          <Card withBorder padding="sm" radius="md" bg="var(--mantine-color-gray-0)">
            <Stack gap="sm">
              <Group grow>
                <DatePickerInput
                  label="Data"
                  placeholder="Data da manutenção"
                  valueFormat="DD/MM/YYYY"
                  value={doneDate}
                  onChange={(val) => setDoneDate(val as Date | null)}
                  withAsterisk
                />
                <NumberInput
                  label="KM atual"
                  hideControls
                  suffix=" km"
                  value={doneKm}
                  onChange={setDoneKm}
                  withAsterisk
                />
              </Group>
              <NumberInput
                label="Custo (R$)"
                placeholder="Opcional"
                prefix="R$ "
                decimalSeparator=","
                thousandSeparator="."
                decimalScale={2}
                fixedDecimalScale
                hideControls
                value={doneCost}
                onChange={setDoneCost}
              />
              <Textarea
                label="Observações"
                placeholder="Opcional"
                minRows={2}
                value={doneObs}
                onChange={(e) => setDoneObs(e.currentTarget.value)}
              />
              <FileInput
                label="Anexos"
                placeholder="Até 5 arquivos"
                multiple
                accept="image/png,image/jpeg,application/pdf"
                leftSection={<IconUpload size={14} />}
                value={doneFiles}
                onChange={(payload) => {
                  if (payload.length > 5) {
                    alert("Você só pode anexar até 5 arquivos.");
                    setDoneFiles(payload.slice(0, 5));
                  } else {
                    setDoneFiles(payload);
                  }
                }}
                clearable
              />
              <Button
                onClick={onSaveDone}
                loading={savingDone}
                disabled={!doneDate || !doneKm}
                fullWidth
                mt="md"
              >
                Registrar Nova Ocorrência
              </Button>
            </Stack>
          </Card>
        )}
      </Stack>
    </Modal>
  );
}
