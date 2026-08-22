"use client"

import { useEffect, useMemo, useRef } from "react"
import { collection, query, where } from "firebase/firestore"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import {
  buildTaskOverdueNotificationKey,
  createAppNotification,
} from "@/lib/notifications"

const ACTIVE_TASK_STATUSES = ["novo", "atendimento", "pendente"]

export function TaskNotificationSync() {
  const firestore = useFirestore()
  const { selectedUser, userLoaded } = useUser()
  const createdKeysRef = useRef<Set<string>>(new Set())

  const operationalUserId = selectedUser?.id || null

  const tasksQuery = useMemoFirebase(
    () =>
      userLoaded && operationalUserId
        ? query(collection(firestore, "tasks"), where("responsibleId", "==", operationalUserId))
        : null,
    [firestore, userLoaded, operationalUserId]
  )
  const { data: tasks = [] } = useCollection(tasksQuery)

  const notificationsQuery = useMemoFirebase(
    () =>
      userLoaded && operationalUserId
        ? query(collection(firestore, "notifications"), where("userId", "==", operationalUserId))
        : null,
    [firestore, userLoaded, operationalUserId]
  )
  const { data: notifications = [] } = useCollection(notificationsQuery)

  const existingMetaKeys = useMemo(
    () => new Set((notifications || []).map((notification: any) => notification.metaKey).filter(Boolean)),
    [notifications]
  )

  useEffect(() => {
    createdKeysRef.current.clear()
  }, [operationalUserId])

  useEffect(() => {
    if (!operationalUserId || !tasks?.length) return

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

    tasks.forEach((task: any) => {
      if (!ACTIVE_TASK_STATUSES.includes(task.status)) return
      if (!task.dueDate || task.dueDate >= todayStr) return

      const metaKey = buildTaskOverdueNotificationKey(task.id, operationalUserId, task.dueDate)
      if (existingMetaKeys.has(metaKey) || createdKeysRef.current.has(metaKey)) return

      createdKeysRef.current.add(metaKey)
      createAppNotification(firestore, {
        userId: operationalUserId,
        title: "Demanda vencida",
        message: `A demanda "${task.title}" venceu em ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}.`,
        type: "task_overdue",
        link: "/atendimentos",
        taskId: task.id,
        metaKey,
      })
    })
  }, [existingMetaKeys, firestore, operationalUserId, tasks])

  return null
}
