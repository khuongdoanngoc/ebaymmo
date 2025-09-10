export const delayMs = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
