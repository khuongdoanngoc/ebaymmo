import React from 'react';

const PostSkeleton = () => {
    return (
        <div className="flex flex-col rounded-lg overflow-hidden shadow-md animate-pulse bg-gray-100 h-[450px]">
            <div className="h-48 bg-gray-200" />
            <div className="p-4 flex-1 flex flex-col gap-4">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-16 bg-gray-200 rounded" />
                <div className="mt-auto flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
