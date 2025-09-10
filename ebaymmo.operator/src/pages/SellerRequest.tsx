import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    useGetSellerRegistrationQuery,
    useUpdateSellerRegistrationMutation,
    useUpdateUserMutation
} from '@/generated/graphql';
import StatusModal from '@/components/StatusModal/StatusModal';
import ImagePreviewModal from '@/components/ImagePreviewModal/ImagePreviewModal';
import React from 'react';

export default function SellerRequest() {
    const [modalState, setModalState] = React.useState<{
        isOpen: boolean;
        type: 'loading' | 'warning' | 'error' | 'success';
        message: string;
    }>({
        isOpen: false,
        type: 'success',
        message: ''
    });

    const [previewImage, setPreviewImage] = React.useState<{
        isOpen: boolean;
        url: string;
    }>({
        isOpen: false,
        url: ''
    });

    const {
        data: sellerRequests,
        loading: sellerRequestsLoading,
        refetch
    } = useGetSellerRegistrationQuery({
        variables: {
            where: {
                status: {
                    _eq: 'Pending'
                }
            }
        }
    });

    const [updateStoreRegistrations] = useUpdateSellerRegistrationMutation();
    const [updateUsers] = useUpdateUserMutation();

    const handleSellerApproval = async (id: string, email: string) => {
        setModalState({
            isOpen: true,
            type: 'loading',
            message: 'Approving seller request...'
        });

        try {
            await updateStoreRegistrations({
                variables: {
                    where: {
                        registrationId: {
                            _eq: id
                        }
                    },
                    _set: {
                        status: 'Approved',
                        updatedAt: new Date().toISOString()
                    }
                }
            });
            await updateUsers({
                variables: {
                    where: {
                        email: {
                            _eq: email
                        }
                    },
                    _set: {
                        sellerSince: new Date().toISOString()
                    }
                }
            });
            setModalState({
                isOpen: true,
                type: 'success',
                message: 'Seller request approved successfully'
            });
            refetch();
        } catch (error) {
            setModalState({
                isOpen: true,
                type: 'error',
                message: 'Failed to approve seller request'
            });
        }
    };

    const handleSellerRejection = async (id: string) => {
        setModalState({
            isOpen: true,
            type: 'loading',
            message: 'Rejecting seller request...'
        });

        try {
            await updateStoreRegistrations({
                variables: {
                    where: {
                        registrationId: {
                            _eq: id
                        }
                    },
                    _set: {
                        status: 'Rejected',
                        updatedAt: new Date().toISOString()
                    }
                }
            });
            setModalState({
                isOpen: true,
                type: 'success',
                message: 'Seller request rejected successfully'
            });
            refetch();
        } catch (error) {
            setModalState({
                isOpen: true,
                type: 'error',
                message: 'Failed to reject seller request'
            });
        }
    };

    const handleCloseModal = () => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleImageClick = (imageUrl: string) => {
        setPreviewImage({
            isOpen: true,
            url: imageUrl
        });
    };

    const handleClosePreview = () => {
        setPreviewImage({
            isOpen: false,
            url: ''
        });
    };

    if (sellerRequestsLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <>
            <StatusModal
                type={modalState.type}
                message={modalState.message}
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
            />
            <ImagePreviewModal
                isOpen={previewImage.isOpen}
                onClose={handleClosePreview}
                imageUrl={previewImage.url}
            />
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Seller Requests</h1>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>ID Card Image</TableHead>
                                <TableHead>Portrait Photo</TableHead>
                                <TableHead>Request Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sellerRequests?.storeRegistrations?.length ===
                            0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-4"
                                    >
                                        No seller requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sellerRequests?.storeRegistrations?.map(
                                    (request) => (
                                        <TableRow key={request.registrationId}>
                                            <TableCell>
                                                <div>
                                                    {request.user.fullName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {request.user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {request.phoneNumber}
                                            </TableCell>
                                            <TableCell>
                                                {request.idCardImage && (
                                                    <img
                                                        src={
                                                            request.idCardImage
                                                        }
                                                        alt="id-card-image"
                                                        className="w-20 h-20 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() =>
                                                            handleImageClick(
                                                                request.idCardImage
                                                            )
                                                        }
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {request.portraitPhoto && (
                                                    <img
                                                        src={
                                                            request.portraitPhoto
                                                        }
                                                        alt="portrait-photo"
                                                        className="w-20 h-20 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() =>
                                                            handleImageClick(
                                                                request.portraitPhoto
                                                            )
                                                        }
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {request.status ===
                                                'Pending' ? (
                                                    <div className="flex space-x-2 !w-[80px]">
                                                        <Button
                                                            onClick={() =>
                                                                handleSellerApproval(
                                                                    request.registrationId,
                                                                    request.user
                                                                        .email
                                                                )
                                                            }
                                                            className="flex-1"
                                                            variant="default"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            onClick={() =>
                                                                handleSellerRejection(
                                                                    request.registrationId
                                                                )
                                                            }
                                                            className="flex-1"
                                                            variant="destructive"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <></>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                )
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}
