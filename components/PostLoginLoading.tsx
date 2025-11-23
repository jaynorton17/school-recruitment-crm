import React from 'react';

// New sleigh SVG with a bright red color
const SantaSleigh = () => (
    <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
        <g transform="scale(-1, 1) translate(-200, 0)">
            {/* Reins */}
            <path d="M130 50 C 90 45, 60 48, 30 52" stroke="#8B4513" fill="none" strokeWidth="1"/>
            
            {/* Reindeer */}
            <g fill="#A0522D" stroke="#654321" strokeWidth="0.5">
                {/* Reindeer 1 */}
                <rect x="20" y="50" width="15" height="10" rx="3" />
                <path d="M22 50 l-3 -5 M28 50 l3 -5" stroke="#654321" strokeWidth="1" fill="none" />
                <circle cx="33" cy="51" r="1.5" fill="#ef4444" />
                {/* Reindeer 2 */}
                <rect x="50" y="50" width="15" height="10" rx="3" />
                <path d="M52 50 l-3 -5 M58 50 l3 -5" stroke="#654321" strokeWidth="1" fill="none" />
            </g>
            
            {/* Sleigh Body - BRIGHT RED */}
            <path d="M100 80 Q 95 60, 110 60 L 170 60 Q 185 60, 180 80 Z" fill="#dc2626" />
            <path d="M98 80 Q 140 95, 182 80" fill="none" stroke="#D4AF37" strokeWidth="3" />
            
            {/* Sleigh Back - DARKER RED */}
            <path d="M100 80 C 80 80, 85 45, 105 45 L 115 45 L 110 60 Z" fill="#b91c1c" />
            
            {/* Presents */}
            <rect x="120" y="45" width="20" height="15" fill="#34D399" />
            <rect x="145" y="50" width="15" height="10" fill="#FBBF24" />
            
            {/* Santa */}
            <g>
                <circle cx="118" cy="40" r="10" fill="#dc2626" />
                <circle cx="118" cy="30" r="6" fill="#FFDDC1" />
                <rect x="114" y="22" width="8" height="4" fill="#dc2626" />
            </g>
        </g>
    </svg>
);


// Updated component to take progress prop
const PostLoginLoading: React.FC<{ progress: number }> = ({ progress }) => {
  const numFlakes = 150;
  const snowflakes = Array.from({ length: numFlakes }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}vw`,
      animationDuration: `${Math.random() * 8 + 7}s`,
      animationDelay: `${Math.random() * 10}s`,
      opacity: Math.random() * 0.5 + 0.3,
      width: `${Math.random() * 4 + 1}px`,
      height: `${Math.random() * 4 + 1}px`,
    };
    return <div key={i} className="snowflake" style={style}></div>;
  });

  return (
    <div className="post-login-loading">
      <style>{`
        .post-login-loading {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #0f172a; /* slate-900 */
          overflow: hidden;
          z-index: 9999;
        }
        .snowflake {
          position: absolute;
          top: -20px;
          background-color: white;
          border-radius: 50%;
          animation: fall linear infinite;
        }
        @keyframes fall {
          to {
            transform: translateY(105vh);
          }
        }
        .sleigh-container {
            position: absolute;
            top: 15%;
            left: -250px;
            width: 200px;
            animation: sleigh-fly 20s linear infinite;
        }
        @keyframes sleigh-fly {
          0% {
            transform: translateX(0vw) translateY(20px) rotate(-3deg);
          }
          100% {
            transform: translateX(calc(100vw + 250px)) translateY(-10px) rotate(3deg);
          }
        }
        .loading-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            width: 90%;
            max-width: 450px;
        }
        .progress-bar {
            width: 100%;
            height: 10px;
            background-color: #1e293b; /* slate-800 */
            border-radius: 5px;
            overflow: hidden;
            margin-top: 1.5rem;
            border: 1px solid #334155;
        }
        .progress-bar-inner {
            height: 100%;
            background: linear-gradient(90deg, #38bdf8, #67e8f9);
            border-radius: 5px;
            transition: width 0.4s ease-out;
            box-shadow: 0 0 10px #38bdf8;
        }
      `}</style>

      {snowflakes}

      <div className="sleigh-container">
        <SantaSleigh />
      </div>

      <div className="loading-content">
        <h1 className="text-4xl font-bold">Welcome Back!</h1>
        <p className="mt-3 text-lg text-slate-300">Getting your CRM ready for a productive day...</p>
        <div className="progress-bar">
          <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="mt-3 text-xl font-mono tracking-wider">{Math.floor(progress)}%</p>
      </div>
    </div>
  );
};

export default PostLoginLoading;