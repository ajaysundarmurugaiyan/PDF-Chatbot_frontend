const API_BASE_URL = 'https://pdf-chatbot-backend-vosn.onrender.com';

export const uploadPDF = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        return await response.json();
    } catch (error) {
        console.error('Error uploading PDF:', error);
        throw error;
    }
};

export const askQuestion = async (question, documentId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                pdf_name: documentId,
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error asking question:', error);
        throw error;
    }
}; 
