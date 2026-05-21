"use client";

import { useFindManyVehicle } from "@/app/lib/hooks";
import { formatLocalDate } from "@/app/lib/date-utils";
import { Button, Card, Container, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { IconCar, IconPlus } from "@tabler/icons-react";
import Link from "next/link";

export default function HomePage() {
  const { data: vehicles, isLoading } = useFindManyVehicle({
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container size="md" py="xl">
      <Title order={2} ta="center" mb="sm">
        Bem-vindo ao carTool! 🚗
      </Title>
      <Text c="dimmed" ta="center" mb="xl">
        Escolha um dos seus veículos para gerenciar ou cadastre um novo.
      </Text>

      {isLoading ? (
        <Group justify="center" gap="lg">
          <Skeleton height={200} width={300} radius="md" />
          <Skeleton height={200} width={300} radius="md" />
        </Group>
      ) : (
        <Group justify="center" gap="lg">
          {/* Veículos Cadastrados */}
          {vehicles?.map((vehicle) => (
            <Card key={vehicle.id} withBorder padding="lg" radius="md" shadow="sm" w={300}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>
                  {vehicle.brand} {vehicle.model}
                </Title>
                <IconCar size={24} stroke={1.5} />
              </Group>
              
              <Stack gap={2} mb="lg" mih={60} justify="center">
                <Text size="sm" c="dimmed">Ano: {vehicle.year}</Text>
                <Text size="sm" c="dimmed">KM Atual: {vehicle.currentKm.toLocaleString("pt-BR")} km</Text>
                {vehicle.saleDate && (
                  <Text size="xs" c="red" fw={600} mt={2}>
                    Vendido em {formatLocalDate(vehicle.saleDate)}
                  </Text>
                )}
              </Stack>

              <Button
                component={Link}
                href={`/veiculos/${vehicle.id}`}
                fullWidth
                variant="light"
                color={vehicle.saleDate ? "red" : "blue"}
              >
                Gerenciar veículo
              </Button>
            </Card>
          ))}

          {/* Card Novo Veículo */}
          <Card withBorder padding="lg" radius="md" shadow="sm" w={300}>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Novo Veículo</Title>
              <IconPlus size={24} stroke={1.5} />
            </Group>

            <Text size="sm" c="dimmed" mb="lg" h={60}>
              Adicione um carro informando marca, modelo, ano e a quilometragem atual.
            </Text>
            
            <Button component={Link} href="/veiculos/novo" fullWidth>
              Cadastrar veículo
            </Button>
          </Card>
        </Group>
      )}
    </Container>
  );
}