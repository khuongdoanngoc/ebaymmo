import { useGetPresignedUrlMutation } from '@/generated/graphql';

export const useUploadAvatar = () => {
    const [getPresignedUrl] = useGetPresignedUrlMutation();
    const uploadAvatar = async (file: File, userId: string) => {
        if (!file) throw new Error('No file selected');
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo'
        ];
        if (!allowedTypes.includes(file.type)) {
            throw new Error(
                'Only JPEG, PNG, GIF, MP4, MOV, or AVI files are allowed'
            );
        }
        const fileName = file.name.split('.').slice(0, -1).join('.');
        const fileExtension = file.name.split('.').pop() || '';
        // Gửi mutation lên Hasura
        const { data } = await getPresignedUrl({
            variables: { userId, fileName, fileExtension }
        });
        if (!data?.getPresignedUrl?.url) {
            throw new Error('Failed to get upload URL');
        }
        const { url } = data.getPresignedUrl;
        // Upload file using presigned URL
        const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });
        if (!uploadResponse.ok) throw new Error('Upload failed');
        // Convert to public URL by removing query params
        const publicUrl = url.split('?')[0];

        return publicUrl;
    };
    return { uploadAvatar };
};
