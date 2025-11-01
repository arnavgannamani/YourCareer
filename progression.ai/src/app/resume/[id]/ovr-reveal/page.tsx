"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import confetti from "canvas-confetti";

function OVRRevealContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [ovr, setOvr] = useState<number | null>(null);
  const [careerField, setCareerField] = useState<string>("");
  const [percentile, setPercentile] = useState<number>(0);
  const [showOVR, setShowOVR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const confettiTriggered = useRef(false);

  // Fetch profile and OVR data
  useEffect(() => {
    (async () => {
      try {
        // Get profileId from query param
        const profileIdParam = searchParams.get("profileId");
        
        if (!profileIdParam) {
          // If no profileId, fetch the most recent confirmed profile
          const profileRes = await fetch("/api/profile/current");
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.id) {
              setProfileId(profileData.id);
              await fetchOVR(profileData.id);
            } else {
              throw new Error("No profile found");
            }
          } else {
            throw new Error("Failed to fetch profile");
          }
        } else {
          setProfileId(profileIdParam);
          await fetchOVR(profileIdParam);
        }
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
        // Don't auto-redirect on error, let user click button
      }
    })();
  }, [searchParams, router]);

  const fetchOVR = async (pid: string) => {
    try {
      const ovrRes = await fetch(`/api/profile/${pid}/ovr`);
      if (ovrRes.ok) {
        const ovrData = await ovrRes.json();
        setOvr(ovrData.ovr);
        setCareerField(ovrData.careerField);
        setPercentile(ovrData.percentile);
        setLoading(false);
      } else {
        throw new Error("Failed to fetch OVR");
      }
    } catch (error) {
      console.error("Error fetching OVR:", error);
      setLoading(false);
      // Don't auto-redirect on error, let user click button
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#007A33", "#00A852", "#00D670"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#007A33", "#00A852", "#00D670"],
      });
    }, 250);
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  const handleRevealClick = () => {
    if (isSpinning || showOVR) return;
    
    // Mark that user has started and begin spinning
    setHasStarted(true);
    setIsSpinning(true);
    
    // After spinning animation (3 seconds), reveal OVR
    setTimeout(() => {
      setShowOVR(true);
      if (!confettiTriggered.current) {
        confettiTriggered.current = true;
        triggerConfetti();
      }
    }, 3000); // 3 second spinning animation
  };


  return (
    <div className="min-h-screen bg-white text-black flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/circular logo.png"
              alt="Progression"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-semibold text-[#007A33]">Progression</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {loading ? (
          <div className="text-center">
            <p className="text-gray-600 text-lg">Calculating your OVR...</p>
          </div>
        ) : (
          <div className="text-center">
            {/* Pulsating Logo Animation */}
            <div className="relative mb-8">
              <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                {/* Logo Container with 3D Spinning Animation and Rings that follow */}
                <div 
                  className={`relative flex items-center justify-center perspective-1000 ${
                    isSpinning ? "animate-container-rise" : ""
                  }`}
                  style={{ width: "320px", height: "320px" }}
                >
                  {/* Pulsating Ring - Follow the logo */}
                  {!showOVR && (
                    <div
                      className="absolute rounded-full border-[6px] border-[#007A33] animate-pulse-ring"
                      style={{
                        width: "300px",
                        height: "300px",
                        animationDuration: "2s",
                      }}
                    />
                  )}
                  {/* Main Logo - Spins in 3D with upward movement */}
                  <div
                    className={`relative transition-all duration-500 preserve-3d ${
                      showOVR ? "scale-100 opacity-0" : 
                      isSpinning ? "scale-110 animate-spin-and-rise" : "scale-110"
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <Image
                      src="/circular logo.png"
                      alt="Progression Logo"
                      width={240}
                      height={240}
                      className={`rounded-full drop-shadow-2xl ${isSpinning ? 'animate-logo-pulse' : ''}`}
                      priority
                      style={{
                        filter: isSpinning ? undefined : 'none',
                      }}
                    />
                    
                    {/* Pulsating Glow Layers */}
                    {!showOVR && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-[#007A33]/40 blur-2xl animate-pulse-glow" style={{ animationDelay: "0s" }} />
                        <div className="absolute inset-2 rounded-full bg-[#00A852]/30 blur-xl animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                        <div className="absolute inset-4 rounded-full bg-[#00D670]/20 blur-lg animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
                      </>
                    )}
                  </div>
                  
                  {/* Actual OVR Display - Shown after explosion completes */}
                  {showOVR && (
                    <div className="absolute inset-0 flex items-center justify-center animate-fade-in pointer-events-none">
                      <div className="relative w-72 h-72 flex flex-col items-center justify-center">
                        {/* Background Circle */}
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-full shadow-2xl border-4 border-[#007A33]" />
                        {/* OVR Number */}
                        <div className="text-8xl font-black text-[#007A33] leading-none relative z-20">
                          {ovr !== null ? ovr : 74}
                        </div>
                        {/* OVR Label */}
                        <div className="text-xl font-bold text-[#007A33] tracking-wider relative z-20 mt-2">
                          OVR
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4 max-w-md mx-auto">
              {!showOVR ? (
                <>
                  {!isSpinning ? (
                    <>
                      <h1 className="text-4xl font-extrabold text-black min-h-[60px] flex items-center justify-center">
                        Ready to see your Overall?
                      </h1>
                      
                      {/* Initial Reveal Button */}
                      <div className="mt-8 min-h-[56px] flex items-center justify-center">
                        <button
                          onClick={handleRevealClick}
                          disabled={isSpinning}
                          className="inline-flex items-center justify-center rounded-full bg-[#007A33] text-white h-14 px-10 text-lg font-bold transition-all duration-300 hover:bg-[#006628] hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                        >
                          Reveal
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="text-4xl font-extrabold text-black min-h-[60px] flex items-center justify-center">
                        Calculating...
                      </h1>
                      <p className="text-gray-600 text-lg min-h-[28px] flex items-center justify-center">
                        Analyzing your profile
                      </p>
                    </>
                  )}
                </>
              ) : (
                <div className="-mt-12">
                  <h1 className="text-4xl font-extrabold text-black animate-fade-in">
                    Your Overall Rating
                  </h1>
                  <p className="text-xl font-semibold text-[#007A33] animate-fade-in mt-4">
                    {careerField}
                  </p>
                  <p className="text-gray-600 text-lg animate-fade-in mt-4">
                    Top {percentile}% in your field
                  </p>
                  <button
                    onClick={handleContinue}
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-[#007A33] text-white h-12 px-8 text-base font-medium hover:bg-[#006628] transition-colors animate-fade-in"
                  >
                    Continue to Dashboard →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 1;
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-in-out infinite;
          left: 50%;
          top: 50%;
        }
        
        @keyframes spin-and-rise {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          100% {
            transform: perspective(1000px) rotateY(1080deg);
          }
        }
        .animate-spin-and-rise {
          animation: spin-and-rise 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: transform;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        @keyframes logo-pulse {
          0% {
            filter: brightness(1) sepia(0) saturate(1) hue-rotate(0deg);
          }
          37.5% {
            filter: brightness(1) sepia(0) saturate(1) hue-rotate(0deg);
          }
          50% {
            filter: brightness(1.2) sepia(0.4) saturate(1.5) hue-rotate(90deg);
          }
          62.5% {
            filter: brightness(1) sepia(0) saturate(1) hue-rotate(0deg);
          }
          100% {
            filter: brightness(1) sepia(0) saturate(1) hue-rotate(0deg);
          }
        }
        .animate-logo-pulse {
          animation: logo-pulse 2s ease-in-out infinite;
        }
        
        @keyframes container-rise {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(-100px);
          }
        }
        .animate-container-rise {
          animation: container-rise 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function OVRRevealPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OVRRevealContent />
    </Suspense>
  );
}
