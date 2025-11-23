import React from 'react';
import { SpinnerIcon } from './icons';

interface LoginProps {
  onLogin: () => void;
  error?: string | null;
  isLoading?: boolean;
}

const MicrosoftIcon = () => (
    <svg width="21" height="21" viewBox="0 0 21 21" className="mr-2">
        <path fill="#f25022" d="M1 1h9v9H1z"></path>
        <path fill="#00a4ef" d="M1 11h9v9H1z"></path>
        <path fill="#7fba00" d="M11 1h9v9h-9z"></path>
        <path fill="#ffb900" d="M11 11h9v9h-9z"></path>
    </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin, error, isLoading }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-900 rounded-2xl shadow-lg border border-slate-700">
        <div className="text-center">
            <div style={{
              position: 'relative',
              width: '100%',
              height: 0,
              paddingTop: '100%',
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
              ></iframe>
            </div>
            <p className="mt-2 text-slate-400">Sign in to access your dashboard</p>
        </div>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline text-sm">{error}</span>
            </div>
        )}

        <button
          onClick={onLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 text-lg font-medium rounded-lg text-slate-200 bg-slate-800 border border-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="w-5 h-5 mr-3 text-white" />
              Please wait...
            </>
          ) : (
            <>
              <MicrosoftIcon />
              Sign in with Microsoft
            </>
          )}
        </button>
        <p className="text-xs text-center text-slate-500">
            By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
};

export default Login;