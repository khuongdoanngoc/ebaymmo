import { useState, useEffect } from 'react';

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

export const useCountdown = (endDate: string | null): CountdownTime => {
    const [timeLeft, setTimeLeft] = useState<CountdownTime>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false
    });

    useEffect(() => {
        if (!endDate) return;

        const calculateTimeLeft = () => {
            const difference =
                new Date(endDate).getTime() - new Date().getTime();

            if (difference <= 0) {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isExpired: true
                });
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                isExpired: false
            });
        };

        // Calculate immediately
        calculateTimeLeft();

        // Update every second
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    return timeLeft;
};
