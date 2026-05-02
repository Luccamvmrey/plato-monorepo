/**
 * Formats a duration in seconds into a string (H:MM:SS or MM:SS).
 * @param totalSeconds Duration in seconds
 * @returns Formatted string
 */
export const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Formats a duration in seconds into an extensive string (e.g., "1h 05m" or "45 min").
 * @param seconds Duration in seconds
 * @returns Formatted string
 */
export const formatDurationExtensive = (seconds: number): string => {
    if (seconds >= 3600) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    }
    return `${Math.floor(seconds / 60)} min`;
};
