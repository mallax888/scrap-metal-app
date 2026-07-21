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
import { initialPrices, tickPrices, YARDS } from "./mock-data";
import { MetalId, MetalPrice, RequestStatus, ScrapRequest, Yard } from "./types";

const requestsStore = createLocalStore<ScrapRequest[]>("scrap-metal:requests", []);
const yardsStore = createLocalStore<Yard[]>("scrap-metal:yards", YARDS);

interface AppState {
  prices: MetalPrice[];
  requests: ScrapRequest[];
  yards: Yard[];
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
  const yards = useSyncExternalStore(
    yardsStore.subscribe,
    yardsStore.getSnapshot,
    yardsStore.getServerSnapshot
  );

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
      yardsStore.setState((current) =>
        current.map((y) =>
          y.id === yardId ? { ...y, buyPrices: { ...y.buyPrices, [metal]: price } } : y
        )
      );
    },
    []
  );

  const value = useMemo<AppState>(
    () => ({ prices, requests, yards, addRequest, updateRequestStatus, updateYardPrice }),
    [prices, requests, yards, addRequest, updateRequestStatus, updateYardPrice]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
