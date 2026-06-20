import React from 'react';

const Snowfall = () => {
  const snowflakeCount = 100;
  const snowflakes = Array.from({ length: snowflakeCount }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      animationDuration: `${Math.random() * 5 + 5}s`, // 5 to 10 seconds
      animationDelay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.7 + 0.3,
    };
    return <div key={i} className="snowflake" style={style}></div>;
  });

  return (
    <>
      <style>
        {`
          .snow-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 2;
          }
          .snowflake {
            position: absolute;
            top: -10px;
            background-color: white;
            border-radius: 50%;
            pointer-events: none;
            animation: fall linear infinite;
          }
          @keyframes fall {
            0% {
              transform: translateY(0) translateX(0);
            }
            100% {
              transform: translateY(100vh) translateX(${Math.random() > 0.5 ? '' : '-'}15vw);
            }
          }
        `}
      </style>
      <div className="snow-container">
        {snowflakes}
      </div>
    </>
  );
};

export default Snowfall;