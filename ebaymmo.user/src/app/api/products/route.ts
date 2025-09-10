import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const apiUrl = process.env.SEARCH_API_URL;

        const { data } = await axios.get(
            `${apiUrl}/elasticsearch-sync/search?${searchParams.toString()}`
        );

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
