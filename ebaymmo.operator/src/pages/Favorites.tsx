import { useState } from 'react';
import { useGetFavoriteStoresQuery } from '@/generated/graphql';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Search, Star, ShoppingBag, Heart, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent } from '@radix-ui/react-tabs';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';

interface Store {
    storeId: string;
    storeName?: string | null;
    shortDescription?: string | null;
    averageRating?: number | null;
    avatar?: string | null;
    productsAggregate?: {
        aggregate?: {
            count: number;
        } | null;
    } | null;
    wishlistsAggregate?: {
        aggregate?: {
            count: number;
        } | null;
    } | null;
}

type SortOption = 'rating' | 'products' | 'wishlists' | 'name';

// Helper component for store cards
const StoreCard = ({ store }: { store: Store }) => {
    const navigate = useNavigate();

    const handleVisitStore = () => {
        navigate('/admin/stores', {
            state: { searchTerm: store.storeName }
        });
    };

    return (
        <Card className="h-full overflow-hidden transition-all hover:shadow-md relative pb-4">
            <div className="relative h-48 overflow-hidden">
                <img
                    src={store.avatar || '/placeholder.jpg'}
                    alt={store.storeName || 'Store'}
                    className="w-full h-full object-cover"
                />
            </div>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl truncate">
                        {store.storeName || 'Unnamed Store'}
                    </CardTitle>
                    <div className="flex items-center text-amber-500">
                        <Star className="fill-current h-4 w-4 mr-1" />
                        <span className="font-medium">
                            {(store.averageRating || 0).toFixed(1)}
                        </span>
                    </div>
                </div>
                <CardDescription className="line-clamp-2">
                    {store.shortDescription || 'No description available'}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center text-muted-foreground">
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        <span>
                            {store.productsAggregate?.aggregate?.count || 0}{' '}
                            Products
                        </span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Heart className="h-4 w-4 mr-1" />
                        <span>
                            {store.wishlistsAggregate?.aggregate?.count || 0}{' '}
                            Wishlists
                        </span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
                {/* <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4 mr-2" />
                    Follow
                </Button> */}
                <Button
                    size="sm"
                    className="absolute bottom-4 right-4"
                    onClick={handleVisitStore}
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Store
                </Button>
            </CardFooter>
        </Card>
    );
};

// Saved Collections Modal Component
// const SavedCollectionsModal = () => {
//     const [collections, setCollections] = useState([
//         { id: 1, name: 'Favorite Stores', count: 12 },
//         { id: 2, name: 'Top Rated', count: 8 },
//         { id: 3, name: 'Trending', count: 5 }
//     ]);
//     const [newCollectionName, setNewCollectionName] = useState('');

//     const handleAddCollection = () => {
//         if (newCollectionName.trim()) {
//             setCollections([
//                 ...collections,
//                 {
//                     id: collections.length + 1,
//                     name: newCollectionName,
//                     count: 0
//                 }
//             ]);
//             setNewCollectionName('');
//         }
//     };

//     return (
//         <Dialog>
//             <DialogTrigger asChild>
//                 <Button variant="outline">
//                     <Bookmark className="mr-2 h-4 w-4" />
//                     Saved Collections
//                 </Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-[425px]">
//                 <DialogHeader>
//                     <DialogTitle>Saved Collections</DialogTitle>
//                     <DialogDescription>
//                         Manage your store collections
//                     </DialogDescription>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                     <div className="flex items-center space-x-2">
//                         <Input
//                             placeholder="New collection name"
//                             value={newCollectionName}
//                             onChange={(e) =>
//                                 setNewCollectionName(e.target.value)
//                             }
//                         />
//                         <Button onClick={handleAddCollection}>
//                             <Plus className="h-4 w-4" />
//                         </Button>
//                     </div>
//                     <div className="space-y-2">
//                         {collections.map((collection) => (
//                             <div
//                                 key={collection.id}
//                                 className="flex items-center justify-between p-2 rounded-lg border"
//                             >
//                                 <div>
//                                     <p className="font-medium">
//                                         {collection.name}
//                                     </p>
//                                     <p className="text-sm text-muted-foreground">
//                                         {collection.count} stores
//                                     </p>
//                                 </div>
//                                 <Button variant="ghost" size="sm">
//                                     <X className="h-4 w-4" />
//                                 </Button>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// };

// Main Favorites component
export default function Favorites() {
    const { data, loading, error } = useGetFavoriteStoresQuery();
    const [sortBy, setSortBy] = useState<SortOption>('rating');
    const [searchQuery, setSearchQuery] = useState('');

    // Update pagination route to include admin prefix
    const { page, limit, setPage, offset } = usePagination(
        '/admin/favorites',
        12,
        1
    );

    // Get stores from query
    const stores = data?.stores || [];

    // Sort and filter stores
    const sortedAndFilteredStores = [...stores]
        .filter((store) => {
            if (!searchQuery) return true;

            const query = searchQuery.toLowerCase();
            return (
                store.storeName?.toLowerCase().includes(query) ||
                false ||
                store.shortDescription?.toLowerCase().includes(query) ||
                false
            );
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.averageRating || 0) - (a.averageRating || 0);
                case 'products':
                    return (
                        (b.productsAggregate?.aggregate?.count || 0) -
                        (a.productsAggregate?.aggregate?.count || 0)
                    );
                case 'wishlists':
                    return (
                        (b.wishlistsAggregate?.aggregate?.count || 0) -
                        (a.wishlistsAggregate?.aggregate?.count || 0)
                    );
                case 'name':
                    return (a.storeName || '').localeCompare(b.storeName || '');
                default:
                    return 0;
            }
        });

    // Paginate the stores
    const paginatedStores = sortedAndFilteredStores.slice(
        offset,
        offset + limit
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Featured Stores</h1>
                    <p className="text-muted-foreground">
                        Discover and follow top performing seller stores
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* <SavedCollectionsModal />
                    <Button onClick={() => navigate('/stores')}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Explore All Stores
                    </Button> */}
                </div>
            </div>

            <Tabs defaultValue="all" value="all">
                <div className="flex justify-between items-center">
                    {/* <TabsList>
                        <TabsTrigger value="all">All Stores</TabsTrigger>
                        <TabsTrigger value="trending">Trending</TabsTrigger>
                        <TabsTrigger value="featured">Featured</TabsTrigger>
                        <TabsTrigger value="topRated">Top Rated</TabsTrigger>
                    </TabsList> */}

                    <div className="hidden md:block text-sm text-muted-foreground">
                        Showing{' '}
                        <strong>{sortedAndFilteredStores.length}</strong> stores
                    </div>
                </div>

                <div className="my-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by store name or description..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={sortBy}
                            onValueChange={(value) =>
                                setSortBy(value as SortOption)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rating">
                                    Highest Rating
                                </SelectItem>
                                <SelectItem value="products">
                                    Most Products
                                </SelectItem>
                                <SelectItem value="wishlists">
                                    Most Wishlists
                                </SelectItem>
                                <SelectItem value="name">
                                    Store Name (A-Z)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value="all" className="mt-6">
                    {loading ? (
                        <div className="flex justify-center items-center p-8">
                            <p>Loading stores...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <h3 className="text-lg font-semibold text-red-500">
                                Error loading stores
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                {error.message}
                            </p>
                        </div>
                    ) : sortedAndFilteredStores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <div className="rounded-full p-3 bg-muted mb-4">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">
                                No stores found
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Try adjusting your filters or search term
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedStores.map((store) => (
                                    <StoreCard
                                        key={store.storeId}
                                        store={store}
                                    />
                                ))}
                            </div>

                            {/* Add pagination component */}
                            <div className="mt-8">
                                <Pagination
                                    total={sortedAndFilteredStores.length}
                                    limit={limit}
                                    page={page}
                                    setPage={setPage}
                                />
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
