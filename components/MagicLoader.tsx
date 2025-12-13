import React from 'react';

interface SparkleProps {
  style: React.CSSProperties;
}

const Sparkle: React.FC<SparkleProps> = ({ style }) => (
  <div
    className="absolute w-2 h-2 bg-cyan-300 rounded-full"
    style={{
      ...style,
      animation: `magic-sparkle ${Math.random() * 1 + 0.5}s linear infinite`,
      animationDelay: `${Math.random() * 1}s`,
    }}
  />
);

interface MagicLoaderProps {
  text?: string;
}

const MagicLoader: React.FC<MagicLoaderProps> = ({ text }) => {
  const sparklePositions = [
    { top: '10%', left: '20%' }, { top: '20%', left: '80%' },
    { top: '80%', left: '10%' }, { top: '90%', left: '70%' },
    { top: '30%', left: '5%' },  { top: '60%', left: '95%' },
    { top: '5%', left: '50%' },  { top: '95%', left: '40%' },
  ];

  return (
    <div className="flex flex-col justify-center items-center py-20 space-y-6">
      <div className="relative w-24 h-24">
        <div 
          className="absolute inset-0 bg-cyan-500 rounded-full opacity-50"
          style={{ animation: 'magic-glow 2s ease-in-out infinite' }}
        />
        {sparklePositions.map((pos, i) => <Sparkle key={i} style={pos} />)}
      </div>
      {text && <p className="text-lg text-gray-300 font-semibold">{text}</p>}
    </div>
  );
};

export default MagicLoader;