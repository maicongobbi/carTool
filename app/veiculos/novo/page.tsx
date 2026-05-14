"use client";

import { useSession } from "@/app/lib/auth-client";
import { useCreateVehicle } from "@/app/lib/hooks";
import {
  Button,
  Container,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovoVeiculoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const createVehicle = useCreateVehicle();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      type: "Carro",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      modelYear: new Date().getFullYear(),
      currentKm: 0,
      purchasePrice: undefined as number | undefined,
      purchaseDate: null as Date | null,
      fipeCode: "",
    },
    validate: {
      brand: (value) => (value.trim().length === 0 ? "A marca é obrigatória" : null),
      model: (value) => (value.trim().length === 0 ? "O modelo é obrigatório" : null),
      year: (value) => (value < 1900 || value > 2100 ? "Ano inválido" : null),
      currentKm: (value) => (value < 0 ? "A quilometragem não pode ser negativa" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const vehicle = await createVehicle.mutateAsync({
        data: {
          type: values.type,
          brand: values.brand,
          model: values.model,
          year: values.year,
          modelYear: values.modelYear,
          initialKm: values.currentKm,
          currentKm: values.currentKm,
          purchasePrice: values.purchasePrice,
          purchaseDate: values.purchaseDate ? new Date(values.purchaseDate).toISOString() : undefined,
          fipeCode: values.fipeCode || undefined,
          userId: session!.user.id,
        },
      });

      notifications.show({
        title: "Sucesso!",
        message: "Veículo cadastrado com sucesso.",
        color: "green",
      });

      // Redireciona para a página do veículo recém-criado
      router.push(`/veiculos/${vehicle?.id}`);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Erro",
        message: "Ocorreu um erro ao cadastrar o veículo. Tente novamente.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Group mb="xl">
        <Button
          component={Link}
          href="/home"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Voltar
        </Button>
      </Group>

      <Title order={2} mb="xs">
        Cadastrar Veículo
      </Title>
      <Text c="dimmed" mb="xl">
        Preencha as informações do seu veículo
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Select
            label="Tipo de Veículo"
            placeholder="Selecione o tipo"
            data={["Carro", "Moto", "Bicicleta"]}
            withAsterisk
            {...form.getInputProps("type")}
          />

          <TextInput
            label="Marca"
            placeholder="Ex: Honda, Volkswagen, Trek"
            withAsterisk
            {...form.getInputProps("brand")}
          />

          <TextInput
            label="Modelo"
            placeholder="Ex: Civic, Gol, Marlin 5"
            withAsterisk
            {...form.getInputProps("model")}
          />

          <Group grow>
            <NumberInput
              label="Ano de Fabricação"
              placeholder="Ex: 2020"
              withAsterisk
              hideControls
              {...form.getInputProps("year")}
            />
            <NumberInput
              label="Ano do Modelo"
              placeholder="Ex: 2021"
              hideControls
              {...form.getInputProps("modelYear")}
            />
          </Group>

          <NumberInput
            label="Quilometragem Atual (KM)"
            placeholder="Ex: 15000"
            withAsterisk
            min={0}
            hideControls
            suffix=" km"
            {...form.getInputProps("currentKm")}
          />

          <TextInput
            label="Código Tabela FIPE"
            placeholder="Opcional"
            {...form.getInputProps("fipeCode")}
          />

          <DateInput
            label="Data de Aquisição"
            placeholder="Selecione a data"
            valueFormat="DD/MM/YYYY"
            clearable
            {...form.getInputProps("purchaseDate")}
          />

          <NumberInput
            label="Valor Pago"
            placeholder="Ex: 50.000,00"
            prefix="R$ "
            decimalSeparator=","
            thousandSeparator="."
            decimalScale={2}
            fixedDecimalScale
            hideControls
            {...form.getInputProps("purchasePrice")}
          />
        </SimpleGrid>

        <Group justify="flex-end" mt="xl">
          <Button
            type="submit"
            leftSection={<IconDeviceFloppy size={16} />}
            loading={loading}
          >
            Salvar Veículo
          </Button>
        </Group>
      </form>
    </Container>
  );
}
