import type { Reservation } from "./types";

export const RESERVATION_TRASH_DAYS = 30;

export function isInTrash(item: Pick<Reservation, "deletedAt">) {
  return Boolean(item.deletedAt);
}

export function trashPurgeAt(deletedAt: string) {
  return new Date(
    new Date(deletedAt).getTime() + RESERVATION_TRASH_DAYS * 24 * 60 * 60 * 1000
  );
}

export function trashDaysLeft(deletedAt: string) {
  const ms = trashPurgeAt(deletedAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
