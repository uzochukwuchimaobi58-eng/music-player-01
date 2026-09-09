import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WelcomeSplashScreenProps {
  onDismiss: () => void;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Keep the welcome splash active on launch, then transition smoothly into the player
    const timer = setTimeout(() => {
      handleClose();
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 450);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="welcome-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleClose}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070709] text-white select-none cursor-pointer overflow-hidden"
        >
          {/* Subtle Ambient Radial Backlight */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-purple-600/30 via-indigo-600/20 to-sky-500/30 blur-3xl opacity-75 animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
            {/* Logo Icon with Ambient Glow & Smooth Entry */}
            <motion.div
              initial={{ scale: 0.68, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-8"
            >
              {/* Soft ambient aura */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-fuchsia-500/40 via-purple-500/30 to-cyan-400/40 blur-lg -z-10" />
              
              <img
                id="welcome-logo-image"
                src="/logo.png"
                alt="App Logo"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-2xl shadow-purple-950/70 object-contain ring-2 ring-white/20 select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Written Text: "Welcome" prominently shown together with the logo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2.5"
            >
              <h1
                id="welcome-heading"
                className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm font-sans"
              >
                Welcome
              </h1>
              <p
                id="welcome-subheading"
                className="text-sm sm:text-base font-medium text-zinc-400 tracking-wide"
              >
                Sonance Music Player
              </p>
            </motion.div>

            {/* Subtle rhythmic audio bar accent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-8 flex items-center justify-center gap-1.5"
            >
              {[0.5, 1.1, 0.4, 0.9, 0.55, 0.95, 0.35].map((scaleH, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    scaleY: [scaleH, 1.25, scaleH * 0.4, scaleH],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.1 + (idx % 3) * 0.2,
                    ease: "easeInOut",
                    delay: idx * 0.12,
                  }}
                  className="w-1 h-5 rounded-full bg-gradient-to-t from-fuchsia-500 to-sky-400 opacity-80"
                />
              ))}
            </motion.div>

            {/* Tap to enter hint */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-10 text-xs text-zinc-500 font-normal tracking-widest uppercase"
            >
              Tap to continue
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
