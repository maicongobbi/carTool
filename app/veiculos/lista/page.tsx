import { Button, Container, Group, Text, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

export default function VeiculosListaPage() {
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Meus Veículos</Title>
          <Text c="dimmed" size="sm">
            Gerencie seus veículos cadastrados
          </Text>
        </div>
        <Button
          component={Link}
          href="/veiculos/novo"
          leftSection={<IconPlus size={16} />}
        >
          Novo Veículo
        </Button>
      </Group>

      <Text c="dimmed" ta="center" py="xl">
        Nenhum veículo cadastrado ainda. Clique em &quot;Novo Veículo&quot; para começar.
      </Text>
    </Container>
  );
}
