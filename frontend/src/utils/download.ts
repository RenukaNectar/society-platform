import { API_BASE_URL } from "../lib/api";

export const download = async (url: string, token: string, filename?: string) => {
    const fullUrl = /^https?:\/\//i.test(url) ? url : API_BASE_URL + url;
    
    // Extract filename from URL if not provided
    const getFilename = (url: string) => {
        if (filename) return filename;
        
        // Try to extract filename from URL
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        // If URL has query parameters, remove them
        const cleanFilename = lastPart.split('?')[0];
        
        // If no filename found, generate a default one
        if (!cleanFilename || cleanFilename === '') {
            return 'document';
        }
        
        return cleanFilename;
    };

    try {
        // Add authorization header by creating a blob URL
        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check content type to ensure we're getting the right file
        const contentType = response.headers.get('content-type');
        const contentDisposition = response.headers.get('content-disposition');
        
        console.log('Download response:', {
            status: response.status,
            contentType,
            contentDisposition,
            contentLength: response.headers.get('content-length')
        });

        const blob = await response.blob();
        
        // Validate blob
        if (blob.size === 0) {
            throw new Error('Downloaded file is empty or corrupted');
        }

        console.log('Download blob:', {
            size: blob.size,
            type: blob.type
        });

        // Create blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = getFilename(url);
        link.style.display = 'none';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL after a longer delay to ensure download completes
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            console.log('Cleaned up download blob URL');
        }, 10000); // 10 seconds instead of 1 second
        
        return true;
    } catch (error) {
        console.error('Error downloading document:', error);
        
        // Fallback: try to open in new tab if download fails
        try {
            console.log('Trying fallback: open in new tab');
            const link = document.createElement('a');
            link.href = fullUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.click();
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw new Error('Unable to download or open document');
        }
    }
};

// Specialized download function for specific file types
export const downloadDocument = (url: string, token: string, filename?: string) => {
    return download(url, token, filename);
};

// Download function that opens document in new tab instead of downloading
export const openDocument = async (url: string, token: string) => {
    const fullUrl = /^https?:\/\//i.test(url) ? url : API_BASE_URL + url;
    
    try {
        // Fetch the document with authentication first
        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Create blob URL for opening
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Try to open in new window
        const newWindow = window.open(blobUrl, '_blank');
        
        if (newWindow) {
            // Clean up blob URL when window is closed
            const checkClosed = setInterval(() => {
                if (newWindow.closed) {
                    clearInterval(checkClosed);
                    URL.revokeObjectURL(blobUrl);
                }
            }, 1000);
            
            // Fallback cleanup after 5 minutes
            setTimeout(() => {
                clearInterval(checkClosed);
                URL.revokeObjectURL(blobUrl);
            }, 300000);
            
            return true;
        } else {
            // If popup is blocked, fallback to download
            console.log('Popup blocked, falling back to download');
            URL.revokeObjectURL(blobUrl);
            return await download(url, token);
        }
    } catch (error) {
        console.error('Error opening document:', error);
        throw error;
    }
};

// Download function with progress indicator
export const downloadWithProgress = async (url: string, token: string, filename?: string, onProgress?: (progress: number) => void) => {
    const fullUrl = API_BASE_URL + url;
    
    try {
        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body not readable');
        }

        const chunks: Uint8Array[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            loaded += value.length;
            
            if (onProgress && total > 0) {
                const progress = (loaded / total) * 100;
                onProgress(progress);
            }
        }

        // Combine chunks into blob
        const blob = new Blob(chunks);
        const blobUrl = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || getFilename(url);
        link.style.display = 'none';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL after a longer delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        
        return true;
    } catch (error) {
        console.error('Error downloading document with progress:', error);
        throw error;
    }
};

// Helper function to get filename from URL
const getFilename = (url: string) => {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    
    // If URL has query parameters, remove them
    const cleanFilename = lastPart.split('?')[0];
    
    // If no filename found, generate a default one
    if (!cleanFilename || cleanFilename === '') {
        return 'document';
    }
    
    return cleanFilename;
};

// Utility to determine document type and appropriate action
export const getDocumentInfo = (url: string) => {
    const filename = getFilename(url);
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const documentTypes = {
        // Viewable in browser
        viewable: ['pdf', 'txt', 'html', 'htm'],
        // Image formats
        image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
        // Office documents (may need special handling)
        office: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        // Archive files
        archive: ['zip', 'rar', '7z', 'tar', 'gz'],
        // Code files
        code: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml'],
        // Audio/Video
        media: ['mp3', 'mp4', 'avi', 'mov', 'wav', 'flv', 'webm']
    };
    
    let type = 'download'; // Default action
    let category = 'other';
    
    if (extension) {
        if (documentTypes.viewable.includes(extension)) {
            type = 'view';
            category = 'viewable';
        } else if (documentTypes.image.includes(extension)) {
            type = 'view';
            category = 'image';
        } else if (documentTypes.office.includes(extension)) {
            type = 'download'; // Office docs usually need to be downloaded
            category = 'office';
        } else if (documentTypes.archive.includes(extension)) {
            type = 'download';
            category = 'archive';
        } else if (documentTypes.code.includes(extension)) {
            type = 'view';
            category = 'code';
        } else if (documentTypes.media.includes(extension)) {
            type = 'view';
            category = 'media';
        }
    }
    
    return {
        filename,
        extension,
        type, // 'view' or 'download'
        category,
        mimeType: getMimeType(extension)
    };
};

// Get MIME type for common file extensions
const getMimeType = (extension?: string): string => {
    if (!extension) return 'application/octet-stream';
    
    const mimeTypes: Record<string, string> = {
        // Documents
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'html': 'text/html',
        'htm': 'text/html',
        
        // Images
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        
        // Office
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        
        // Archives
        'zip': 'application/zip',
        'rar': 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        
        // Code
        'js': 'application/javascript',
        'ts': 'application/typescript',
        'jsx': 'text/jsx',
        'tsx': 'text/jsx',
        'css': 'text/css',
        'json': 'application/json',
        'xml': 'application/xml',
        
        // Media
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wav': 'audio/wav',
        'flv': 'video/x-flv',
        'webm': 'video/webm'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
};

// Smart document handler - automatically chooses best action
export const handleDocument = async (url: string, token: string, filename?: string) => {
    const docInfo = getDocumentInfo(url);
    
    try {
        if (docInfo.type === 'view') {
            // For viewable documents, try to open in new tab
            return await openDocument(url, token);
        } else {
            // For other documents, download them
            return await download(url, token, filename);
        }
    } catch (error) {
        console.error('Error handling document:', error);
        throw error;
    }
};

// Preview document in modal/iframe (for viewable documents)
export const previewDocument = async (url: string, token: string) => {
    const docInfo = getDocumentInfo(url);
    
    if (docInfo.type === 'view') {
        try {
            // Fetch the document with authentication first
            const response = await fetch(API_BASE_URL + url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Create blob URL for preview
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            // Create modal with iframe for preview
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] w-full mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">${docInfo.filename}</h3>
                        <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="w-full h-[70vh]">
                        <iframe src="${blobUrl}" class="w-full h-full border rounded" frameborder="0"></iframe>
                    </div>
                    <div class="flex justify-end mt-4 space-x-2">
                        <button class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onclick="this.closest('.fixed').remove()">
                            Close
                        </button>
                        <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onclick="window.downloadDocument('${url}', '${token}', '${docInfo.filename}')">
                            Download
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Clean up blob URL when modal is closed
            const cleanup = () => {
                URL.revokeObjectURL(blobUrl);
                console.log('Cleaned up preview blob URL');
            };
            
            // Close modal on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    cleanup();
                }
            });
            
            // Add close button functionality
            const closeButton = modal.querySelector('button');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    modal.remove();
                    cleanup();
                });
            }
            
            // Fallback cleanup after 5 minutes
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    modal.remove();
                    cleanup();
                }
            }, 300000);
            
            return modal;
        } catch (error) {
            console.error('Error previewing document:', error);
            // Fallback to download
            return await download(url, token, docInfo.filename);
        }
    } else {
        // For non-viewable documents, just download
        return await download(url, token, docInfo.filename);
    }
};