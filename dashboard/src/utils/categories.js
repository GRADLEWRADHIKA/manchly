export const CATEGORIES = [
    "Finance",
    "AI",
    "Marketing",
    "Technology",
    "Business",
    "Design",
    "Health & Fitness",
    "Personal Development",
    "Other"
];


export function withLegacyCategories(existingValues = []){
    const extras = Array.from(
        new Set(existingValues.filter((v) => v && !CATEGORIES.includes(v))),
    );
    return [...CATEGORIES, ...extras];
}