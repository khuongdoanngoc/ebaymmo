'use client';

import {
    useGetMainCommentsSubscription,
    useGetRepliesSubscription,
    useBlogDonationCommentsSubscription,
    useGetBlogBySlugQuery
} from '@/generated/graphql';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import ReplyForm from './ReplyForm';
import { useSession } from 'next-auth/react';
import { formatDateTime } from '@/libs/datetime';
import { OrderBy } from '@/generated/graphql-request';
import { useTranslations } from 'next-intl';

export default function BlogComments({ slug }: { slug: string }) {
    const { data: session } = useSession();
    const { data: blogData, loading: blogLoading } = useGetBlogBySlugQuery({
        variables: { slug },
        fetchPolicy: 'network-only'
    });

    const t = useTranslations('post');

    const blogId = blogData?.blogs[0]?.blogId;

    const { data: mainCommentsData, loading: loadingMainComments } =
        useGetMainCommentsSubscription({
            variables: { blogId: blogId || '' },
            skip: !blogId
        });

    const { data: donationData, loading: loadingDonation } =
        useBlogDonationCommentsSubscription({
            variables: {
                blogId: blogId || '',
                orderBy: [{ donationDate: OrderBy.Desc }]
            },
            skip: !blogId
        });

    const [expandedCommentId, setExpandedCommentId] = useState<string | null>(
        null
    );
    const [repliesData, setRepliesData] = useState<{ [key: string]: any[] }>(
        {}
    );
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const { data: repliesSubscriptionData, loading: loadingReplies } =
        useGetRepliesSubscription({
            variables: {
                blogId: blogId || '',
                parentId: expandedCommentId
            },
            skip: !blogId || !expandedCommentId,
        });

    useEffect(() => {
        if (repliesSubscriptionData?.blogsCommentView && expandedCommentId) {
            const newReplies = { ...repliesData };
            repliesSubscriptionData.blogsCommentView.forEach((reply: any) => {
                if (reply.parentId === expandedCommentId) {
                    if (
                        !newReplies[reply.parentId]?.some(
                            (r) => r.commentId === reply.commentId
                        )
                    ) {
                        newReplies[reply.parentId] = [
                            ...(newReplies[reply.parentId] || []),
                            reply
                        ];
                    }
                }
            });
            setRepliesData(newReplies);
        }
    }, [repliesSubscriptionData, expandedCommentId]);

    const toggleReplies = (commentId: string) => {
        if (expandedCommentId === commentId) {
            setExpandedCommentId(null);
        } else {
            setExpandedCommentId(commentId);
        }
    };

    const allComments = useMemo(() => {
        const donationComments = (donationData?.donationCommentsView || []).map(
            (comment) => ({
                ...comment,
                isDonation: true,
                date: new Date(comment.donationDate)
            })
        );
        const mainComments = (mainCommentsData?.blogsCommentView || []).map(
            (comment) => ({
                ...comment,
                isDonation: false,
                date: new Date(comment.sentDate)
            })
        );
        return [...donationComments, ...mainComments].sort(
            (a, b) => b.date.getTime() - a.date.getTime()
        );
    }, [donationData, mainCommentsData]);

    // Skeleton component cho bình luận
    const CommentSkeleton = () => (
        <div className="mb-4 animate-pulse">
            <div className="flex flex-col sm:flex-row items-start gap-4 p-4">
                <div className="w-[50px] h-[50px] bg-gray-300 rounded-full" />
                <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="h-5 w-24 bg-gray-300 rounded" />
                        <div className="h-5 w-1 bg-gray-300" />
                        <div className="h-5 w-16 bg-gray-300 rounded" />
                    </div>
                    <div className="mt-2 h-4 w-3/4 bg-gray-300 rounded" />
                    <div className="mt-2 h-4 w-20 bg-gray-300 rounded" />
                </div>
            </div>
        </div>
    );

    // Skeleton component cho phản hồi
    const ReplySkeleton = () => (
        <div className="ml-5 sm:ml-10 border-l-2 border-gray-300 pl-4 mt-2 animate-pulse">
            <div className="mt-2">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-[50px] h-[50px] bg-gray-300 rounded-full" />
                    <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="h-5 w-20 bg-gray-300 rounded" />
                            <div className="h-5 w-1 bg-gray-300" />
                            <div className="h-5 w-14 bg-gray-300 rounded" />
                        </div>
                        <div className="mt-2 h-4 w-2/3 bg-gray-300 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderComment = (comment: any) => (
        <div
            key={comment.commentId || comment.donationId || Math.random()}
            className=""
        >
            <div className="flex flex-col sm:flex-row items-start gap-4 group hover:bg-slate-50 p-4 rounded-lg transition-all duration-300">
                <Image
                    src={
                        comment.isDonation
                            ? comment.images
                            : comment.images || '/images/avatar.svg'
                    }
                    width={50}
                    height={50}
                    alt="User Avatar"
                    className="rounded-full transition-transform duration-300 group-hover:scale-105"
                />
                <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[#1C1C1C] text-[16px] sm:text-[18px] font-medium leading-[160%]">
                            {comment.isDonation
                                ? comment.username
                                : comment.username || 'Anonymous'}
                        </p>
                        <p className="text-gray-400"> | </p>
                        {comment.isDonation && (
                            <span className="text-primary-500 text-[16px] sm:text-[18px] font-medium leading-[160%] flex items-center justify-center">
                                {comment.amount} USDT{' '}
                                <p className="text-gray-400 ml-2"> | </p>
                            </span>
                        )}
                        <img src="/images/clock.svg" alt="Time Icon" />
                        <span className="text-[14px] sm:text-[16px] text-[#6C6C6C]">
                            {formatDateTime(
                                comment.isDonation
                                    ? comment.donationDate
                                    : comment.sentDate,
                                'DD/MM/YYYY'
                            )}
                        </span>
                    </div>
                    <p className="text-[#1C1C1C] text-[14px] sm:text-[16px] font-normal leading-[160%]">
                        {comment.isDonation
                            ? comment.comment
                            : comment.messageContent}
                    </p>
                    {!comment.isDonation &&
                        comment.user?.userId !== session?.user?.id && (
                            <button
                                className="text-[#585858] hover:text-blue-500 cursor-pointer mt-2"
                                onClick={() =>
                                    setReplyingTo(comment.commentId || '')
                                }
                            >
                                Reply
                            </button>
                        )}
                    {replyingTo === comment.commentId && (
                        <ReplyForm
                            blogId={blogId || ''}
                            parentId={comment.commentId}
                            onCancel={() => setReplyingTo(null)}
                        />
                    )}
                    <button
                        className="text-blue-500 hover:text-blue-600 cursor-pointer mt-2 ml-2"
                        onClick={() => toggleReplies(comment.commentId)}
                    >
                        {expandedCommentId === comment.commentId
                            ? `${t('comment.hideReply')}`
                            : `${t('comment.viewReply')}`}
                    </button>
                </div>
            </div>

            {expandedCommentId === comment.commentId && (
                <div className="ml-5 sm:ml-10 border-l-2 border-gray-300 pl-4 mt-2">
                    {loadingReplies ? (
                        <ReplySkeleton /> // Hiển thị skeleton khi đang tải phản hồi
                    ) : repliesData[comment.commentId]?.length > 0 ? (
                        repliesData[comment.commentId].map((reply) => (
                            <div key={reply.commentId} className="mt-2">
                                {renderComment(reply)}
                            </div>
                        ))
                    ) : (
                        <p>{t('comment.noReply')}</p>
                    )}
                </div>
            )}
        </div>
    );

    if (blogLoading || loadingMainComments || loadingDonation) {
        return (
            <div className="flex flex-col gap-3">
                {/* Hiển thị 3 skeleton khi đang tải bình luận chính */}
                <CommentSkeleton />
                <CommentSkeleton />
                <CommentSkeleton />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {allComments.length > 0 ? (
                allComments.map((comment) => renderComment(comment))
            ) : (
                <p>{t('comment.noComment')}</p>
            )}
        </div>
    );
}
