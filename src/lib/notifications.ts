"use client"

import { doc, Firestore } from "firebase/firestore"
import { setDocumentNonBlocking } from "@/firebase"

export type AppNotificationType =
  | "assignment"
  | "mention"
  | "task_new"
  | "task_overdue"

interface CreateAppNotificationInput {
  userId: string
  title: string
  message: string
  type: AppNotificationType
  link?: string
  taskId?: string
  processId?: string
  remetente?: string
  metaKey?: string
}

function sanitizeNotificationKey(value: string) {
  return value.replace(/[^a-zA-Z0-9-_:.]/g, "_")
}

export function buildTaskAssignmentNotificationKey(taskId: string, userId: string) {
  return sanitizeNotificationKey(`task-assigned:${taskId}:${userId}`)
}

export function buildTaskOverdueNotificationKey(taskId: string, userId: string, dueDate: string) {
  return sanitizeNotificationKey(`task-overdue:${taskId}:${userId}:${dueDate}`)
}

export function createAppNotification(firestore: Firestore, input: CreateAppNotificationInput) {
  if (!input.userId) return

  const createdAt = new Date().toISOString()
  const notificationId = input.metaKey || `notif-${Math.random().toString(36).slice(2, 11)}`

  setDocumentNonBlocking(
    doc(firestore, "notifications", notificationId),
    {
      id: notificationId,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      read: false,
      createdAt,
      link: input.link || null,
      taskId: input.taskId || null,
      processId: input.processId || null,
      remetente: input.remetente || "Sistema",
      metaKey: input.metaKey || null,
    },
    { merge: true }
  )
}
