import { demoNotifications } from "@/lib/demo-data";
import { isDemoModeEnabled } from "@/lib/direct-access";

export type DemoNotificationType = "SYSTEM" | "EXPIRY" | "EMAIL";
export type DemoNotificationStatus = "PENDING" | "SENT" | "READ" | "FAILED";

export type DemoNotification = {
  id: string;
  type: DemoNotificationType;
  title: string;
  message: string;
  entity: string | null;
  entityId: string | null;
  status: DemoNotificationStatus;
  dueAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
};

const globalStore = globalThis as typeof globalThis & {
  __trinsuDemoNotifications?: DemoNotification[];
};

function initialNotifications(): DemoNotification[] {
  return demoNotifications.map((item) => ({
    id: item.id,
    type: "SYSTEM",
    title: item.title,
    message: item.message,
    entity: null,
    entityId: null,
    status: item.status as DemoNotificationStatus,
    dueAt: item.dueAt,
    sentAt: null,
    createdAt: new Date(item.createdAt)
  }));
}

export function getDemoNotifications() {
  if (!isDemoModeEnabled()) return [];
  globalStore.__trinsuDemoNotifications ??= initialNotifications();
  return globalStore.__trinsuDemoNotifications;
}

export function markDemoNotificationRead(id: string) {
  if (!isDemoModeEnabled()) return null;
  const notifications = getDemoNotifications();
  const index = notifications.findIndex((item) => item.id === id);
  if (index === -1) return null;
  notifications[index] = { ...notifications[index], status: "READ" };
  return notifications[index];
}

export function markAllDemoNotificationsRead() {
  if (!isDemoModeEnabled()) return [];
  const notifications = getDemoNotifications();
  notifications.forEach((item, index) => {
    notifications[index] = { ...item, status: "READ" };
  });
  return notifications;
}
