import type { UIMessage } from 'ai';

function readTextContent(part: unknown) {
  if (!part || typeof part !== 'object' || Array.isArray(part)) return '';
  const record = part as Record<string, unknown>;

  if (typeof record.text === 'string') return record.text;
  if (typeof record.markdown === 'string') return record.markdown;

  return '';
}

function readComparableText(message: UIMessage) {
  return (message.parts ?? []).map(readTextContent).join('\n').trim();
}

function isRegressedTextPart(currentPart: unknown, snapshotPart: unknown) {
  const currentText = readTextContent(currentPart);
  const snapshotText = readTextContent(snapshotPart);

  return (
    currentText !== ''
    && snapshotText !== ''
    && snapshotText.length < currentText.length
    && currentText.startsWith(snapshotText)
  );
}

function mergeChatMessage(currentMessage: UIMessage, snapshotMessage: UIMessage) {
  if (JSON.stringify(currentMessage) === JSON.stringify(snapshotMessage)) {
    return currentMessage;
  }

  const currentText = readComparableText(currentMessage);
  const snapshotText = readComparableText(snapshotMessage);

  if (
    currentText !== ''
    && snapshotText !== ''
    && currentText.length > snapshotText.length
    && currentText.startsWith(snapshotText)
  ) {
    return currentMessage;
  }

  if (
    currentText !== ''
    && snapshotText !== ''
    && snapshotText.length > currentText.length
    && snapshotText.startsWith(currentText)
  ) {
    return snapshotMessage;
  }

  if ((snapshotMessage.parts?.length ?? 0) < (currentMessage.parts?.length ?? 0)) {
    return currentMessage;
  }

  let partsChanged = false;
  const mergedParts = (snapshotMessage.parts ?? []).map((snapshotPart, index) => {
    const currentPart = currentMessage.parts?.[index];
    if (isRegressedTextPart(currentPart, snapshotPart)) {
      partsChanged = true;
      return currentPart;
    }
    return snapshotPart;
  });

  const mergedMessage = partsChanged
    ? { ...snapshotMessage, parts: mergedParts }
    : snapshotMessage;

  return JSON.stringify(currentMessage) === JSON.stringify(mergedMessage)
    ? currentMessage
    : mergedMessage;
}

export function mergeChatMessagesForHydration(
  currentMessages: UIMessage[],
  snapshotMessages: UIMessage[]
) {
  if (currentMessages.length === 0) return snapshotMessages;

  const snapshotById = new Map(snapshotMessages.map((message) => [message.id, message]));
  const currentIds = new Set(currentMessages.map((message) => message.id));
  let changed = false;

  const mergedMessages = currentMessages.map((currentMessage) => {
    const snapshotMessage = snapshotById.get(currentMessage.id);
    if (!snapshotMessage) return currentMessage;

    const mergedMessage = mergeChatMessage(currentMessage, snapshotMessage);
    if (mergedMessage !== currentMessage) changed = true;
    return mergedMessage;
  });

  snapshotMessages.forEach((snapshotMessage) => {
    if (currentIds.has(snapshotMessage.id)) return;
    mergedMessages.push(snapshotMessage);
    changed = true;
  });

  return changed ? mergedMessages : currentMessages;
}
