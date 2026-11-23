import { API_BASE_URL } from "../lib/api";

export const handleViewPdf = async (url: string, token: string) => {
    const fullUrl = /^https?:\/\//i.test(url) ? url : API_BASE_URL + url;
    
    try {
        // Fetch the PDF with authorization
        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/pdf,application/octet-stream,*/*'
            },
            cache: 'no-store',
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is actually a PDF
        const contentType = response.headers.get('content-type');
        
        const isPdfLike =
            !contentType ||
            contentType.includes('application/pdf') ||
            contentType.includes('application/octet-stream');

        if (!isPdfLike) {
            console.warn('Response is not a PDF, content-type:', contentType);
            throw new Error('Response is not a PDF');
        }
        
        // Get the blob
        const blob = await response.blob();
        
        // Check if blob is valid
        if (blob.size === 0) {
            throw new Error('PDF file is empty or corrupted');
        }
        
        // Create blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // Try to open in new window first
        const newWindow = window.open(blobUrl, '_blank');
        
        if (newWindow) {
            
            const cleanup = () => {
                URL.revokeObjectURL(blobUrl);
            };
            
            // Try to detect when the window is closed
            const checkClosed = setInterval(() => {
                if (newWindow.closed) {
                    clearInterval(checkClosed);
                    cleanup();
                }
            }, 1000);
            
            // Fallback cleanup after 5 minutes
            setTimeout(() => {
                clearInterval(checkClosed);
                cleanup();
            }, 300000);
            
            return;
        }
        
        // If popup is blocked, create iframe modal
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.maxWidth = '90%';
        modalContent.style.maxHeight = '90%';
        modalContent.style.overflow = 'auto';
        
        const iframe = document.createElement('iframe');
        iframe.src = blobUrl;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginBottom = '10px';
        closeButton.style.padding = '8px 16px';
        closeButton.style.backgroundColor = '#007bff';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => {
            document.body.removeChild(modal);
            URL.revokeObjectURL(blobUrl);
        };
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(iframe);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Clean up after 5 minutes
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
                URL.revokeObjectURL(blobUrl);
            }
        }, 300000);
        
    } catch (error) {
        console.error('Error in PDF viewing:', error);
        
        // Fallback: try to download the file
        try {
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = url.split('/').pop() || 'document.pdf';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (downloadError) {
            console.error('Download also failed:', downloadError);
            alert('Unable to open or download PDF. Please contact support.');
        }
    }
};