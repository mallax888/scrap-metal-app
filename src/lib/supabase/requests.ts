import { createClient } from "./client";
import { MetalId, RequestStatus, ScrapRequest } from "../types";

interface ScrapRequestRow {
  id: string;
  metal_id: MetalId;
  weight_kg: number;
  quoted_price_per_kg: number;
  quoted_total: number;
  method: "pickup" | "dropoff";
  yard_id: string | null;
  yard_name: string | null;
  yard_suburb: string | null;
  address: string | null;
  status: RequestStatus;
  note: string | null;
  created_at: string;
}

function fromRow(row: ScrapRequestRow): ScrapRequest {
  return {
    id: row.id,
    metal: row.metal_id,
    weightKg: row.weight_kg,
    quotedPricePerKg: row.quoted_price_per_kg,
    quotedTotal: row.quoted_total,
    method: row.method,
    yardId: row.yard_id ?? undefined,
    yardName: row.yard_name ?? undefined,
    yardSuburb: row.yard_suburb ?? undefined,
    address: row.address ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    note: row.note ?? undefined,
  };
}

export async function listMyRequests(): Promise<ScrapRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scrap_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ScrapRequestRow[]).map(fromRow);
}

export async function createRequest(
  input: Omit<ScrapRequest, "id" | "createdAt" | "status">
): Promise<ScrapRequest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scrap_requests")
    .insert({
      metal_id: input.metal,
      weight_kg: input.weightKg,
      quoted_price_per_kg: input.quotedPricePerKg,
      quoted_total: input.quotedTotal,
      method: input.method,
      yard_id: input.yardId ?? null,
      yard_name: input.yardName ?? null,
      yard_suburb: input.yardSuburb ?? null,
      address: input.address ?? null,
      note: input.note ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as ScrapRequestRow);
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<ScrapRequest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scrap_requests")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as ScrapRequestRow);
}
