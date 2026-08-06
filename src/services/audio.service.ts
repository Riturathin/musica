export const formatDuration = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const clampProgress = (value: number, duration: number) => {
    if (value < 0) {
        return 0;
    }

    if (value > duration) {
        return duration;
    }

    return value;
};
