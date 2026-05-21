"use client";

import { useFindManyTechnicalInfo, useCreateMaintenanceRecord } from "@/app/lib/hooks";
import {
  Button,
  Divider,
  Group,
  NumberInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  FileInput,
} from "@mantine/core";
import { IconUpload, IconBulb } from "@tabler/icons-react";
import { supabase } from "@/app/lib/supabase-client";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { CategorySelect } from "./CategorySelect";
import { Select } from "@mantine/core";

interface MaintenanceRecordFormProps {
  vehicleId: string;
  vehicleCurrentKm: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MaintenanceRecordForm({
  vehicleId,
  vehicleCurrentKm,
  onSuccess,
  onCancel,
}: MaintenanceRecordFormProps) {
  const createRecord = useCreateMaintenanceRecord();
  const [loading, setLoading] = useState(false);
  const [useReference, setUseReference] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const { data: technicalInfos } = useFindManyTechnicalInfo({
    where: { vehicleId },
    include: { category: true },
  });

  const form = useForm({
    initialValues: {
      date: new Date() as Date | null,
      kmAtService: vehicleCurrentKm,
      description: "",
      cost: undefined as number | undefined,
      nextDate: null as Date | null,
      nextKm: undefined as number | undefined,
      categoryId: null as string | null,
      technicalInfoId: null as string | null,
      observations: "",
    },
    validate: {
      date: (v) => (!v ? "Data obrigatória" : null),
      kmAtService: (v) => (v < 0 ? "KM inválido" : null),
      description: (v) => (!v.trim() ? "Descrição obrigatória" : null),
      categoryId: (v) => (!v ? "Categoria obrigatória" : null),
    },
  });

  const technicalInfoOptions =
    technicalInfos?.map((info) => ({
      value: info.id,
      label: `${info.description} (${(info as any).category?.name ?? ""})`,
    })) ?? [];

  const handleReferenceSelect = (id: string | null) => {
    form.setFieldValue("technicalInfoId", id);
    if (id) {
      const found = technicalInfos?.find((t) => t.id === id);
      if (found) {
        form.setFieldValue("description", found.description);
        form.setFieldValue("categoryId", found.categoryId);
        
        if (found.kmInterval) {
          form.setFieldValue("nextKm", form.values.kmAtService + found.kmInterval);
        } else {
          form.setFieldValue("nextKm", undefined);
        }

        if (found.timeIntervalMonths) {
          const maintenanceDate = form.values.date || new Date();
          const nextD = new Date(maintenanceDate);
          nextD.setMonth(nextD.getMonth() + found.timeIntervalMonths);
          form.setFieldValue("nextDate", nextD);
        } else {
          form.setFieldValue("nextDate", null);
        }
      }
    } else {
      form.setFieldValue("description", "");
      form.setFieldValue("categoryId", null);
      form.setFieldValue("nextKm", undefined);
      form.setFieldValue("nextDate", null);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${vehicleId}/${fileName}`;

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
          date: new Date(values.date!).toISOString(),
          kmAtService: values.kmAtService,
          description: values.description,
          cost: values.cost,
          nextDate: values.nextDate ? new Date(values.nextDate).toISOString() : undefined,
          nextKm: values.nextKm,
          categoryId: values.categoryId!,
          vehicleId,
          observations: values.observations || undefined,
          attachments: uploadedUrls,
          ...(values.technicalInfoId ? { technicalInfoId: values.technicalInfoId } : {}),
        },
      });
      onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Group grow>
          <DatePickerInput
            label="Data da Manutenção"
            placeholder="Selecione a data"
            valueFormat="DD/MM/YYYY"
            withAsterisk
            {...form.getInputProps("date")}
          />
          <NumberInput
            label="KM no Ato"
            hideControls
            suffix=" km"
            withAsterisk
            {...form.getInputProps("kmAtService")}
          />
        </Group>

        {technicalInfoOptions.length > 0 && (
          <Switch
            label="Basear em referência do Plano"
            checked={useReference}
            onChange={(e) => {
              setUseReference(e.currentTarget.checked);
              if (!e.currentTarget.checked) {
                form.setFieldValue("technicalInfoId", null);
                form.setFieldValue("description", "");
                form.setFieldValue("categoryId", null);
                form.setFieldValue("nextKm", undefined);
                form.setFieldValue("nextDate", null);
              }
            }}
          />
        )}

        {useReference && (
          <Select
            label="Referência do Plano de Manutenção"
            placeholder="Selecione um item"
            data={technicalInfoOptions}
            value={form.values.technicalInfoId}
            onChange={handleReferenceSelect}
            clearable
          />
        )}


        <TextInput
          label="Descrição do Serviço"
          placeholder="Ex: Troca de óleo e filtro"
          withAsterisk
          disabled={useReference && !!form.values.technicalInfoId}
          {...form.getInputProps("description")}
        />

        {/* Nota sugerida: aparece logo abaixo da descrição */}
        {useReference && form.values.technicalInfoId && (() => {
          const found = technicalInfos?.find((t) => t.id === form.values.technicalInfoId);
          return found?.notes ? (
            <Group
              gap="xs"
              align="flex-start"
              style={{
                borderLeft: "3px solid var(--mantine-color-blue-4)",
                paddingLeft: "var(--mantine-spacing-xs)",
              }}
            >
              <IconBulb
                size={13}
                color="var(--mantine-color-blue-5)"
                style={{ marginTop: 1, flexShrink: 0 }}
              />
              <Text size="xs" c="blue.6" fs="italic" style={{ flex: 1 }}>
                {found.notes}
              </Text>
            </Group>
          ) : null;
        })()}

        <CategorySelect
          vehicleId={vehicleId}
          value={form.values.categoryId}
          onChange={(val) => form.setFieldValue("categoryId", val)}
          error={form.errors.categoryId as string}
        />

        <NumberInput
          label="Valor Gasto (R$)"
          placeholder="Ex: 250,00"
          prefix="R$ "
          decimalSeparator=","
          thousandSeparator="."
          decimalScale={2}
          fixedDecimalScale
          hideControls
          {...form.getInputProps("cost")}
        />

        <Textarea
          label="Observações"
          placeholder="Anotações adicionais sobre o serviço"
          minRows={3}
          {...form.getInputProps("observations")}
        />

        <FileInput
          label="Anexos (Notas Fiscais, Fotos)"
          placeholder="Selecione até 5 arquivos"
          multiple
          accept="image/png,image/jpeg,application/pdf"
          leftSection={<IconUpload size={14} />}
          value={files}
          onChange={(payload) => {
            if (payload.length > 5) {
              alert("Você só pode anexar até 5 arquivos por manutenção.");
              setFiles(payload.slice(0, 5));
            } else {
              setFiles(payload);
            }
          }}
          clearable
        />

        <Divider label="Próxima Manutenção (opcional)" />

        <Group grow>
          <DatePickerInput
            label="Data Prevista"
            placeholder="Selecione a data"
            valueFormat="DD/MM/YYYY"
            clearable
            {...form.getInputProps("nextDate")}
          />
          <NumberInput
            label="KM Previsto"
            hideControls
            suffix=" km"
            placeholder="Ex: 120000"
            {...form.getInputProps("nextKm")}
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Registrar Manutenção
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
