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
import { createLocalStore } from "./local-store";
import { DEMO_YARDS, initialPrices, tickPrices, YARDS } from "./mock-data";
import { MetalId, MetalPrice, RequestStatus, ScrapRequest, Yard } from "./types";

const requestsStore = createLocalStore<ScrapRequest[]>("scrap-metal:requests", []);
// Only the fictional sandbox yards are ever mutable/persisted — the real,
// unaffiliated directory (YARDS) is static and never gets buyPrices attached.
const demoYardsStore = createLocalStore<Yard[]>("scrap-metal:demo-yards", DEMO_YARDS);

interface AppState {
  prices: MetalPrice[];
  requests: ScrapRequest[];
  yards: Yard[];
  demoYards: Yard[];
  addRequest: (request: Omit<ScrapRequest, "id" | "createdAt" | "status">) => ScrapRequest;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  updateYardPrice: (yardId: string, metal: MetalId, price: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<MetalPrice[]>(() => initialPrices());
  const requests = useSyncExternalStore(
    requestsStore.subscribe,
    requestsStore.getSnapshot,
    requestsStore.getServerSnapshot
  );
  const demoYards = useSyncExternalStore(
    demoYardsStore.subscribe,
    demoYardsStore.getSnapshot,
    demoYardsStore.getServerSnapshot
  );
  const yards = useMemo(() => [...demoYards, ...YARDS], [demoYards]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((current) => tickPrices(current));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addRequest = useCallback<AppState["addRequest"]>((input) => {
    const request: ScrapRequest = {
      ...input,
      id: `req-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      status: "quoted",
      createdAt: new Date().toISOString(),
    };
    requestsStore.setState((current) => [request, ...current]);
    return request;
  }, []);

  const updateRequestStatus = useCallback<AppState["updateRequestStatus"]>(
    (id, status) => {
      requestsStore.setState((current) =>
        current.map((r) => (r.id === id ? { ...r, status } : r))
      );
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
      yards,
      demoYards,
      addRequest,
      updateRequestStatus,
      updateYardPrice,
    }),
    [prices, requests, yards, demoYards, addRequest, updateRequestStatus, updateYardPrice]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
