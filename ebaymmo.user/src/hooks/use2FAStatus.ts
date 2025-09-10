import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser2FaStatusSubscription } from '@/generated/graphql';

interface Use2FAStatusResult {
    is2FAEnabled: boolean;
    isLoading: boolean;
    error: any;
    restart: () => void;
}

export function use2FAStatus(): Use2FAStatusResult {
    const { data: session } = useSession();
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);

    const {
        data: userData,
        loading: isLoading,
        error,
        restart
    } = useUser2FaStatusSubscription({
        variables: {
            userId: session?.user?.id || ''
        },
        skip: !session?.user?.id
    });

    useEffect(() => {
        if (userData?.usersByPk) {
            setIs2FAEnabled(!!userData.usersByPk.twoFactorEnabled);
        }
    }, [userData]);

    return {
        is2FAEnabled: is2FAEnabled ?? false,
        isLoading: isLoading || is2FAEnabled === null,
        error,
        restart
    };
}
