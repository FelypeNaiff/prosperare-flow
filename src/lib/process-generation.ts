export function getProcessDocumentId(
  modelId: string,
  clientId: string,
  competence: string,
  sporadicDeadline?: string
) {
  return [modelId, clientId, competence.replace("-", ""), sporadicDeadline || "recorrente"]
    .map(part => part.replaceAll("/", "_"))
    .join("__")
}

