
/**
 * Converts a File object to a base64 encoded string.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the base64 data URL.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file as a string.'));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};
