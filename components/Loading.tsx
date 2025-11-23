import React from 'react';
import { SpinnerIcon } from './icons';

const Loading: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-800">
            <div className="text-center p-4">
                <div className="w-48 mx-auto">
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: 0,
                        paddingTop: '100.0000%',
                        paddingBottom: 0,
                        boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)',
                        marginTop: '1.6em',
                        marginBottom: '0.9em',
                        overflow: 'hidden',
                        borderRadius: '8px',
                        willChange: 'transform'
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
                                margin: 0
                            }}
                            src="https://www.canva.com/design/DAG4pIbFJNg/zuETWgjtmc_FUAOPVWbyRA/view?embed"
                            allowFullScreen
                            allow="fullscreen"
                        ></iframe>
                    </div>
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-4">EduTalent Connect CRM</h1>

                <div className="flex items-center justify-center text-slate-300">
                    <SpinnerIcon className="w-6 h-6 mr-3" />
                    <p className="text-lg">Initializing...</p>
                </div>
            </div>
        </div>
    );
};

export default Loading;
