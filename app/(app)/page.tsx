"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUser } from "@/lib/hooks/use-user";
import { useSavedStops } from "@/lib/store/saved-stops";
import { useMultiStopArrivals } from "@/lib/hooks/use-realtime";
import { loadStops, loadRoutesMap } from "@/lib/gtfs/static";
import { StopCardSkeleton } from "@/components/StopCard";
import { Button, EmptyState, Card } from "@/components/ui";
import { Plus, Library, MapPin, GripVertical, Trash2, Pencil, Check, X } from "lucide-react";
import type { GTFSStop, GTFSRoute } from "@/lib/gtfs/types";
import type { SavedStop } from "@/lib/store/saved-stops";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
  const { userId, loading: userLoading } = useUser();
  const { stops: savedStops, loaded, load, reorder, remove, update } = useSavedStops();
  const [gtfsStops, setGtfsStops] = useState<Map<string, GTFSStop>>(new Map());
  const [routesMap, setRoutesMap] = useState<Map<string, GTFSRoute>>(new Map());
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const stopIds = savedStops.map((s) => s.stop_id);
  const { data: multiArrivals } = useMultiStopArrivals(stopIds);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (userId) load(userId);
  }, [userId, load]);

  useEffect(() => {
    (async () => {
      const [stops, routes] = await Promise.all([loadStops(), loadRoutesMap()]);
      setGtfsStops(new Map(stops.map((s) => [s.id, s])));
      setRoutesMap(routes);
    })();
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !userId) return;
    const oldIndex = savedStops.findIndex((s) => s.id === active.id);
    const newIndex = savedStops.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(savedStops, oldIndex, newIndex);
    reorder(userId, newOrder.map((s) => s.stop_id));
  }

  function startEdit(stop: SavedStop) {
    setEditingId(stop.id);
    setEditLabel(stop.custom_label ?? "");
  }

  function saveEdit() {
    if (!editingId || !userId) return;
    const stop = savedStops.find((s) => s.id === editingId);
    if (stop) update(userId, stop.stop_id, { custom_label: editLabel || null });
    setEditingId(null);
    setEditLabel("");
  }

  if (userLoading || (!loaded && !userId)) {
    return (
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Stops</h1>
        <div className="space-y-3">
          <StopCardSkeleton />
          <StopCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My Stops</h1>
        <div className="flex items-center gap-2">
          {savedStops.length > 0 && (
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setEditMode(!editMode)}
              className={cn(editMode && "bg-accent text-white border-accent")}
            >
              <Pencil size={18} />
            </Button>
          )}
          <Link href="/search">
            <Button size="icon">
              <Plus size={22} />
            </Button>
          </Link>
        </div>
      </div>

      {savedStops.length === 0 ? (
        <EmptyState
          icon={<Library size={28} strokeWidth={1.5} />}
          title="No saved stops yet"
          description="Search for bus stops, train stations, or ferry terminals to add them to your library."
          action={
            <div className="flex gap-3">
              <Link href="/search">
                <Button size="md">
                  <Plus size={18} /> Add stops
                </Button>
              </Link>
              <Link href="/map">
                <Button size="md" variant="secondary">
                  <MapPin size={18} /> View map
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <DndContext
          sensors={editMode ? sensors : []}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={savedStops.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {savedStops.map((saved) => {
                const stop = gtfsStops.get(saved.stop_id);
                if (!stop) return <StopCardSkeleton key={saved.id} />;

                if (editingId === saved.id) {
                  return (
                    <Card key={saved.id} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder={stop.name}
                          className="flex-1 h-10 px-4 bg-bg-subtle border border-border rounded-full text-sm outline-none focus:border-accent"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={saveEdit}>
                          <Check size={20} className="text-accent" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X size={20} />
                        </Button>
                      </div>
                      <p className="text-xs text-text-muted pl-4">
                        Stop {stop.code || stop.id}
                      </p>
                    </Card>
                  );
                }

                return (
                  <SortableStopCard
                    key={saved.id}
                    saved={saved}
                    stop={stop}
                    arrivals={multiArrivals?.[saved.stop_id] ?? []}
                    routesMap={routesMap}
                    editMode={editMode}
                    onEdit={() => startEdit(saved)}
                    onDelete={() => userId && remove(userId, saved.stop_id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableStopCard({
  saved,
  stop,
  arrivals,
  routesMap,
  editMode,
  onEdit,
  onDelete,
}: {
  saved: SavedStop;
  stop: GTFSStop;
  arrivals: import("@/lib/gtfs/types").Arrival[];
  routesMap: Map<string, GTFSRoute>;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: saved.id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = saved.custom_label || stop.name;

  if (editMode) {
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <Card className="p-4 flex items-center gap-3">
          <button {...listeners} className="cursor-grab active:cursor-grabbing text-text-muted">
            <GripVertical size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text truncate">{displayName}</h3>
            <p className="text-xs text-text-muted">Stop {stop.code || stop.id}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil size={18} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 size={18} className="text-danger" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link href={`/stops/${stop.id}`} className="block">
        <Card className="p-4 active:scale-[0.98] transition-transform duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text truncate">{displayName}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Stop {stop.code || stop.id}
              </p>
            </div>
          </div>

          {saved.note && (
            <p className="text-xs text-text-secondary mb-2 italic line-clamp-1">
              {saved.note}
            </p>
          )}

          {arrivals && arrivals.length > 0 ? (
            <div className="space-y-0.5">
              {arrivals.slice(0, 3).map((arrival, i) => {
                const route = routesMap.get(arrival.routeId);
                const routeName = route?.shortName || arrival.routeId;
                const routeColor = route?.color ? `#${route.color}` : "#71717a";
                const now = Math.floor(Date.now() / 1000);
                const time = arrival.predictedTime ?? arrival.scheduledTime ?? 0;
                const diff = time - now;
                const countdown =
                  diff < 0 ? "now" : diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)} min`;

                return (
                  <div key={`${arrival.tripId}-${i}`} className="flex items-center gap-3 py-1.5">
                    <div
                      className="flex items-center justify-center min-w-[40px] h-8 px-2 rounded-lg text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: routeColor,
                        color: route?.textColor ? `#${route.textColor}` : "#fff",
                      }}
                    >
                      {routeName}
                    </div>
                    <p className="flex-1 text-sm text-text-secondary truncate">
                      {arrival.tripHeadsign || route?.longName || ""}
                    </p>
                    <p className="text-sm font-semibold tabular-nums flex-shrink-0">
                      {countdown}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-muted py-1">
              {arrivals ? "No live arrivals" : "Loading arrivals..."}
            </p>
          )}
        </Card>
      </Link>
    </div>
  );
}
