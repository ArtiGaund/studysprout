export function generateFlashcardsSetTitle(
  resourceType: string,
  resourceName: string,
  timeZone?: string
): string {
  const currentTime = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone || "UTC", // was missing → silently used server's local tz
  });
  return `${resourceType} Flashcards - ${resourceName} - ${currentTime}`;
}