"use client";

import { signIn, useSession } from "@/app/lib/auth-client";
import { Button, Center, Container, Loader, Stack, Text, Title } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect") || "/home";
      router.replace(redirectUrl);
    }
  }, [session, router]);

  if (isPending || session) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Container>
      <Center h="100vh">
        <Stack align="center" gap="lg">
          <Title order={1}>🚗 Vehicle Care Tracker</Title>
          <Text size="lg" c="dimmed">Para continuar, faça login com sua conta Google.</Text>
          <Button
            onClick={() => signIn.social({ provider: "google", callbackURL: "/home" })}
            size="lg"
            mt="md"
            leftSection={<IconBrandGoogle size={20} />}
          >
            Login com Google
          </Button>
        </Stack>
      </Center>
    </Container>
  );
}