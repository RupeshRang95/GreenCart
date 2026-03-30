import React from "react";

const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-center min-h-screen p-4" style={{ background: "#0a1a0c" }}>
    <div className="relative">
      <div
        className="relative rounded-[48px]"
        style={{
          width: 393,
          height: 852,
          padding: 6,
          background: "linear-gradient(145deg, #2a3a2c, #1a2a1c)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,222,128,0.06)",
        }}
      >
        <div className="relative w-full h-full rounded-[42px] overflow-hidden bg-background">
          {/* Dynamic Island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-50 w-[120px] h-[32px] rounded-full" style={{ background: "#050d06" }} />
          <div className="w-full h-full overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PhoneFrame;
