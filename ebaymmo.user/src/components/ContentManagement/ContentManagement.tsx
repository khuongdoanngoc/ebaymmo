import Link from 'next/link';
import { GET_ALL_POST_USER } from '@/app/api/blog/api';
import ContentManagementList from './ContentManagementList';
import { auth } from '@/auth';
import FormSearch from './FormSearch';
import ContentManagementClient from './ContentManagementClient';

export default async function ContentManagement({
    searchParams
}: {
    searchParams: {
        page?: string;
        search?: string;
    };
}) {
    let page: string = '1';
    let search = '';

    if (searchParams instanceof Promise) {
        const resolvedParams = await searchParams;
        page = resolvedParams?.page ?? '1';
        search = resolvedParams?.search ?? '';
    } else {
        page = searchParams?.page ?? '1';
        search = searchParams?.search ?? '';
    }

    const session = await auth();
    const name = session?.user.name ?? '';

    const responses = await GET_ALL_POST_USER({
        limit: 3,
        page: parseInt(page),
        filter: `authors.name:${name}`,
        search: search
    });

    const dataPost = await responses.json();

    if (!dataPost || dataPost?.posts?.length === 0 || !responses.ok) {
        return <ContentManagementClient data={null} />;
    }

    return <ContentManagementClient data={dataPost} />;
}
