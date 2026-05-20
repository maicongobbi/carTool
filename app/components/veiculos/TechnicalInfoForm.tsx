import { useCreateTechnicalInfo, useUpdateTechnicalInfo } from "@/app/lib/hooks";
import { Button, Group, NumberInput, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CategorySelect } from "./CategorySelect";
import { useState } from "react";

interface TechnicalInfoData {
  id: string;
  description: string;
  notes?: string | null;
  categoryId: string;
  kmInterval?: number | null;
  timeIntervalMonths?: number | null;
}

interface TechnicalInfoFormProps {
  vehicleId: string;
  initialData?: TechnicalInfoData;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TechnicalInfoForm({ vehicleId, initialData, onSuccess, onCancel }: TechnicalInfoFormProps) {
  const createInfo = useCreateTechnicalInfo();
  const updateInfo = useUpdateTechnicalInfo();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    initialValues: {
      description: initialData?.description ?? "",
      notes: initialData?.notes ?? "",
      categoryId: initialData?.categoryId ?? null as string | null,
      kmInterval: initialData?.kmInterval ?? undefined as number | undefined,
      timeIntervalMonths: initialData?.timeIntervalMonths ?? undefined as number | undefined,
    },
    validate: {
      description: (v) => (!v.trim() ? "Descrição obrigatória" : null),
      categoryId: (v) => (!v ? "Categoria obrigatória" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (isEditing) {
        await updateInfo.mutateAsync({
          where: { id: initialData.id },
          data: {
            description: values.description,
            notes: values.notes || null,
            categoryId: values.categoryId!,
            kmInterval: values.kmInterval || null,
            timeIntervalMonths: values.timeIntervalMonths || null,
          },
        });
      } else {
        await createInfo.mutateAsync({
          data: {
            description: values.description,
            notes: values.notes || null,
            categoryId: values.categoryId!,
            vehicleId: vehicleId,
            kmInterval: values.kmInterval || null,
            timeIntervalMonths: values.timeIntervalMonths || null,
          },
        });
      }
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
        <TextInput
          label="Descrição"
          placeholder="Ex: Troca de óleo e filtro"
          withAsterisk
          {...form.getInputProps("description")}
        />

        <Textarea
          label="Recomendações Técnicas"
          placeholder="Ex: Usar óleo 5w40 sintético, substituir o filtro junto"
          minRows={2}
          autosize
          {...form.getInputProps("notes")}
        />

        <CategorySelect
          value={form.values.categoryId}
          onChange={(val) => form.setFieldValue("categoryId", val)}
          error={form.errors.categoryId as string}
        />

        <Group grow>
          <NumberInput
            label="A cada (KM)"
            placeholder="Ex: 10000"
            min={0}
            hideControls
            suffix=" km"
            {...form.getInputProps("kmInterval")}
          />
          <NumberInput
            label="A cada (Meses)"
            placeholder="Ex: 12"
            min={0}
            hideControls
            suffix=" meses"
            {...form.getInputProps("timeIntervalMonths")}
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
