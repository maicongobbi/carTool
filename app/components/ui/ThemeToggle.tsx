"use client";

import { useUpdateUser } from "@/app/lib/hooks";
import { ActionIcon, Tooltip } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useCallback } from "react";

interface ThemeToggleProps {
  userId?: string;
}

export function ThemeToggle({ userId }: ThemeToggleProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const updateUser = useUpdateUser();
  const isDark = colorScheme === "dark";

  const handleToggle = useCallback(async () => {
    const next = isDark ? "light" : "dark";
    setColorScheme(next);

    if (userId) {
      try {
        await updateUser.mutateAsync({
          where: { id: userId },
          data: { theme: next },
        });
      } catch (e) {
        console.error("Erro ao salvar tema:", e);
      }
    }
  }, [isDark, setColorScheme, userId, updateUser]);

  return (
    <Tooltip label={isDark ? "Mudar para claro" : "Mudar para escuro"} position="bottom">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label="Alternar tema"
        onClick={handleToggle}
      >
        {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}
