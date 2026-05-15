import { Badge, Card, Divider, Group, Stack, Text } from "@mantine/core";
import { IconCalendar, IconClock, IconCoin, IconGauge } from "@tabler/icons-react";

export type AlertStatus = "overdue" | "critical" | "warning" | "notice" | null;
export type AlertReason = "km" | "data" | null;

export interface MaintenanceRecordCardProps {
  date: Date | string;
  kmAtService: number;
  description: string;
  categoryName: string;
  cost?: number | null;
  nextDate?: Date | string | null;
  nextKm?: number | null;
  alertStatus?: AlertStatus;
  alertReason?: AlertReason;
  ignored?: boolean;
  onClick?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  overdue:  "var(--mantine-color-red-6)",
  critical: "var(--mantine-color-orange-6)",
  warning:  "var(--mantine-color-yellow-6)",
  notice:   "var(--mantine-color-yellow-3)",
};

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  overdue:  { color: "red",    label: "Vencida" },
  critical: { color: "orange", label: "Crítico" },
  warning:  { color: "yellow", label: "Atenção" },
  notice:   { color: "yellow", label: "Próxima" },
};

const REASON_BADGE: Record<string, { color: string; label: string }> = {
  km:   { color: "indigo", label: "Por KM" },
  data: { color: "violet", label: "Por Data" },
};

export function MaintenanceRecordCard({
  date,
  kmAtService,
  description,
  categoryName,
  cost,
  nextDate,
  nextKm,
  alertStatus,
  alertReason,
  ignored,
  onClick,
}: MaintenanceRecordCardProps) {
  const borderColor = !ignored && alertStatus ? STATUS_COLORS[alertStatus] : undefined;
  const isHighlighted = !ignored && !!alertStatus;

  return (
    <Card
      withBorder
      padding="md"
      radius="md"
      shadow="sm"
      onClick={onClick}
      style={{
        borderColor,
        borderWidth: isHighlighted ? 2 : 1,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s, transform 0.15s",
        opacity: ignored ? 0.55 : 1,
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.transform = ""; }}
    >
      {/* Header */}
      <Group justify="space-between" mb="xs" align="flex-start">
        <Stack gap={2} style={{ flex: 1 }}>
          <Text fw={600} size="sm">{description}</Text>
          <Badge variant="light" color="teal" size="xs">{categoryName}</Badge>
        </Stack>
        <Group gap={4}>
          {!ignored && alertStatus && STATUS_BADGE[alertStatus] && (
            <Badge size="xs" color={STATUS_BADGE[alertStatus].color} variant="filled">
              {STATUS_BADGE[alertStatus].label}
            </Badge>
          )}
          {!ignored && alertReason && REASON_BADGE[alertReason] && (
            <Badge size="xs" color={REASON_BADGE[alertReason].color} variant="light">
              {REASON_BADGE[alertReason].label}
            </Badge>
          )}
          {ignored && (
            <Badge size="xs" color="gray" variant="light">Ignorada</Badge>
          )}
        </Group>
      </Group>

      {/* Info da manutenção realizada */}
      <Group gap="lg" c="dimmed" mb="xs">
        <Group gap={4}>
          <IconCalendar size={13} />
          <Text size="xs">{new Date(date).toLocaleDateString("pt-BR")}</Text>
        </Group>
        <Group gap={4}>
          <IconGauge size={13} />
          <Text size="xs">{kmAtService.toLocaleString("pt-BR")} km</Text>
        </Group>
        {cost != null && (
          <Group gap={4}>
            <IconCoin size={13} />
            <Text size="xs">
              {cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Text>
          </Group>
        )}
      </Group>

      {/* Próxima manutenção — destaque */}
      {(nextDate || nextKm) && (
        <>
          <Divider my="xs" />
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={500}>Próxima manutenção:</Text>
            <Group gap="sm">
              {nextDate && (
                <Group gap={4}>
                  <IconClock size={13} color={borderColor ?? "var(--mantine-color-blue-6)"} />
                  <Text size="sm" fw={700} c={borderColor ? undefined : "blue"}>
                    {new Date(nextDate).toLocaleDateString("pt-BR")}
                  </Text>
                </Group>
              )}
              {nextKm && (
                <Group gap={4}>
                  <IconGauge size={13} color={borderColor ?? "var(--mantine-color-blue-6)"} />
                  <Text size="sm" fw={700} c={borderColor ? undefined : "blue"}>
                    {nextKm.toLocaleString("pt-BR")} km
                  </Text>
                </Group>
              )}
            </Group>
          </Stack>
        </>
      )}
    </Card>
  );
}
