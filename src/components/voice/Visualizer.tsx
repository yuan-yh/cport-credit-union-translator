import { motion } from "motion/react";

export type InteractionState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VisualizerProps {
  state: InteractionState;
  customerLanguageColor?: string;
}

export function Visualizer({ state, customerLanguageColor = "#00A6A6" }: VisualizerProps) {
  // Organic Blob Shapes using border-radius
  const blobShapes = {
    idle: [
      "60% 40% 30% 70% / 60% 30% 70% 40%",
      "30% 60% 70% 40% / 50% 60% 30% 60%",
      "60% 40% 30% 70% / 60% 30% 70% 40%"
    ],
    listening: [
      "50% 50% 50% 50% / 50% 50% 50% 50%",
      "45% 55% 45% 55% / 55% 45% 55% 45%",
      "50% 50% 50% 50% / 50% 50% 50% 50%"
    ],
    processing: [
      "40% 60% 60% 40% / 40% 60% 60% 40%",
      "60% 40% 40% 60% / 60% 40% 40% 60%",
      "40% 60% 60% 40% / 40% 60% 60% 40%"
    ],
    speaking: [
      "70% 30% 30% 70% / 60% 40% 60% 40%",
      "30% 70% 70% 30% / 40% 60% 40% 60%",
      "70% 30% 30% 70% / 60% 40% 60% 40%"
    ]
  };

  const containerVariants = {
    idle: {
      borderRadius: blobShapes.idle,
      scale: [1, 1.05, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        borderRadius: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
        rotate: { duration: 10, repeat: Infinity, ease: "easeInOut" as const }
      }
    },
    listening: {
      borderRadius: blobShapes.listening,
      scale: [1, 0.95, 1],
      transition: {
        borderRadius: { duration: 0.5, repeat: Infinity, ease: "linear" as const },
        scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" as const }
      }
    },
    processing: {
      borderRadius: blobShapes.processing,
      rotate: 360,
      scale: [0.9, 1.1, 0.9],
      transition: {
        borderRadius: { duration: 2, repeat: Infinity, ease: "linear" as const },
        rotate: { duration: 2, repeat: Infinity, ease: "linear" as const },
        scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }
      }
    },
    speaking: {
      borderRadius: blobShapes.speaking,
      scale: [1, 1.2, 0.9, 1.15, 1],
      transition: {
        borderRadius: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
        scale: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const }
      }
    }
  };

  // Color based on state - use cPort teal theme
  const getGlowColor = () => {
    switch (state) {
      case 'listening': return customerLanguageColor;
      case 'processing': return '#F59E0B'; // amber
      case 'speaking': return '#00A6A6'; // cport teal
      default: return '#00A6A6';
    }
  };

  const getGradient = () => {
    switch (state) {
      case 'listening':
        return `radial-gradient(circle at 30% 30%, ${customerLanguageColor}60, ${customerLanguageColor}20 50%, transparent 70%)`;
      case 'processing':
        return 'radial-gradient(circle at 50% 50%, #F59E0B60, #F59E0B20 50%, transparent 70%)';
      case 'speaking':
        return 'radial-gradient(circle at 30% 30%, #00D4AA60, #00A6A620 50%, transparent 70%)';
      default:
        return 'radial-gradient(circle at 30% 30%, #00A6A640, #0D213720 50%, transparent 70%)';
    }
  };

  return (
    <div className="relative w-[280px] h-[280px] mx-auto flex items-center justify-center">
      {/* Glow Effect Behind */}
      <motion.div
        animate={{
          scale: state === 'speaking' ? [1, 1.5, 1] : state === 'listening' ? [1, 1.2, 1] : 1,
          opacity: state === 'idle' ? 0.15 : 0.4,
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-[60px] -z-10"
        style={{ backgroundColor: getGlowColor() }}
      />

      {/* The Fluid Blob Container */}
      <motion.div
        variants={containerVariants}
        animate={state}
        className="w-[220px] h-[220px] overflow-hidden relative z-10"
        style={{
          background: getGradient(),
          boxShadow: `0 0 60px ${getGlowColor()}30, inset 0 0 60px ${getGlowColor()}20`,
        }}
      >
        {/* Inner animated gradient */}
        <motion.div
          animate={{
            rotate: state === 'processing' ? 360 : state === 'speaking' ? -360 : 0,
          }}
          transition={{ duration: state === 'processing' ? 3 : 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, ${getGlowColor()}40, transparent 30%, ${getGlowColor()}20 50%, transparent 70%, ${getGlowColor()}30)`,
          }}
        />

        {/* Glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 opacity-50 pointer-events-none" />

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: state === 'speaking' ? [1, 1.1, 1] : 1,
              opacity: state === 'processing' ? [0.5, 1, 0.5] : 1,
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {state === 'processing' ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : state === 'speaking' ? (
              <SpeakingWaves />
            ) : (
              <MicIcon isListening={state === 'listening'} />
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function MicIcon({ isListening }: { isListening: boolean }) {
  return (
    <motion.svg
      animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.3, repeat: isListening ? Infinity : 0 }}
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      className="text-white"
    >
      <path
        d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z"
        fill="currentColor"
        opacity={isListening ? 1 : 0.7}
      />
      <path
        d="M19 10v2a7 7 0 0 1-14 0v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M12 19v4M8 23h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.5}
      />
    </motion.svg>
  );
}

function SpeakingWaves() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          animate={{
            height: ["12px", "32px", "12px"],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
          className="w-2 bg-white rounded-full"
          style={{ height: "12px" }}
        />
      ))}
    </div>
  );
}

export default Visualizer;
