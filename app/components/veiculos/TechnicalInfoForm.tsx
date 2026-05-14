import { useCreateTechnicalInfo } from "@/app/lib/hooks";
import { Button, Group, NumberInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CategorySelect } from "./CategorySelect";
import { useState } from "react";

interface TechnicalInfoFormProps {
  vehicleId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TechnicalInfoForm({ vehicleId, onSuccess, onCancel }: TechnicalInfoFormProps) {
  const createInfo = useCreateTechnicalInfo();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      description: "",
      categoryId: null as string | null,
      kmInterval: undefined as number | undefined,
      timeIntervalMonths: undefined as number | undefined,
    },
    validate: {
      description: (v) => (!v.trim() ? "Descrição obrigatória" : null),
      categoryId: (v) => (!v ? "Categoria obrigatória" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await createInfo.mutateAsync({
        data: {
          description: values.description,
          categoryId: values.categoryId!,
          vehicleId: vehicleId,
          kmInterval: values.kmInterval || null,
          timeIntervalMonths: values.timeIntervalMonths || null,
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
        <TextInput
          label="Descrição"
          placeholder="Ex: Óleo 5w40 Sintético"
          withAsterisk
          {...form.getInputProps("description")}
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
            Salvar
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
