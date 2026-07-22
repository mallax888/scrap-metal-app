"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "./auth";
import { createLocalStore } from "./local-store";
import { DEMO_YARDS, initialPrices, tickPrices, YARDS } from "./mock-data";
import { createRequest, listMyRequests, updateRequestStatus as updateRequestStatusApi } from "./supabase/requests";
import { MetalId, MetalPrice, RequestStatus, ScrapRequest, Yard } from "./types";

// Only the fictional sandbox yards are ever mutable/persisted locally — the
// real, unaffiliated directory (YARDS) is static, and real requests now
// live in Supabase (see src/lib/supabase/requests.ts), scoped to the
// signed-in user via RLS.
const demoYardsStore = createLocalStore<Yard[]>("scrap-metal:demo-yards", DEMO_YARDS);

interface AppState {
  prices: MetalPrice[];
  requests: ScrapRequest[];
  requestsLoading: boolean;
  yards: Yard[];
  demoYards: Yard[];
  addRequest: (
    request: Omit<ScrapRequest, "id" | "createdAt" | "status">
  ) => Promise<ScrapRequest>;
  updateRequestStatus: (id: string, status: RequestStatus) => Promise<void>;
  updateYardPrice: (yardId: string, metal: MetalId, price: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [prices, setPrices] = useState<MetalPrice[]>(() => initialPrices());
  const [requests, setRequests] = useState<ScrapRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const demoYards = useSyncExternalStore(
    demoYardsStore.subscribe,
    demoYardsStore.getSnapshot,
    demoYardsStore.getServerSnapshot
  );
  const yards = useMemo(() => [...demoYards, ...YARDS], [demoYards]);

  useEffect(() => {
    let cancelled = false;
    // Fetch-on-mount/dependency-change is exactly what effects are for;
    // this isn't an accidental cascade, just the loading-state kickoff.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequestsLoading(true);
    (user ? listMyRequests() : Promise.resolve<ScrapRequest[]>([]))
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => console.error("Failed to load requests", err))
      .finally(() => {
        if (!cancelled) setRequestsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((current) => tickPrices(current));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addRequest = useCallback<AppState["addRequest"]>(async (input) => {
    const request = await createRequest(input);
    setRequests((current) => [request, ...current]);
    return request;
  }, []);

  const updateRequestStatus = useCallback<AppState["updateRequestStatus"]>(
    async (id, status) => {
      const updated = await updateRequestStatusApi(id, status);
      setRequests((current) => current.map((r) => (r.id === id ? updated : r)));
    },
    []
  );

  const updateYardPrice = useCallback<AppState["updateYardPrice"]>(
    (yardId, metal, price) => {
      demoYardsStore.setState((current) =>
        current.map((y) =>
          y.id === yardId ? { ...y, buyPrices: { ...y.buyPrices, [metal]: price } } : y
        )
      );
    },
    []
  );

  const value = useMemo<AppState>(
    () => ({
      prices,
      requests,
      requestsLoading,
      yards,
      demoYards,
      addRequest,
      updateRequestStatus,
      updateYardPrice,
    }),
    [
      prices,
      requests,
      requestsLoading,
      yards,
      demoYards,
      addRequest,
      updateRequestStatus,
      updateYardPrice,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
