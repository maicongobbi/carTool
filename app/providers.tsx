"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

function isConnectionError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error as any)?.message ?? "";
  return (
    msg.includes("P1001") ||
    msg.includes("Can't reach database") ||
    msg.includes("Connection refused") ||
    msg.includes("ECONNREFUSED")
  );
}

function showDbConnectionError() {
  notifications.show({
    id: "db-connection-error",
    title: "Sem conexão com o banco de dados",
    message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    color: "red",
    autoClose: 7000,
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (isConnectionError(error)) showDbConnectionError();
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (isConnectionError(error)) showDbConnectionError();
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              if (isConnectionError(error)) return false;
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
