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


const Snowman = () => (
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="snow-shadow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </radialGradient>
    </defs>
    <g className="snowman-body" stroke="#0f172a" strokeWidth="2" fill="url(#snow-shadow)">
      <circle cx="60" cy="110" r="35" />
      <circle cx="60" cy="60" r="28" />
    </g>
    <g className="snowman-arms" strokeLinecap="round" stroke="#0f172a" strokeWidth="4" fill="none">
      <path d="M35 95 Q 20 90 10 80" />
      <path d="M85 95 Q 100 90 110 80" />
    </g>
    <g fill="#0f172a">
      <circle cx="50" cy="55" r="3" />
      <circle cx="70" cy="55" r="3" />
    </g>
    <polygon points="60,60 90,65 60,70" fill="#fb923c" stroke="#ea580c" strokeWidth="2" />
    <path d="M48 78 Q 60 85 72 78" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
    <g className="snowman-hat">
      <rect x="40" y="32" width="40" height="10" fill="#0f172a" />
      <rect x="46" y="20" width="28" height="12" fill="#0f172a" />
    </g>
    <g stroke="#0f172a" strokeWidth="3">
      <circle cx="60" cy="105" r="3" fill="#475569" />
      <circle cx="60" cy="120" r="3" fill="#475569" />
      <circle cx="60" cy="135" r="3" fill="#475569" />
    </g>
  </svg>
);

const GiftPile = () => (
  <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
    <g>
      <rect x="8" y="44" width="42" height="30" rx="3" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="2" />
      <rect x="26" y="44" width="6" height="30" fill="#e2e8f0" />
      <rect x="8" y="60" width="42" height="6" fill="#e2e8f0" />

      <rect x="52" y="34" width="36" height="40" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
      <rect x="68" y="34" width="4" height="40" fill="#7c2d12" />
      <rect x="52" y="52" width="36" height="6" fill="#7c2d12" />

      <rect x="14" y="18" width="28" height="32" rx="3" fill="#f472b6" stroke="#be185d" strokeWidth="2" />
      <rect x="26" y="18" width="4" height="32" fill="#f8fafc" />
      <rect x="14" y="32" width="28" height="6" fill="#f8fafc" />

      <rect x="76" y="10" width="28" height="26" rx="3" fill="#c084fc" stroke="#6b21a8" strokeWidth="2" />
      <rect x="88" y="10" width="3" height="26" fill="#ede9fe" />
      <rect x="76" y="22" width="28" height="5" fill="#ede9fe" />
    </g>
  </svg>
);

const ChristmasTree = () => (
  <svg viewBox="0 0 180 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tree-green" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#16a34a" />
        <stop offset="100%" stopColor="#065f46" />
      </linearGradient>
      <linearGradient id="tree-trunk" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>

    {/* Star */}
    <g fill="#fbbf24" stroke="#d97706" strokeWidth="2" transform="translate(90 15) rotate(12)">
      <polygon points="0,-18 5,-4 20,-4 8,4 12,18 0,9 -12,18 -8,4 -20,-4 -5,-4" />
    </g>

    {/* Tree layers */}
    <g fill="url(#tree-green)" stroke="#064e3b" strokeWidth="2">
      <polygon points="90,30 150,110 30,110" />
      <polygon points="90,70 165,150 15,150" />
      <polygon points="90,115 175,195 5,195" />
    </g>

    {/* Baubles */}
    <g fill="#e11d48" stroke="#9f1239" strokeWidth="1.5">
      <circle cx="80" cy="80" r="5" />
      <circle cx="110" cy="95" r="5" />
      <circle cx="70" cy="135" r="5" />
      <circle cx="120" cy="150" r="5" />
    </g>
    <g fill="#38bdf8" stroke="#0ea5e9" strokeWidth="1.5">
      <circle cx="95" cy="60" r="4" />
      <circle cx="60" cy="115" r="4" />
      <circle cx="140" cy="140" r="4" />
      <circle cx="100" cy="175" r="4" />
    </g>

    {/* Garland */}
    <path
      d="M35 120 C 70 140, 110 120, 150 140"
      stroke="#f59e0b"
      strokeWidth="4"
      fill="none"
      strokeDasharray="10 6"
      strokeLinecap="round"
    />
    <path
      d="M25 160 C 65 185, 115 170, 160 190"
      stroke="#c084fc"
      strokeWidth="4"
      fill="none"
      strokeDasharray="10 6"
      strokeLinecap="round"
    />

    {/* Presents */}
    <g>
      <rect x="40" y="185" width="40" height="25" fill="#f472b6" stroke="#be185d" strokeWidth="2" rx="2" />
      <rect x="60" y="185" width="6" height="25" fill="#f8fafc" />
      <rect x="40" y="196" width="40" height="6" fill="#f8fafc" />

      <rect x="90" y="190" width="32" height="20" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="2" rx="2" />
      <rect x="103" y="190" width="5" height="20" fill="#f8fafc" />
      <rect x="90" y="200" width="32" height="5" fill="#f8fafc" />

      <rect x="130" y="188" width="28" height="22" fill="#fde047" stroke="#ca8a04" strokeWidth="2" rx="2" />
      <rect x="142" y="188" width="4" height="22" fill="#7c2d12" />
      <rect x="130" y="198" width="28" height="4" fill="#7c2d12" />
    </g>

    {/* Trunk */}
    <rect x="80" y="195" width="20" height="25" fill="url(#tree-trunk)" stroke="#451a03" strokeWidth="2" />
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
          background: radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08), rgba(15, 23, 42, 0.2)), #0b1224;
          overflow: hidden;
          z-index: 9999;
        }
        .grotto-vignette {
          position: absolute;
          inset: 0;
        }
        .grotto-vignette::before,
        .grotto-vignette::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .grotto-vignette::before {
          background: radial-gradient(circle at 10% 30%, rgba(0,0,0,0.45), transparent 45%),
                      radial-gradient(circle at 90% 35%, rgba(0,0,0,0.35), transparent 50%);
          mix-blend-mode: multiply;
          opacity: 0.7;
        }
        .grotto-vignette::after {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0) 35%),
                      linear-gradient(0deg, rgba(15, 23, 42, 0.65) 0%, rgba(15, 23, 42, 0) 35%);
        }
        .pine-arch {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 110px;
          background:
            radial-gradient(ellipse at 10% 40%, rgba(74, 222, 128, 0.4), transparent 55%),
            radial-gradient(ellipse at 50% 45%, rgba(52, 211, 153, 0.4), transparent 60%),
            radial-gradient(ellipse at 90% 40%, rgba(74, 222, 128, 0.4), transparent 55%),
            repeating-linear-gradient(90deg, #14532d 0 14px, #15803d 14px 28px, #166534 28px 42px);
          border-bottom-left-radius: 50% 40%;
          border-bottom-right-radius: 50% 40%;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
          filter: drop-shadow(0 8px 20px rgba(14, 116, 144, 0.35));
          opacity: 0.9;
        }
        .pine-arch::after {
          content: "";
          position: absolute;
          left: 6%;
          right: 6%;
          bottom: 8px;
          height: 10px;
          border-radius: 9999px;
          background: repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0 16px, rgba(255,255,255,0) 16px 32px);
          opacity: 0.8;
        }
        .grotto-sides {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 120px;
          left: 0;
          background: linear-gradient(90deg, rgba(12, 20, 38, 0.9), rgba(12, 20, 38, 0));
          filter: drop-shadow(0 0 18px rgba(0, 0, 0, 0.5));
        }
        .grotto-sides.right {
          right: 0;
          transform: scaleX(-1);
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
            background: rgba(15, 23, 42, 0.55);
            border: 1px solid rgba(148, 163, 184, 0.35);
            border-radius: 20px;
            box-shadow: 0 18px 40px rgba(0,0,0,0.45);
            padding: 1.5rem 1.25rem;
            backdrop-filter: blur(4px);
        }
        .snowman-container {
            position: absolute;
            bottom: 6%;
            right: 8%;
            width: 120px;
            filter: drop-shadow(0 10px 20px rgba(15, 23, 42, 0.45));
            transform-origin: 50% 85%;
            animation: dance-step 3.6s ease-in-out infinite;
        }
        .snowman-snowbank {
            position: absolute;
            bottom: 3%;
            right: 6%;
            width: 210px;
            height: 70px;
            background: radial-gradient(circle at 40% 40%, rgba(255,255,255,0.92), rgba(148, 163, 184, 0.4));
            border-radius: 50% 40% 30% 40%;
            filter: blur(0.6px);
            opacity: 0.9;
        }
        @keyframes dance-step {
            0% { transform: translateY(0) rotate(-2deg) translateX(0); }
            20% { transform: translateY(-6px) rotate(4deg) translateX(-6px); }
            40% { transform: translateY(2px) rotate(-4deg) translateX(6px); }
            60% { transform: translateY(-5px) rotate(3deg) translateX(-4px); }
            80% { transform: translateY(1px) rotate(-3deg) translateX(5px); }
            100% { transform: translateY(0) rotate(-2deg) translateX(0); }
        }
        .snowman-arms {
            animation: arm-wave 2.4s ease-in-out infinite;
            transform-origin: 60px 90px;
        }
        @keyframes arm-wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(6deg); }
            50% { transform: rotate(-5deg); }
            75% { transform: rotate(7deg); }
        }
        .snowman-hat {
            animation: hat-tilt 3s ease-in-out infinite;
            transform-origin: 60px 30px;
        }
        @keyframes hat-tilt {
            0%, 100% { transform: rotate(-4deg); }
            40% { transform: rotate(3deg) translateY(-2px); }
            70% { transform: rotate(-2deg) translateY(1px); }
        }
        .tree-container {
            position: absolute;
            bottom: 6%;
            left: 6%;
            width: 170px;
            filter: drop-shadow(0 12px 22px rgba(15, 23, 42, 0.45));
            animation: sway 6s ease-in-out infinite;
        }
        .tree-snowbank {
            position: absolute;
            bottom: 3%;
            left: 4%;
            width: 240px;
            height: 80px;
            background: radial-gradient(circle at 60% 40%, rgba(255,255,255,0.92), rgba(148, 163, 184, 0.45));
            border-radius: 45% 55% 35% 45%;
            filter: blur(0.6px);
            opacity: 0.9;
        }
        @keyframes sway {
            0%, 100% { transform: rotate(-1deg); }
            50% { transform: rotate(2deg); }
        }
        .string-lights {
            position: absolute;
            top: 40px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-evenly;
            gap: 12px;
            pointer-events: none;
        }
        .string-lights::before {
            content: "";
            position: absolute;
            top: -6px;
            left: 4%;
            right: 4%;
            height: 4px;
            border-radius: 9999px;
            background: linear-gradient(90deg, #fbbf24, #22d3ee, #f472b6, #a3e635);
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
        }
        .light-bulb {
            width: 14px;
            height: 22px;
            border-radius: 9999px 9999px 6px 6px;
            box-shadow: 0 0 10px currentColor;
            opacity: 0.9;
            transform-origin: top center;
            animation: light-swing 3.5s ease-in-out infinite;
        }
        .light-bulb:nth-child(odd) { animation-delay: 1s; }
        @keyframes light-swing {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
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
        .ground-lanterns {
            position: absolute;
            bottom: 5%;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 18px;
            align-items: flex-end;
        }
        .lantern {
            position: relative;
            width: 16px;
            height: 34px;
            border-radius: 4px;
            background: linear-gradient(180deg, #facc15, #f97316);
            box-shadow: 0 0 14px rgba(250, 204, 21, 0.75);
            animation: lantern-glow 2.8s ease-in-out infinite;
        }
        .lantern::before {
            content: "";
            position: absolute;
            top: -8px;
            left: 50%;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            transform: translateX(-50%);
            background: #e2e8f0;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        .lantern::after {
            content: "";
            position: absolute;
            bottom: -8px;
            left: 50%;
            width: 18px;
            height: 6px;
            border-radius: 9999px;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.4);
            filter: blur(6px);
        }
        @keyframes lantern-glow {
            0%, 100% { opacity: 0.9; transform: translateY(0); box-shadow: 0 0 14px rgba(250, 204, 21, 0.75); }
            50% { opacity: 0.7; transform: translateY(-3px); box-shadow: 0 0 22px rgba(249, 115, 22, 0.95); }
        }
        .gift-pile {
            position: absolute;
            bottom: 7%;
            left: 45%;
            width: 130px;
            filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.4));
            animation: gentle-rise 4s ease-in-out infinite;
        }
        @keyframes gentle-rise {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-4px) scale(1.01); }
        }
        .candy-canes {
            position: absolute;
            bottom: 5%;
            left: 52%;
            width: 120px;
            display: flex;
            justify-content: space-between;
        }
        .candy-cane {
            width: 14px;
            height: 50px;
            border-radius: 7px 7px 0 0;
            background: repeating-linear-gradient(135deg, #ef4444 0 6px, #f8fafc 6px 12px);
            position: relative;
            overflow: hidden;
            transform-origin: bottom center;
            animation: cane-sway 5s ease-in-out infinite;
        }
        .candy-cane::before {
            content: "";
            position: absolute;
            top: -16px;
            left: -6px;
            width: 28px;
            height: 22px;
            border-radius: 16px;
            background: repeating-linear-gradient(135deg, #ef4444 0 6px, #f8fafc 6px 12px);
        }
        .candy-cane:nth-child(2) { animation-delay: 1.2s; }
        @keyframes cane-sway {
            0%, 100% { transform: rotate(-2deg); }
            50% { transform: rotate(4deg); }
        }
      `}</style>

      <div className="grotto-vignette" aria-hidden></div>
      <div className="grotto-sides left" aria-hidden></div>
      <div className="grotto-sides right" aria-hidden></div>
      <div className="pine-arch" aria-hidden></div>

      {snowflakes}

      <div className="sleigh-container">
        <SantaSleigh />
      </div>

      <div className="string-lights" aria-hidden>
        {["#fbbf24", "#22d3ee", "#f472b6", "#22c55e", "#38bdf8", "#e11d48"].map((color, idx) => (
          <div key={idx} className="light-bulb" style={{ backgroundColor: color, color }} />
        ))}
      </div>

      <div className="loading-content">
        <h1 className="text-4xl font-bold">Welcome Back!</h1>
        <p className="mt-3 text-lg text-slate-300">Getting your CRM ready for a productive day...</p>
        <div className="progress-bar">
          <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="mt-3 text-xl font-mono tracking-wider">{Math.floor(progress)}%</p>
      </div>

      <div className="snowman-snowbank" aria-hidden></div>
      <div className="tree-snowbank" aria-hidden></div>
      <div className="snowman-container" aria-hidden>
        <Snowman />
      </div>
      <div className="tree-container" aria-hidden>
        <ChristmasTree />
      </div>
      <div className="gift-pile" aria-hidden>
        <GiftPile />
      </div>
      <div className="candy-canes" aria-hidden>
        <div className="candy-cane" />
        <div className="candy-cane" />
      </div>
      <div className="ground-lanterns" aria-hidden>
        <div className="lantern" />
        <div className="lantern" />
        <div className="lantern" />
      </div>
    </div>
  );
};

export default PostLoginLoading;