
export function generateFlashcardsSetTitle(resourceType: string, resourceName: string): string{
    const currentTime = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
    return `${resourceType} Flashcards - ${resourceName} - ${currentTime}`;
}