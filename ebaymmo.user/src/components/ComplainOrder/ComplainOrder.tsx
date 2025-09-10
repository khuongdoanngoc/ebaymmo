import Modal from '../BaseUI/Modal';
import { useState } from 'react';
import Image from 'next/image';
import { useCreateComplainActionMutation, useInsertNotificationsMutation } from '@/generated/graphql';
import StatusModal from '../StatusModal/StatusModal';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { IDataTokenDecode } from '@/types/global.type';
import { jwtDecode } from 'jwt-decode';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface IComplainOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderCode?: string | null;
}

function ComplainOrderModal({
    isOpen,
    onClose,
    orderId,
    orderCode
}: IComplainOrderModalProps) {
    const { data: session } = useSession();
    const [complainImage, setComplainImage] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [complainText, setComplainText] = useState<string>('');
    const [createComplain] = useCreateComplainActionMutation();
    const [insertNotification] = useInsertNotificationsMutation();
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        type: 'loading' | 'success' | 'error';
        message?: string;
    }>({
        isOpen: false,
        type: 'loading'
    });
    const { uploadAvatar } = useUploadAvatar();
    const t = useTranslations('complainOrder');

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || !files[0]) return;

        const file = files[0];
        setImageFile(file);
        setComplainImage(URL.createObjectURL(file));
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
                message: t('submitting')
            });

            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadAvatar(imageFile, userId);
            }

            await createComplain({
                variables: {
                    input: {
                        orderId,
                        content: complainText,
                        image: imageUrl
                    }
                }
            });

            const responseNotification = await insertNotification({
                variables: {
                    objects: [
                        {
                            notificationType: 'Complain Order',
                            content: `User ${session?.user?.name} has complained about order ${orderCode}`,
                            isRead: false,
                            createAt: new Date().toISOString(),
                            userId: session?.user?.id,
                            sentDate: new Date().toISOString()
                        }
                    ]
                }
            })

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: t('submitSuccess')
            });

            setTimeout(() => {
                setStatusModal({ isOpen: false, type: 'success' });
                onClose();
                setComplainText('');
                setComplainImage('');
                setImageFile(null);
            }, 3000);
        } catch (error) {
            if (error instanceof Error && error.message.includes('allowed')) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: t('fileTypeError')
                });
            } else {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: t('submitError')
                });
            }
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                onSubmit={handleSubmit}
                title={t('title')}
                width="1138px"
                buttonTitle={t('sendButton')}
            >
                <div className="flex flex-col gap-[20px]">
                    <div className="flex flex-col items-start gap-[13px]">
                        <div className="text-[20px] font-[500] text-neutral-500">
                            {t('addImages')}
                            <span className="text-neutral-200 ml-1">
                                {t('optional')}
                            </span>
                        </div>
                        <p className="text-[16px] font-[400] text-neutral-500">
                            {t('imageDescription')}
                        </p>
                    </div>

                    <div className="flex items-start gap-[10px] flex-wrap">
                        {complainImage && (
                            <div className="w-[100px] h-[100px]">
                                <Image
                                    className="rounded-[7px] object-cover w-full h-full"
                                    src={complainImage}
                                    width={100}
                                    height={100}
                                    alt={t('complainImage')}
                                />
                            </div>
                        )}
                        {!complainImage && (
                            <label className="w-[100px] h-[100px] flex items-center justify-center bg-white rounded-[7px] border border-dashed border-primary-500 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <Image
                                    src={'/images/upload.svg'}
                                    width={30}
                                    height={30}
                                    alt={t('imageUpload')}
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex flex-col items-start gap-[12px] mb-[20px]">
                        <div className="flex items-start">
                            <h3 className="text-[18px] font-[500]">
                                {t('describeComplaint')} #{orderCode}
                            </h3>
                        </div>
                        <textarea
                            className="w-full min-h-[160px] text-neutral-300 rounded-[15px] pt-4 pl-4 outline-none border border-neutral-200 focus:border-primary-500"
                            placeholder={t('textareaPlaceholder')}
                            value={complainText}
                            onChange={(e) => setComplainText(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            <div className="relative z-[9999]">
                <StatusModal
                    isOpen={statusModal.isOpen}
                    type={statusModal.type}
                    message={statusModal.message}
                    onClose={() =>
                        setStatusModal({ ...statusModal, isOpen: false })
                    }
                />
            </div>
        </>
    );
}

export default ComplainOrderModal;
