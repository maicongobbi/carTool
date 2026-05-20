import { Card, Group, Text, Badge, Alert } from "@mantine/core";
import { IconSettings, IconInfoCircle } from "@tabler/icons-react";

export interface TechnicalInfoCardProps {
  description: string;
  notes?: string | null;
  kmInterval?: number | null;
  timeIntervalMonths?: number | null;
  categoryName: string;
}

export function TechnicalInfoCard({
  description,
  notes,
  kmInterval,
  timeIntervalMonths,
  categoryName,
}: TechnicalInfoCardProps) {
  return (
    <Card withBorder padding="md" radius="md" shadow="sm">
      <Group justify="space-between" mb="xs">
        <Text fw={500} size="lg">
          {description}
        </Text>
        <Badge variant="light" color="blue">
          {categoryName}
        </Badge>
      </Group>

      <Group gap="xs" c="dimmed" mt="sm">
        <IconSettings size={16} />
        <Text size="sm">
          Intervalo:{" "}
          {kmInterval && timeIntervalMonths
            ? `${kmInterval.toLocaleString("pt-BR")} km ou ${timeIntervalMonths} meses`
            : kmInterval
            ? `${kmInterval.toLocaleString("pt-BR")} km`
            : timeIntervalMonths
            ? `${timeIntervalMonths} meses`
            : "Sob demanda"}
        </Text>
      </Group>

      {notes && (
        <Alert
          mt="sm"
          color="blue"
          variant="light"
          icon={<IconInfoCircle size={16} />}
          styles={{ message: { fontSize: "var(--mantine-font-size-xs)" } }}
        >
          {notes}
        </Alert>
      )}
    </Card>
  );
}
