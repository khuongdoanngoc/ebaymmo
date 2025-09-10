import api from '@/libs/ghost';
import { NextRequest, NextResponse } from 'next/server';

interface PostsRequestParams {
    limit?: number;
    page?: number;
    tag?: string;
    slug?: string;
    query?: string;
    filter?: string;
    search?: string;
}

/**
 * Get posts from Ghost API with pagination and filtering
 */
const getPosts = async ({
    limit = 15,
    page = 1,
    tag = 'all',
    slug = '',
    query = ''
}: PostsRequestParams = {}) => {
    // Build the filter string
    let filter: string = '';

    if (tag && tag !== 'all') {
        filter = `tag:${tag}`;
    }

    if (slug) {
        filter = filter ? `${filter}+slug:${slug}` : `slug:${slug}`;
    }

    try {
        const posts = await api.posts.browse({
            limit: limit,
            page: page,
            filter: filter,
            include: ['tags', 'authors']
        });

        return posts;
    } catch (error) {
        console.error('Error in Ghost API call:', error);
        throw error;
    }
};

const handler = async ({
    limit = 6,
    page = 1,
    tag = 'all',
    slug = '',
    query = ''
}: PostsRequestParams = {}) => {
    try {
        const data = await getPosts({ limit, page, tag, slug, query });
        return NextResponse.json({
            data: data,
            meta: data.meta,
            status: 200
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status || 500 }
        );
    }
};

const getPostBySlug = async ({ slug = '' }: PostsRequestParams = {}) => {
    const post = await api.posts.read(
        {
            slug: slug
        },
        { include: ['tags', 'authors'] }
    );
    return post;
};

const handlerSlug = async ({ slug = '' }: PostsRequestParams = {}) => {
    try {
        const data = await getPostBySlug({ slug });
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status || 500 }
        );
    }
};

const getPostByTag = async ({
    tag = '',
    slug = ''
}: PostsRequestParams = {}) => {
    if (tag.length === 0) {
        return NextResponse.json(
            { error: 'Tag parameter is required' },
            { status: 400 }
        );
    }

    const filter = `tags:[${tag}]`;

    const posts = await api.posts.browse({
        filter: filter,
        include: ['tags', 'authors']
    });

    const filteredPosts = posts.filter((post) => post.slug !== slug);

    if (!filteredPosts || filteredPosts.length === 0) {
        return []; // Return empty array if no related posts found
    }

    return filteredPosts;
};

const handlerRelated = async ({
    tag = '',
    slug = ''
}: PostsRequestParams = {}) => {
    try {
        const data = await getPostByTag({ tag, slug });

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status }
        );
    }
};

const getTags = async () => {
    const tags = await api.tags.browse();
    return tags;
};

const handlerTag = async () => {
    try {
        const data = await getTags();
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status || 500 }
        );
    }
};

const getAllPostByUser = async ({
    limit = 3,
    page = 1,
    search = '',
    filter = ''
}: PostsRequestParams = {}) => {
    // Xử lý filter để đảm bảo đúng format khi có search
    if (search.trim()) {
        const searchFilter = `title:~'${search}',html:~'${search}'`; // Tìm kiếm theo title HOẶC html

        filter = filter ? `${filter}+(${searchFilter})` : `(${searchFilter})`;
    }

    try {
        const posts = await api.posts.browse({
            limit: limit,
            page: page,
            filter: filter,
            include: ['tags', 'authors']
        });

        return posts;
    } catch (error) {
        console.error('Error in Ghost API call:', error);
        throw error;
    }
};

const handlerAllPostUser = async ({
    limit = 3,
    page = 1,
    search = '',
    filter = ''
}: PostsRequestParams = {}) => {
    try {
        const data = await getAllPostByUser({ limit, page, search, filter });
        return NextResponse.json({
            data: data,
            meta: data.meta,
            status: 200
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status || 500 }
        );
    }
};

export { handler as GET };

export { handlerSlug as GET_SLUG };

export { handlerRelated as GET_RELATED };

export { handlerTag as GET_TAG };

// export { handlerAuthor as GET_AUTHOR };

export { handlerAllPostUser as GET_ALL_POST_USER };

export default getPosts;
