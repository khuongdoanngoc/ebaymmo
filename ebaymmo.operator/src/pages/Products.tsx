import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive';
}

export default function Products() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    const dummyProducts: Product[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `PRD-${1000 + i}`,
        name: `Product ${i + 1}`,
        category: ['Electronics', 'Clothing', 'Home & Garden', 'Toys', 'Books'][
            Math.floor(Math.random() * 5)
        ],
        price: Math.floor(Math.random() * 1000) + 10,
        stock: Math.floor(Math.random() * 100),
        status: Math.random() > 0.2 ? 'active' : 'inactive'
    }));

    const filteredProducts = dummyProducts.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            selectedFilter === 'all' || product.status === selectedFilter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="pl-10 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                    >
                        <option value="all">All Products</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="rounded-xl border shadow">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        ID <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        Name <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Category
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        Price{' '}
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        Stock{' '}
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredProducts.map((product) => (
                                <tr
                                    key={product.id}
                                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                >
                                    <td className="p-4 align-middle">
                                        {product.id}
                                    </td>
                                    <td className="p-4 align-middle font-medium">
                                        {product.name}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {product.category}
                                    </td>
                                    <td className="p-4 align-middle">
                                        ${product.price.toFixed(2)}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {product.stock}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                product.status === 'active'
                                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            }`}
                                        >
                                            {product.status === 'active'
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Previous
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Next
                </button>
            </div>
        </div>
    );
}
