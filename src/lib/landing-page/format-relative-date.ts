export function formatRelativeDate(deploymentDate: Date): string {
    const date = new Date(deploymentDate);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / ( 1000 * 60 * 60 * 24 ));

    if(diffDays <= 0) return "Today";
    if(diffDays === 1) return "Yesterday";
    if(diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if(diffDays < 30) return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if(diffMonths < 3) return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;

    // After a few months, just show the exact date
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}