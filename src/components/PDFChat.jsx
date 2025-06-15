import React, { useState, useRef, useEffect } from 'react';
import { uploadPDF, askQuestion } from '../services/api';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FaFileUpload, FaMicrophone, FaMicrophoneSlash, FaTrash } from 'react-icons/fa';

const PDFChat = () => {
    const [file, setFile] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [question, setQuestion] = useState('');
    const [history, setHistory] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setQuestion(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        if (!browserSupportsSpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
        }

        navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
            alert("Microphone access denied. Please allow mic access in your browser settings.");
        });
    }, []);

    const getCurrentPDFKey = () => file ? `pdfqa_${file.name}` : null;

    const handleFileUpload = async (event) => {
        const uploadedFile = event.target.files[0];
        if (!uploadedFile) return;
        setFile(uploadedFile);
        setLoading(true);
        setUploadStatus('uploading');
        try {
            const response = await uploadPDF(uploadedFile);
            setDocumentId(response.document_id);
            setUploadStatus('success');

            const pdfKey = `pdfqa_${uploadedFile.name}`;
            const storedHistory = localStorage.getItem(pdfKey);
            if (storedHistory) {
                const parsed = JSON.parse(storedHistory);
                setHistory(parsed);
                setSelectedIndex(parsed.length > 0 ? parsed.length - 1 : null);
            } else {
                setHistory([]);
                setSelectedIndex(null);
            }
            setQuestion('');
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadStatus('error');
            alert('Please upload a valid PDF file.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        if (!documentId || !question.trim()) return;
        setLoading(true);
        try {
            const response = await askQuestion(question, documentId);
            const newEntry = {
                question,
                answer: response.answer,
                sources: response.sources || [],
            };
            const updatedHistory = [...history, newEntry];
            setHistory(updatedHistory);
            setSelectedIndex(updatedHistory.length - 1);
            setQuestion('');
            resetTranscript();

            const pdfKey = getCurrentPDFKey();
            if (pdfKey) {
                localStorage.setItem(pdfKey, JSON.stringify(updatedHistory));
            }
        } catch (error) {
            console.error('Error getting answer:', error);
            alert("Failed to get answer. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        if (!browserSupportsSpeechRecognition) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }

        try {
            if (listening) {
                SpeechRecognition.stopListening();
            } else {
                resetTranscript();
                SpeechRecognition.startListening({ continuous: true });
            }
        } catch (err) {
            console.error("Speech recognition error:", err);
            alert("Speech recognition failed. Check mic permissions.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* Left Panel */}
            <div className="w-full md:w-1/2 p-2 md:p-6 flex flex-col bg-black text-white min-h-[50vh]">
                <div className="mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">PDF Chat</h2>
                    <div className="flex flex-col items-center space-y-3 md:space-y-4">
                        <div className='flex items-center space-x-2 md:space-x-4'>
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full flex items-center justify-center border-4 border-[#00BFFF]">
                                <FaFileUpload className="w-7 h-7 md:w-10 md:h-10 text-[#00BFFF]" />
                            </div>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="bg-[#00BFFF] text-black px-3 md:px-6 py-2 md:py-3 rounded-lg hover:bg-[#33CCFF] transition-colors font-bold border-2 border-[#00BFFF] text-sm md:text-base"
                            >
                                Upload PDF
                            </button>
                        </div>
                        {file && (
                            <div className="text-white">
                                <span className="text-xs md:text-sm block">{file.name}</span>
                                {uploadStatus === 'uploading' && <span className="text-blue-500">Uploading...</span>}
                                {uploadStatus === 'success' && <span className="text-green-500">Upload successful!</span>}
                                {uploadStatus === 'error' && <span className="text-red-500">Upload failed. Please try again.</span>}
                            </div>
                        )}
                    </div>
                    <div className="h-3 md:h-6" />
                </div>

                {/* Q&A History */}
                <div className="flex-1 overflow-y-auto mb-2 md:mb-4 bg-[#111] rounded-lg shadow-inner p-1 md:p-2 border border-[#00BFFF] min-h-[120px] max-h-[30vh] md:max-h-full">
                    {history.length > 0 ? history.map((item, idx) => (
                        <div key={idx} className={`flex items-center mb-1 rounded border-2 transition-colors ${selectedIndex === idx ? 'bg-[#00BFFF] text-black border-[#00BFFF]' : 'bg-black text-white border-[#00BFFF]'} hover:bg-[#33CCFF] hover:text-black`}>
                            <button
                                onClick={() => setSelectedIndex(idx)}
                                type="button"
                                className="flex-1 text-left px-2 md:px-3 py-1 md:py-2 font-medium focus:outline-none bg-transparent text-xs md:text-base"
                            >
                                {item.question}
                            </button>
                            <button
                                onClick={() => {
                                    const updated = history.filter((_, i) => i !== idx);
                                    setHistory(updated);
                                    const pdfKey = `pdfqa_${file.name}`;
                                    if (pdfKey) {
                                        localStorage.setItem(pdfKey, JSON.stringify(updated));
                                    }
                                    setSelectedIndex(prev => {
                                        if (prev === idx) {
                                            return updated.length === 0 ? null : Math.max(0, idx - 1);
                                        } else if (prev > idx) {
                                            return prev - 1;
                                        }
                                        return prev;
                                    });
                                }}
                                className="px-2 py-2 text-red-500 hover:text-red-600 focus:outline-none bg-transparent"
                                title="Delete question"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    )) : (
                        <div className="text-gray-400 text-xs md:text-sm">No questions asked yet.</div>
                    )}
                </div>

                {/* Question input */}
                <form onSubmit={handleQuestionSubmit} className="flex space-x-2 sticky bottom-0 bg-black pt-2 pb-2 z-10">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            className="w-full px-3 md:px-4 py-2 rounded border-2 border-[#00BFFF] bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#00BFFF] placeholder-gray-400 text-xs md:text-base"
                            placeholder="Type your question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={loading}
                        />
                        {browserSupportsSpeechRecognition && (
                            <button
                                type="button"
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${listening ? 'text-[#00BFFF]' : 'text-gray-400'}`}
                                onClick={toggleListening}
                                tabIndex={-1}
                            >
                                {listening ? <FaMicrophone /> : <FaMicrophoneSlash />}
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="bg-[#00BFFF] text-black px-3 md:px-4 py-2 rounded hover:bg-[#33CCFF] transition-colors font-semibold border-2 border-[#00BFFF] text-xs md:text-base"
                        disabled={loading || !question.trim()}
                    >
                        {loading ? 'Asking...' : 'Ask'}
                    </button>
                </form>

                {/* Debug Info (Optional) */}
                <div className="text-xs text-gray-400 mt-1">
                    <p>Listening: {listening ? 'Yes' : 'No'}</p>
                    <p>Transcript: {transcript}</p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full md:w-1/2 p-2 md:p-6 bg-black text-white min-h-[40vh] max-h-[60vh] md:min-h-[50vh] md:max-h-full overflow-y-auto">
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">AI Response</h2>
                <div className="space-y-4">
                    {history[selectedIndex] ? (
                        <div className="bg-[#111] rounded-lg p-2 md:p-4 border border-[#00BFFF] break-words overflow-x-auto max-w-full">
                            <div className="mb-2">
                                <span className="font-bold text-base md:text-lg text-[#00BFFF] break-words">{history[selectedIndex].question}?</span>
                            </div>
                            <h3 className="font-semibold mb-2 text-[#00BFFF] text-sm md:text-base">Answer:</h3>
                            <p className="text-white mb-4 text-xs md:text-base break-words whitespace-pre-line" style={{ wordBreak: 'break-word' }}>{history[selectedIndex].answer}</p>
                            {history[selectedIndex].sources && history[selectedIndex].sources.length > 0 && (
                                <>
                                    <h4 className="font-semibold mb-2 text-[#00BFFF] text-sm md:text-base">Sources:</h4>
                                    <div className="space-y-2">
                                        {history[selectedIndex].sources.map((source, index) => (
                                            <div key={index} className="p-2 md:p-3 bg-black rounded border border-[#00BFFF] break-words overflow-x-auto max-w-full">
                                                <p className="text-sm md:text-base text-white break-words whitespace-pre-line" style={{ wordBreak: 'break-word' }}>{source}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>Ask a question to see the AI response here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PDFChat;
