import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './icons';

declare var QRCode: any; // From CDN

interface QrCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 1 }, (error: any) => {
                if (error) console.error("QR Code generation failed:", error);
            });
        }
    }, [isOpen, url]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 0,
                    paddingTop: '30%', // Aspect ratio from Canva
                    marginBottom: '1rem',
                    overflow: 'hidden',
                    borderRadius: '8px',
                }}>
                    <iframe
                        loading="lazy"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: 0,
                            border: 'none',
                            padding: 0,
                            margin: 0,
                        }}
                        src="https://www.canva.com/design/DAG4pLxMTgM/eWLxbJ3FKnfoUoSGBl8UvA/view?embed"
                    ></iframe>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">Scan to Login</h2>
                <p className="text-slate-400 text-sm mb-4">Use your phone's camera to open this link on your mobile device.</p>
                
                <div className="bg-white p-2 rounded-lg inline-block">
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>
        </div>
    );
};

export default QrCodeModal;