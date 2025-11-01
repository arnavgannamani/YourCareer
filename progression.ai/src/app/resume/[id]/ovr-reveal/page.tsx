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
  const [clickCount, setClickCount] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const confettiTriggered = useRef(false);
  const decelerationTimer = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef<number>(0);

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
    if (isExploding || showOVR) return;
    
    // Clear any existing deceleration timer
    if (decelerationTimer.current) {
      clearInterval(decelerationTimer.current);
      decelerationTimer.current = null;
    }
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    lastClickTime.current = Date.now();
    
    // At 5 clicks (reaching 40 rot/s), trigger explosion
    if (newCount >= 5) {
      setIsExploding(true);
      
      // After explosion animation, reveal OVR and show confetti
      setTimeout(() => {
        setShowOVR(true);
        if (!confettiTriggered.current) {
          confettiTriggered.current = true;
          triggerConfetti();
        }
      }, 500); // Explosion animation duration
    }
  };

  // Deceleration effect - monitors inactivity and decreases clickCount
  useEffect(() => {
    if (clickCount <= 0 || isExploding || showOVR) return;
    
    // Start deceleration after 0.8 seconds of inactivity (faster)
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setClickCount((prev) => {
          const timeSinceLastClick = Date.now() - lastClickTime.current;
          
          // Only decelerate if no click in the last 0.8 seconds
          if (timeSinceLastClick > 800 && prev > 0) {
            const newCount = prev - 1;
            if (newCount <= 0) {
              clearInterval(interval);
              return 0;
            }
            return newCount;
          }
          return prev;
        });
      }, 200); // Decelerate every 0.2 seconds (faster)
      
      decelerationTimer.current = interval as unknown as NodeJS.Timeout;
    }, 800); // Start deceleration after 0.8 seconds (faster)
    
    return () => {
      clearTimeout(timeout);
      if (decelerationTimer.current) {
        clearInterval(decelerationTimer.current);
        decelerationTimer.current = null;
      }
    };
  }, [clickCount, lastClickTime.current, isExploding, showOVR]);

  // Cleanup deceleration timer on unmount
  useEffect(() => {
    return () => {
      if (decelerationTimer.current) {
        clearInterval(decelerationTimer.current);
      }
    };
  }, []);

  // Calculate rotation speed based on clicks
  // Starts at 10 rot/s, increases uniformly to 40 rot/s at 5 clicks
  const getRotationSpeed = () => {
    if (clickCount === 0) return 10;
    if (clickCount >= 5) return 40;
    // Linear increase from 10 to 40 over 5 clicks
    // Each click adds 6 rot/s: 10 + (clickCount * 6)
    return 10 + (clickCount * 6);
  };

  // Calculate animation duration based on rotation speed
  const getAnimationDuration = () => {
    const speed = getRotationSpeed();
    // Duration for one full rotation (360 degrees)
    // If speed is in rotations per second, duration = 1 / speed
    // Example: 15 rot/s = 1/15 = 0.067s per rotation
    //          50 rot/s = 1/50 = 0.02s per rotation
    const duration = 1 / speed;
    return `${duration}s`;
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200">
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {loading ? (
          <div className="text-center">
            <p className="text-gray-600 text-lg">Calculating your OVR...</p>
          </div>
        ) : (
          <div className="text-center">
            {/* Pulsating Logo Animation */}
            <div className="relative mb-8">
              <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                {/* Pulsating Rings - Different parts of logo */}
                {!showOVR && (
                  <>
                    {/* Outer Pulse Ring 1 */}
                    <div
                      className="absolute rounded-full border-4 border-[#007A33] animate-pulse-ring"
                      style={{
                        width: "320px",
                        height: "320px",
                        animationDelay: "0s",
                        animationDuration: "2s",
                      }}
                    />
                    
                    {/* Outer Pulse Ring 2 */}
                    <div
                      className="absolute rounded-full border-4 border-[#00A852] animate-pulse-ring"
                      style={{
                        width: "300px",
                        height: "300px",
                        animationDelay: "0.4s",
                        animationDuration: "2s",
                      }}
                    />
                    
                    {/* Middle Pulse Ring */}
                    <div
                      className="absolute rounded-full border-3 border-[#00D670] animate-pulse-ring"
                      style={{
                        width: "280px",
                        height: "280px",
                        animationDelay: "0.8s",
                        animationDuration: "2s",
                      }}
                    />
                    
                    {/* Inner Pulse Ring */}
                    <div
                      className="absolute rounded-full border-2 border-[#007A33] animate-pulse-ring"
                      style={{
                        width: "260px",
                        height: "260px",
                        animationDelay: "1.2s",
                        animationDuration: "2s",
                      }}
                    />
                  </>
                )}
                
                {/* Logo Container with 3D Spinning Animation */}
                <div className="relative z-10 perspective-1000">
                  {/* Main Logo - Spins in 3D, speed increases with clicks */}
                  <div
                    className={`relative transition-all duration-500 preserve-3d ${
                      showOVR ? "scale-100 opacity-30 rotate-y-0" : 
                      isExploding ? "scale-0 opacity-0" : 
                      clickCount > 0 ? "scale-110 animate-spin-fast" : "scale-110"
                    }`}
                    style={{
                      animationDuration: clickCount > 0 ? getAnimationDuration() : undefined,
                      animationTimingFunction: 'linear',
                      animationIterationCount: 'infinite',
                      willChange: clickCount > 0 ? 'transform' : 'auto',
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
                      className="rounded-full drop-shadow-2xl"
                      priority
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
                  
                  {/* OVR Display Overlay - Shown after reveal */}
                  {showOVR && ovr !== null && (
                    <div className="absolute inset-0 flex items-center justify-center animate-fade-in pointer-events-none">
                      <div className="text-center relative">
                        {/* OVR Number */}
                        <div className="text-9xl font-black text-[#007A33] drop-shadow-2xl mb-2 relative z-20">
                          {ovr}
                        </div>
                        {/* OVR Label */}
                        <div className="text-xl font-bold text-[#007A33] tracking-wider relative z-20">
                          OVR
                        </div>
                        {/* Background Circle */}
                        <div className="absolute inset-0 -inset-8 bg-white/95 backdrop-blur-sm rounded-full -z-10 shadow-2xl border-4 border-[#007A33]" />
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
                  <h1 className="text-4xl font-extrabold text-black min-h-[60px] flex items-center justify-center">
                    Keep Going!
                  </h1>
                  <p className="text-gray-600 text-lg min-h-[28px] flex items-center justify-center">
                    The logo is spinning faster with each click...
                  </p>
                  
                  {/* Reveal Button - Fixed position to prevent movement */}
                  <div className="mt-8 min-h-[56px] flex items-center justify-center">
                    <button
                      onClick={handleRevealClick}
                      disabled={isExploding || clickCount >= 5}
                      className={`inline-flex items-center justify-center rounded-full text-white h-14 px-10 text-lg font-bold transition-all duration-300 ${
                        clickCount >= 5 || isExploding
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#007A33] hover:bg-[#006628] hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {clickCount === 0 ? "Reveal Overall" :
                       clickCount < 5 ? "Reveal Overall" :
                       "Exploding..."}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-extrabold text-black animate-fade-in">
                    Your Overall Rating
                  </h1>
                  <p className="text-xl font-semibold text-[#007A33] animate-fade-in">
                    {careerField}
                  </p>
                  <p className="text-gray-600 text-lg animate-fade-in">
                    Top {percentile}% in your field
                  </p>
                  <button
                    onClick={handleContinue}
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-[#007A33] text-white h-12 px-8 text-base font-medium hover:bg-[#006628] transition-colors animate-fade-in"
                  >
                    Continue to Dashboard →
                  </button>
                </>
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
            transform: scale(0.9);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: scale(0.9);
            opacity: 1;
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-in-out infinite;
        }
        
        @keyframes spin-fast {
          from {
            transform: perspective(1000px) rotateY(0deg);
          }
          to {
            transform: perspective(1000px) rotateY(360deg);
          }
        }
        .animate-spin-fast {
          animation: spin-fast linear infinite;
          will-change: transform;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        
        @keyframes spin-logo-3d {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          0.1% {
            transform: perspective(1000px) rotateY(54deg);
          }
          0.2% {
            transform: perspective(1000px) rotateY(108deg);
          }
          0.3% {
            transform: perspective(1000px) rotateY(162deg);
          }
          0.4% {
            transform: perspective(1000px) rotateY(216deg);
          }
          0.5% {
            transform: perspective(1000px) rotateY(270deg);
          }
          0.6% {
            transform: perspective(1000px) rotateY(324deg);
          }
          0.67% {
            transform: perspective(1000px) rotateY(360deg);
          }
          0.8% {
            transform: perspective(1000px) rotateY(468deg);
          }
          1% {
            transform: perspective(1000px) rotateY(648deg);
          }
          1.2% {
            transform: perspective(1000px) rotateY(864deg);
          }
          1.4% {
            transform: perspective(1000px) rotateY(1116deg);
          }
          1.6% {
            transform: perspective(1000px) rotateY(1404deg);
          }
          1.8% {
            transform: perspective(1000px) rotateY(1728deg);
          }
          2% {
            transform: perspective(1000px) rotateY(2088deg);
          }
          2.5% {
            transform: perspective(1000px) rotateY(2700deg);
          }
          3% {
            transform: perspective(1000px) rotateY(3384deg);
          }
          3.5% {
            transform: perspective(1000px) rotateY(4140deg);
          }
          4% {
            transform: perspective(1000px) rotateY(4968deg);
          }
          5% {
            transform: perspective(1000px) rotateY(6840deg);
          }
          6% {
            transform: perspective(1000px) rotateY(9000deg);
          }
          7% {
            transform: perspective(1000px) rotateY(11520deg);
          }
          8% {
            transform: perspective(1000px) rotateY(14400deg);
          }
          8.5% {
            transform: perspective(1000px) rotateY(16200deg);
          }
          85.1% {
            transform: perspective(1000px) rotateY(16380deg);
          }
          85.2% {
            transform: perspective(1000px) rotateY(16560deg);
          }
          85.3% {
            transform: perspective(1000px) rotateY(16740deg);
          }
          85.4% {
            transform: perspective(1000px) rotateY(16920deg);
          }
          85.5% {
            transform: perspective(1000px) rotateY(17100deg);
          }
          85.6% {
            transform: perspective(1000px) rotateY(17280deg);
          }
          85.7% {
            transform: perspective(1000px) rotateY(17460deg);
          }
          85.8% {
            transform: perspective(1000px) rotateY(17640deg);
          }
          85.9% {
            transform: perspective(1000px) rotateY(17820deg);
          }
          86% {
            transform: perspective(1000px) rotateY(18000deg);
          }
          86.5% {
            transform: perspective(1000px) rotateY(19260deg);
          }
          87% {
            transform: perspective(1000px) rotateY(20520deg);
          }
          87.5% {
            transform: perspective(1000px) rotateY(21780deg);
          }
          88% {
            transform: perspective(1000px) rotateY(23040deg);
          }
          88.5% {
            transform: perspective(1000px) rotateY(24300deg);
          }
          89% {
            transform: perspective(1000px) rotateY(25560deg);
          }
          89.5% {
            transform: perspective(1000px) rotateY(26820deg);
          }
          90% {
            transform: perspective(1000px) rotateY(28080deg);
          }
          90.5% {
            transform: perspective(1000px) rotateY(29340deg);
          }
          91% {
            transform: perspective(1000px) rotateY(30600deg);
          }
          91.5% {
            transform: perspective(1000px) rotateY(31860deg);
          }
          92% {
            transform: perspective(1000px) rotateY(33120deg);
          }
          92.5% {
            transform: perspective(1000px) rotateY(34380deg);
          }
          93% {
            transform: perspective(1000px) rotateY(35640deg);
          }
          93.5% {
            transform: perspective(1000px) rotateY(36900deg);
          }
          94% {
            transform: perspective(1000px) rotateY(38160deg);
          }
          94.5% {
            transform: perspective(1000px) rotateY(39420deg);
          }
          95% {
            transform: perspective(1000px) rotateY(40680deg);
          }
          95.5% {
            transform: perspective(1000px) rotateY(42360deg);
          }
          96% {
            transform: perspective(1000px) rotateY(42480deg);
          }
          96.5% {
            transform: perspective(1000px) rotateY(42600deg);
          }
          97% {
            transform: perspective(1000px) rotateY(42720deg);
          }
          97.5% {
            transform: perspective(1000px) rotateY(42840deg);
          }
          98% {
            transform: perspective(1000px) rotateY(42960deg);
          }
          98.5% {
            transform: perspective(1000px) rotateY(43080deg);
          }
          99% {
            transform: perspective(1000px) rotateY(43140deg);
          }
          99.5% {
            transform: perspective(1000px) rotateY(43170deg);
          }
          100% {
            transform: perspective(1000px) rotateY(43200deg);
          }
        }
        .animate-spin-logo-3d {
          animation: spin-logo-3d 10s linear infinite;
          animation-fill-mode: forwards;
          transform-style: preserve-3d;
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
