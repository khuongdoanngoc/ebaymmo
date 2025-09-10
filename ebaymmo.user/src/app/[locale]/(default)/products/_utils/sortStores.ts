export const sortStores = (stores: any[], sortOption: string) => {
    if (!stores) return [];
    const storesCopy = [...stores];
    switch (sortOption) {
        case 'Price ascending':
            return storesCopy.sort((a, b) => a.storePrice - b.storePrice);
        case 'Price descending':
            return storesCopy.sort((a, b) => b.storePrice - a.storePrice);
        case 'Most viewed':
            return storesCopy.sort(
                (a, b) => (b.totalSoldCount || 0) - (a.totalSoldCount || 0)
            );
        case 'Best rated':
            return storesCopy.sort((a, b) => b.averageRating - a.averageRating);
        default:
            return storesCopy;
    }
};
