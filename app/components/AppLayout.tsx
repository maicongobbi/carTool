"use client";

import { signOut, useSession } from "@/app/lib/auth-client";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Skeleton,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCar, IconHome, IconSettings } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "./ui/UserButton";

const navLinks = [
  { label: "Início", icon: IconHome, href: "/home" },
  { label: "Veículos", icon: IconCar, href: "/veiculos/lista" },
  { label: "Configurações", icon: IconSettings, href: "/dashboard" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>🚗 carTool</Title>
          </Group>
          {isPending ? (
            <Skeleton height={36} width={160} radius="sm" />
          ) : session ? (
            <UserButton
              name={session.user.name}
              email={session.user.email}
              avatarUrl={session.user.image ?? undefined}
              onLogout={handleLogout}
            />
          ) : null}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section p="md">
          <Text fw={600} size="xs" tt="uppercase" c="dimmed" ms={1}>
            Menu
          </Text>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea} px="xs">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size={16} stroke={1.5} />}
              active={pathname === link.href || pathname.startsWith(link.href + "/")}
              mb={2}
            />
          ))}
        </AppShell.Section>

        <AppShell.Section p="md">
          <Text size="xs" c="dimmed">
            carTool v0.1.0
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}