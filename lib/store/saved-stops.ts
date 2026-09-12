"use client";

import { create } from "zustand";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { GTFSStop } from "@/lib/gtfs/types";

export interface SavedStop {
  id: string; // DB row id
  stop_id: string; // GTFS stop_id
  custom_label: string | null;
  note: string | null;
  sort_order: number;
}

interface SavedStopsState {
  stops: SavedStop[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  load: (userId: string) => Promise<void>;
  add: (userId: string, stopId: string, label?: string, note?: string) => Promise<void>;
  remove: (userId: string, stopId: string) => Promise<void>;
  update: (userId: string, stopId: string, updates: Partial<Pick<SavedStop, "custom_label" | "note" | "sort_order">>) => Promise<void>;
  reorder: (userId: string, stopIds: string[]) => Promise<void>;
  isSaved: (stopId: string) => boolean;
}

export const useSavedStops = create<SavedStopsState>((set, get) => ({
  stops: [],
  loading: false,
  error: null,
  loaded: false,

  load: async (userId: string) => {
    set({ loading: true, error: null });
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("saved_stops")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      stops: (data as SavedStop[]) ?? [],
      loading: false,
      loaded: true,
    });
  },

  add: async (userId: string, stopId: string, label?: string, note?: string) => {
    const supabase = createSupabaseClient();
    const currentStops = get().stops;
    const nextOrder = currentStops.length > 0
      ? Math.max(...currentStops.map((s) => s.sort_order)) + 1
      : 0;

    const { data, error } = await supabase
      .from("saved_stops")
      .insert({
        user_id: userId,
        stop_id: stopId,
        custom_label: label ?? null,
        note: note ?? null,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      return;
    }

    set({ stops: [...get().stops, data as SavedStop] });
  },

  remove: async (_userId: string, stopId: string) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("saved_stops")
      .delete()
      .eq("stop_id", stopId);

    if (error) {
      set({ error: error.message });
      return;
    }

    set({ stops: get().stops.filter((s) => s.stop_id !== stopId) });
  },

  update: async (_userId: string, stopId: string, updates: Partial<Pick<SavedStop, "custom_label" | "note" | "sort_order">>) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("saved_stops")
      .update(updates)
      .eq("stop_id", stopId);

    if (error) {
      set({ error: error.message });
      return;
    }

    set({
      stops: get().stops.map((s) =>
        s.stop_id === stopId ? { ...s, ...updates } : s
      ),
    });
  },

  reorder: async (userId: string, stopIds: string[]) => {
    const supabase = createSupabaseClient();
    const updates = stopIds.map((stopId, index) =>
      supabase
        .from("saved_stops")
        .update({ sort_order: index })
        .eq("user_id", userId)
        .eq("stop_id", stopId)
    );

    await Promise.all(updates);

    // Re-sort local state
    const currentStops = get().stops;
    const reordered = stopIds
      .map((stopId, index) => {
        const stop = currentStops.find((s) => s.stop_id === stopId);
        return stop ? { ...stop, sort_order: index } : null;
      })
      .filter((s): s is SavedStop => s !== null);

    set({ stops: reordered });
  },

  isSaved: (stopId: string) => {
    return get().stops.some((s) => s.stop_id === stopId);
  },
}));
