"use client";

import { Avatar, Box, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";

interface UserButtonProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onLogout?: () => void;
}

/** Returns only the first name to abbreviate long names on mobile */
function getFirstName(fullName: string): string {
  return fullName?.split(" ")[0] ?? fullName;
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
          <Group gap="xs" wrap="nowrap" align="center">
            <Avatar src={avatarUrl} radius="xl" size="sm" color="blue">
              {name?.charAt(0).toUpperCase()}
            </Avatar>

            {/* Nome: visível em mobile e desktop */}
            <div style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {getFirstName(name)}
              </Text>
              {/* Email: só em telas >= sm */}
              <Text size="xs" c="dimmed" truncate visibleFrom="sm">
                {email}
              </Text>
            </div>

            {/* Chevron: só em telas >= sm */}
            <Box visibleFrom="sm">
              <IconChevronDown size={14} />
            </Box>
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
