const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getDaysSince(dateString: string): number {
    const now = new Date();
    const date = new Date(dateString);
    return Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY);
}

export function formatTimestamp(dateString: string): string {
    const days = getDaysSince(dateString);

    if (days < 1) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;

    const diffMonths = Math.floor(days / 30);
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12) return `${diffMonths} months ago`;

    const diffYears = Math.floor(days / 365);
    if (diffYears === 1) return "1 year ago";
    return `${diffYears} years ago`;
}

export function formatAbsoluteTimestamp(dateString: string): string {
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
