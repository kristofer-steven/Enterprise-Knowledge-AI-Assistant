/**
 * Converts a string title to a URL/ID friendly slug.
 * Example: "Travel Policy" -> "travel-policy"
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'document';
}
