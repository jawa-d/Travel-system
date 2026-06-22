"use client";

import { useEffect, useState } from "react";

const PREFIX = "trinsu:";

function clientDemoMode() {
  return typeof document !== "undefined" && document.documentElement.dataset.demoMode === "true";
}

function key(name: string) {
  return `${PREFIX}${name}`;
}

function removedKey(name: string) {
  return `${PREFIX}${name}:removed`;
}

function readRemoved(name: string) {
  try {
    return new Set<string>(JSON.parse(window.localStorage.getItem(removedKey(name)) ?? "[]"));
  } catch {
    return new Set<string>();
  }
}

function writeRemoved(name: string, ids: Set<string>) {
  window.localStorage.setItem(removedKey(name), JSON.stringify([...ids]));
}

export function readLocalCollection<T>(name: string): T[] | null {
  if (typeof window === "undefined" || !clientDemoMode()) return null;
  try {
    const value = window.localStorage.getItem(key(name));
    return value ? JSON.parse(value) as T[] : null;
  } catch {
    return null;
  }
}

export function writeLocalCollection<T>(name: string, items: T[]) {
  if (!clientDemoMode()) return true;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(`trinsu-storage:${name}`, { detail: items }));
    return true;
  } catch {
    window.dispatchEvent(new CustomEvent("trinsu-toast", { detail: {
      title: "تعذر الحفظ محليًا",
      description: "قد تكون مساحة المتصفح ممتلئة، خصوصًا بسبب الصور الكبيرة.",
      tone: "error"
    } }));
    return false;
  }
}

export function upsertLocalItem<T extends { id: string }>(name: string, item: T) {
  const removed = readRemoved(name);
  removed.delete(item.id);
  writeRemoved(name, removed);
  const current = readLocalCollection<T>(name) ?? [];
  const index = current.findIndex((entry) => entry.id === item.id);
  const next = index === -1
    ? [item, ...current]
    : current.map((entry) => entry.id === item.id ? item : entry);
  writeLocalCollection(name, next);
  appendLocalAudit(`${name.toUpperCase()}_${index === -1 ? "CREATED" : "UPDATED"}`, name, item.id);
}

export function useLocalCollection<T extends { id: string }>(name: string, initial: T[]) {
  const [items, setItemsState] = useState(initial);

  useEffect(() => {
    if (!clientDemoMode()) {
      setItemsState(initial);
      return;
    }
    const stored = readLocalCollection<T>(name);
    const removed = readRemoved(name);
    if (stored) {
      const storedIds = new Set(stored.map((item) => item.id));
      const merged = [...stored, ...initial.filter((item) => !storedIds.has(item.id) && !removed.has(item.id))];
      setItemsState(merged);
      writeLocalCollection(name, merged);
    } else {
      const visible = initial.filter((item) => !removed.has(item.id));
      setItemsState(visible);
      writeLocalCollection(name, visible);
    }

    const listener = (event: Event) => {
      setItemsState((event as CustomEvent<T[]>).detail);
    };
    window.addEventListener(`trinsu-storage:${name}`, listener);
    return () => window.removeEventListener(`trinsu-storage:${name}`, listener);
  }, [name]);

  function setItems(next: T[] | ((current: T[]) => T[])) {
    setItemsState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      if (!clientDemoMode()) return value;
      const nextIds = new Set(value.map((item) => item.id));
      const removed = readRemoved(name);
      current.forEach((item) => {
        if (!nextIds.has(item.id)) removed.add(item.id);
      });
      value.forEach((item) => removed.delete(item.id));
      writeRemoved(name, removed);
      writeLocalCollection(name, value);
      appendLocalAudit(`${name.toUpperCase()}_UPDATED`, name, undefined, { count: value.length });
      return value;
    });
  }

  return [items, setItems] as const;
}

export function appendLocalAudit(action: string, entity: string, entityId?: string, metadata?: Record<string, unknown>) {
  if (entity === "audit" || !clientDemoMode()) return;
  const auditKey = key("audit");
  try {
    const current = JSON.parse(window.localStorage.getItem(auditKey) ?? "[]") as Array<Record<string, unknown>>;
    current.unshift({
      id: `local-audit-${crypto.randomUUID()}`,
      userName: "مدير تجريبي",
      role: "SUPER_ADMIN",
      action,
      entity,
      entityId: entityId ?? null,
      ipAddress: "local-browser",
      metadata: metadata ?? null,
      createdAt: new Date().toISOString()
    });
    window.localStorage.setItem(auditKey, JSON.stringify(current.slice(0, 500)));
  } catch {
    // Audit logging must never block the user operation.
  }
}
