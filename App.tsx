
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { generateImageWithImagen, editImageWithNanoBanana } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

// --- SVG Icons (defined outside the main component for performance) ---

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.863 2.863l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.863 2.863l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.863-2.863l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036a6 6 0 004.406 4.406l1.036.258a.75.75 0 010 1.456l-1.036.258a6 6 0 00-4.406 4.406l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a6 6 0 00-4.406-4.406l-1.036-.258a.75.75 0 010-1.456l1.036-.258a6 6 0 004.406-4.406l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.551l.57 2.001a3.75 3.75 0 002.583 2.583l2.001.57a.75.75 0 010 1.424l-2.001.57a3.75 3.75 0 00-2.583 2.583l-.57 2.001a.75.75 0 01-1.424 0l-.57-2.001a3.75 3.75 0 00-2.583-2.583l-2.001-.57a.75.75 0 010-1.424l2.001-.57a3.75 3.75 0 002.583-2.583l.57-2.001A.75.75 0 0116.5 15z" clipRule="evenodd" />
  </svg>
);

const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

type Mode = 'generate' | 'edit';

const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>('generate');
    const [prompt, setPrompt] = useState<string>('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const handleFileChange = useCallback(async (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setError(null);
            setIsLoading(true);
            try {
                const base64 = await fileToBase64(file);
                setUploadedImage(base64);
                setResultImage(null); // Clear previous result when new image is uploaded
            } catch (err) {
                setError('Failed to read the image file.');
            } finally {
                setIsLoading(false);
            }
        } else {
            setError('Please select a valid image file.');
        }
    }, []);

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e.target.files?.[0] || null);
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files?.[0] || null);
    };

    const handleDragEvents = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const generated = await generateImageWithImagen(prompt);
            setResultImage(generated);
        } catch (err: any) {
            setError(`Image generation failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, isLoading]);

    const handleEdit = useCallback(async () => {
        if (!prompt || !uploadedImage || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const edited = await editImageWithNanoBanana(uploadedImage, prompt);
            setResultImage(edited);
        } catch (err: any) {
            setError(`Image editing failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, uploadedImage, isLoading]);
    
    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `banner-${Date.now()}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const currentActionHandler = mode === 'generate' ? handleGenerate : handleEdit;
    const isActionButtonDisabled = isLoading || !prompt || (mode === 'edit' && !uploadedImage);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    AI Banner Studio
                </h1>
                <p className="text-gray-400 mt-2">Generate print-ready banners from text or by editing your own images.</p>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row gap-8">
                {/* --- Left Column: Controls --- */}
                <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
                    {/* Mode Switcher */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => { setMode('generate'); setPrompt(''); setUploadedImage(null); setResultImage(null); }}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${mode === 'generate' ? 'bg-purple-600 shadow-lg' : 'hover:bg-gray-700'}`}
                        >
                            Generate New
                        </button>
                        <button
                            onClick={() => { setMode('edit'); setPrompt(''); setUploadedImage(null); setResultImage(null); }}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${mode === 'edit' ? 'bg-purple-600 shadow-lg' : 'hover:bg-gray-700'}`}
                        >
                            Edit Image
                        </button>
                    </div>

                    {/* Image Upload for Edit Mode */}
                    {mode === 'edit' && (
                         <div>
                            <label className={`flex justify-center w-full h-32 px-4 transition bg-gray-800 border-2 ${isDragging ? 'border-purple-500' : 'border-gray-600'} border-dashed rounded-md appearance-none cursor-pointer hover:border-purple-400 focus:outline-none`}
                                onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop}>
                                <span className="flex items-center space-x-2">
                                    {uploadedImage ? (
                                        <img src={uploadedImage} alt="Uploaded preview" className="h-28 w-auto object-contain rounded-md p-1"/>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="font-medium text-gray-400">
                                                Drop an image, or <span className="text-purple-400 underline">browse</span>
                                            </span>
                                        </>
                                    )}
                                </span>
                                <input type="file" name="file_upload" className="hidden" accept="image/*" onChange={onFileChange} />
                            </label>
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div className="flex-grow flex flex-col">
                         <label htmlFor="prompt" className="text-gray-300 mb-2 font-semibold">
                            {mode === 'generate' ? 'Describe your banner:' : 'Describe the edits:'}
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={mode === 'generate' ? "e.g., A grand opening banner for a coffee shop, vintage style..." : "e.g., Add '50% OFF' in a modern font, make the background blue..."}
                            className="w-full flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                            rows={5}
                        />
                    </div>
                </div>

                {/* --- Right Column: Display --- */}
                <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col">
                    <div className="flex-grow bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center p-4 relative aspect-[16/9]">
                        {isLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10 rounded-lg">
                                <div className="w-12 h-12 border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin"></div>
                                <p className="mt-4 text-lg">AI is creating... Please wait.</p>
                            </div>
                        )}
                        {!isLoading && !resultImage && (
                            <div className="text-center text-gray-500">
                                <PhotoIcon className="mx-auto h-24 w-24" />
                                <p className="mt-2">Your generated banner will appear here</p>
                            </div>
                        )}
                        {resultImage && (
                            <img src={resultImage} alt="Generated banner" className="max-h-full max-w-full object-contain rounded-md" />
                        )}
                         {resultImage && !isLoading && (
                            <button onClick={handleDownload} className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                                <DownloadIcon className="h-6 w-6"/>
                            </button>
                        )}
                    </div>
                     {error && (
                        <div className="mt-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                                <svg className="fill-current h-6 w-6 text-red-200" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                            </span>
                        </div>
                    )}
                </div>
            </main>
             {/* --- Sticky Action Button on Mobile --- */}
            <div className="lg:hidden sticky bottom-0 left-0 right-0 p-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm mt-4">
                 <button 
                    onClick={currentActionHandler} 
                    disabled={isActionButtonDisabled}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    <SparklesIcon className="h-5 w-5" />
                    {mode === 'generate' ? 'Generate Banner' : 'Apply Edits'}
                </button>
            </div>
             {/* --- Action Button for Desktop --- */}
            <div className="hidden lg:flex justify-end mt-8">
                 <button 
                    onClick={currentActionHandler} 
                    disabled={isActionButtonDisabled}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    <SparklesIcon className="h-5 w-5" />
                    {mode === 'generate' ? 'Generate Banner' : 'Apply Edits'}
                </button>
            </div>
        </div>
    );
};

export default App;
