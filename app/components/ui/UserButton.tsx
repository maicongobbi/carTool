"use client";

import { Avatar, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";

interface UserButtonProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onLogout?: () => void;
}

export function UserButton({ name, email, avatarUrl, onLogout }: UserButtonProps) {
  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <UnstyledButton
          style={{
            borderRadius: "var(--mantine-radius-sm)",
            padding: "var(--mantine-spacing-xs)",
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <Avatar src={avatarUrl} radius="xl" size="sm" color="blue">
              {name?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {email}
              </Text>
            </div>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Conta</Menu.Label>
        <Menu.Item leftSection={<IconUser size={14} />}>Perfil</Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={onLogout}
        >
          Sair
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
