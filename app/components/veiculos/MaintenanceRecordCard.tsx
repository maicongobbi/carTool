import { Badge, Card, Group, Text } from "@mantine/core";
import { IconCalendar, IconCoin, IconGauge } from "@tabler/icons-react";

export interface MaintenanceRecordCardProps {
  date: Date | string;
  kmAtService: number;
  description: string;
  categoryName: string;
  cost?: number | null;
  nextDate?: Date | string | null;
  nextKm?: number | null;
}

export function MaintenanceRecordCard({
  date,
  kmAtService,
  description,
  categoryName,
  cost,
  nextDate,
  nextKm,
}: MaintenanceRecordCardProps) {
  return (
    <Card withBorder padding="md" radius="md" shadow="sm">
      <Group justify="space-between" mb="xs" align="flex-start">
        <Text fw={500}>{description}</Text>
        <Badge variant="light" color="teal">
          {categoryName}
        </Badge>
      </Group>

      <Group gap="lg" c="dimmed" mb="xs">
        <Group gap={4}>
          <IconCalendar size={14} />
          <Text size="sm">{new Date(date).toLocaleDateString("pt-BR")}</Text>
        </Group>
        <Group gap={4}>
          <IconGauge size={14} />
          <Text size="sm">{kmAtService.toLocaleString("pt-BR")} km</Text>
        </Group>
        {cost != null && (
          <Group gap={4}>
            <IconCoin size={14} />
            <Text size="sm">
              {cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Text>
          </Group>
        )}
      </Group>

      {(nextDate || nextKm) && (
        <Text size="xs" c="blue">
          Próxima:{" "}
          {nextDate ? new Date(nextDate).toLocaleDateString("pt-BR") : ""}
          {nextDate && nextKm ? " ou " : ""}
          {nextKm ? `${nextKm.toLocaleString("pt-BR")} km` : ""}
        </Text>
      )}
    </Card>
  );
}
