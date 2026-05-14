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
} from "@mantine/core";
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
      }
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await createRecord.mutateAsync({
        data: {
          date: values.date!.toISOString(),
          kmAtService: values.kmAtService,
          description: values.description,
          cost: values.cost,
          nextDate: values.nextDate ? values.nextDate.toISOString() : undefined,
          nextKm: values.nextKm,
          categoryId: values.categoryId!,
          vehicleId,
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

        <CategorySelect
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
