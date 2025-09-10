'use client';
import Image from 'next/image';
import Modal from '../BaseUI/Modal';
import { useState, useEffect } from 'react';
import {
    useActionCreateRateMutation,
    useActionUpdateRateMutation,
    useGetStoredetailQuery,
    useGetStoreReviewQuery
} from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { jwtDecode } from 'jwt-decode';
import { IDataTokenDecode } from '@/types/global.type';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import StatusModal from '../StatusModal/StatusModal';
import { useRouter } from 'next/navigation';

interface IPopupReview {
    isOpen: boolean;
    onClose: () => void;
    nameSeller?: string;
    imageSeller?: string;
    nameStore?: string;
    imageStore?: string;
    storeId: string;
}
function PopupReview(props: IPopupReview) {
    const [rating, setRating] = useState<number>(1);
    const [reviewImages, setReviewImages] = useState<string[]>([]);
    const [imagesFile, setImagesFile] = useState<File[]>([]);
    const [reviewText, setReviewText] = useState<string>('');
    const { data: session } = useSession();
    const [avatarLoading, setAvatarLoading] = useState(true);
    const router = useRouter();
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        type: 'loading' | 'success' | 'error';
        message?: string;
    }>({
        isOpen: false,
        type: 'loading'
    });

    const [createRate] = useActionCreateRateMutation();
    const [updateRate] = useActionUpdateRateMutation();
    const { uploadAvatar } = useUploadAvatar();

    const handleStarClick = (starNumber: number) => {
        setRating(starNumber);
    };

    const { data: storeReview } = useGetStoreReviewQuery({
        variables: {
            where: {
                userId: { _eq: session?.user.id },
                storeId: { _eq: props.storeId }
            }
        }
    });

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newImages = Array.from(files).map((file) =>
            URL.createObjectURL(file)
        );
        if (reviewImages.length + newImages.length <= 7) {
            setReviewImages([...reviewImages, ...newImages]);
            setImagesFile((prevFiles) => [...prevFiles, ...Array.from(files)]);
        } else {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: 'You can only upload up to 7 images'
            });
        }
    };

    const handleDeleteImage = (indexToDelete: number) => {
        const deletedImage = reviewImages[indexToDelete];
        setReviewImages(
            reviewImages.filter((_, index) => index !== indexToDelete)
        );

        if (deletedImage.startsWith('blob:')) {
            setImagesFile((prevFiles) =>
                prevFiles.filter((_, index) => index !== indexToDelete)
            );
        }
    };

    const decoded = jwtDecode<IDataTokenDecode>(
        session?.user.accessToken as string
    );
    const userId = decoded['https://hasura.io/jwt/claims']['X-Hasura-User-Id'];

    const handleSubmit = async () => {
        try {
            setStatusModal({
                isOpen: true,
                type: 'loading',
                message: 'Submitting your review...'
            });

            if (userId) {
                const imageUrlArr = [];

                const existingImages = reviewImages.filter(
                    (img) => !img.startsWith('blob:')
                );
                imageUrlArr.push(...existingImages);

                if (imagesFile && imagesFile.length > 0) {
                    for (let i = 0; i < imagesFile.length; i++) {
                        const imageLink = await uploadAvatar(
                            imagesFile[i],
                            userId
                        );
                        imageUrlArr.push(imageLink);
                    }
                }

                const imagesLinkToString = imageUrlArr.join(',');

                if (storeReview?.storeRatings?.[0]) {
                    await updateRate({
                        variables: {
                            id: storeReview.storeRatings?.[0].ratingId,
                            input: {
                                review: reviewText,
                                image: imagesLinkToString,
                                rating: rating
                            }
                        }
                    });
                } else {
                    await createRate({
                        variables: {
                            input: {
                                review: reviewText,
                                storeId: props.storeId,
                                image: imagesLinkToString,
                                rating: rating
                            }
                        }
                    });
                }

                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    message: 'Review submitted successfully!'
                });

                setTimeout(() => {
                    setStatusModal({ isOpen: false, type: 'loading' });
                    props.onClose();
                }, 1500);
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('allowed')) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message:
                        'Only JPEG, PNG, GIF, MP4, MOV, or AVI files are allowed'
                });
            } else {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: 'Failed to submit review. Please try again.'
                });
            }
        }
    };

    const { data: storeDetail, loading } = useGetStoredetailQuery({
        variables: {
            where: {
                storeId: {
                    _eq: props.storeId
                }
            }
        }
    });

    useEffect(() => {
        setAvatarLoading(true);
    }, [props.storeId]);

    useEffect(() => {
        if (storeReview?.storeRatings?.[0]) {
            const review = storeReview?.storeRatings?.[0];
            setRating(review.rating || 1);
            setReviewText(review.review || '');
            if (review.image) {
                setReviewImages(review.image.split(','));
            }
        }
    }, [storeReview]);

    return (
        <>
            <Modal
                title="Store Review"
                buttonTitle="Send"
                isOpen={props.isOpen}
                onClose={props.onClose}
                onSubmit={handleSubmit}
                className="max-w-[880px] overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-green "
                buttonDisabled={!reviewText.trim()}
            >
                <div className="flex lg:flex-row flex-col gap-[53px] mb-[35px] w-full ">
                    <div className="flex flex-col items-start gap-[15px] self-stretch">
                        <div className="relative  rounded-[15px] overflow-hidden">
                            {(loading || avatarLoading) && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-[15px]" />
                            )}
                            {storeDetail?.storeDetails[0] && (
                                <a
                                    href={`/products/${storeDetail.storeDetails[0].slug}`}
                                >
                                    <Image
                                        className="rounded-[15px] object-cover"
                                        src={
                                            storeDetail?.storeDetails[0]
                                                ?.avatar || '/images/test.png'
                                        }
                                        width={290}
                                        height={270}
                                        alt="imageStore"
                                        onLoad={() => setAvatarLoading(false)}
                                        style={{
                                            opacity: avatarLoading ? 0 : 1,
                                            transition:
                                                'opacity 0.1s ease-in-out'
                                        }}
                                    />
                                </a>
                            )}
                        </div>
                        <div className="flex flex-col gap-[10px] justify-center items-start w-[270px] ">
                            <a
                                href={`/products/${storeDetail?.storeDetails[0]?.slug}`}
                                className="font-[500] text-[16px] text-neutral-500"
                            >
                                {storeDetail?.storeDetails[0]?.storeName}
                            </a>
                            <div
                                className="flex items-center gap-[10px] cursor-pointer"
                                onClick={() => {
                                    if (
                                        storeDetail?.storeDetails[0]
                                            ?.sellerUsername
                                    ) {
                                        router.push(
                                            `/chatbox?chatto=${
                                                storeDetail.storeDetails[0]
                                                    .sellerUsername
                                            }`
                                        );
                                    }
                                }}
                            >
                                <div className="flex items-center gap-[5px]">
                                    <Image
                                        className="rounded-[50%]"
                                        src={'/images/product.png'}
                                        width={18}
                                        height={18}
                                        alt="imageStore"
                                    />
                                    <span className="text-sellerBlue text-[14px] font-[400]">
                                        {
                                            storeDetail?.storeDetails[0]
                                                ?.sellerUsername
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-start gap-[37px] w-full">
                        <div className="flex items-start gap-[10px]  w-full ">
                            {[1, 2, 3, 4, 5].map((starNumber) => (
                                <Image
                                    key={starNumber}
                                    className="rounded-[15px] cursor-pointer"
                                    src={`/images/${
                                        starNumber <= rating
                                            ? 'star'
                                            : 'star-gray'
                                    }.svg`}
                                    width={40}
                                    height={40}
                                    alt="star"
                                    onClick={() => handleStarClick(starNumber)}
                                />
                            ))}
                        </div>
                        <div className="flex flex-col items-start gap-[20px] w-full ">
                            <div className="flex flex-col items-start gap-[13px] w-full ">
                                <div className="flex items-center text-[20px] font-[500] text-neutral-500 text-left w-full whitespace-nowrap">
                                    Add Review Images
                                    <span className="text-neutral-200 ml-1">
                                        (optional)
                                    </span>
                                </div>
                                <p className="text-[16px] font-[400] text-neutral-500 w-full text-left">
                                    Add product images to help others better
                                    understand your review. You can add up to 7
                                    images
                                </p>
                            </div>
                            <div className="flex  gap-[10px] flex-wrap ">
                                {reviewImages.map((image, index) => (
                                    <div
                                        key={index}
                                        className="w-[100px] h-[100px] relative group"
                                    >
                                        <Image
                                            className="rounded-[7px] object-cover w-full h-full"
                                            src={image}
                                            width={100}
                                            height={100}
                                            alt={`reviewImage-${index}`}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all rounded-[7px]">
                                            <button
                                                onClick={() =>
                                                    handleDeleteImage(index)
                                                }
                                                className="hidden group-hover:flex p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Delete image"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="white"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                    <line
                                                        x1="10"
                                                        y1="11"
                                                        x2="10"
                                                        y2="17"
                                                    />
                                                    <line
                                                        x1="14"
                                                        y1="11"
                                                        x2="14"
                                                        y2="17"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {reviewImages.length < 7 && (
                                    <label className="w-[100px] h-[100px] flex items-center justify-center bg-white rounded-[7px] border border-dashed border-primary-500 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                        <Image
                                            src={'/images/upload.svg'}
                                            className="items-center"
                                            width={30}
                                            height={30}
                                            alt="imageUpload"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-[12px] w-full">
                            <div className="flex items-start w-full">
                                <h3 className="text-[18px] font-[500] w-full text-left">
                                    Your thoughts about{' '}
                                    {
                                        storeDetail?.storeDetails[0]
                                            ?.sellerUsername
                                    }{' '}
                                    product
                                </h3>
                            </div>
                            <textarea
                                className="w-full  min-h-[160px] text-neutral-300  rounded-[15px] pt-4 pl-4 outline-none border border-neutral-200 focus:border-primary-500"
                                placeholder="Write your review"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
            <div className="relative z-[9999]">
                <StatusModal
                    type={statusModal.type}
                    message={statusModal.message}
                    isOpen={statusModal.isOpen}
                    onClose={() =>
                        setStatusModal({ isOpen: false, type: 'loading' })
                    }
                />
            </div>
        </>
    );
}

export default PopupReview;
