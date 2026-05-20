import { Badge, Card, Group, Text } from "@mantine/core";
import { IconBulb, IconSettings } from "@tabler/icons-react";

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
        <Group
          gap="xs"
          mt="sm"
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
            {notes}
          </Text>
        </Group>
      )}
    </Card>
  );
}
