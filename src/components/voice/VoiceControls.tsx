import { motion, AnimatePresence } from "motion/react";
import { Mic, X, ArrowLeftRight } from "lucide-react";

interface VoiceControlsProps {
  isListening: boolean;
  isProcessing: boolean;
  onToggleListening: () => void;
  onClose: () => void;
  onSwitchSpeaker: () => void;
  currentSpeaker: 'staff' | 'customer';
  accentColor?: string;
}

export function VoiceControls({
  isListening,
  isProcessing,
  onToggleListening,
  onClose,
  onSwitchSpeaker,
  currentSpeaker,
  accentColor = "#00A6A6"
}: VoiceControlsProps) {
  const isActive = isListening || isProcessing;

  return (
    <div className="absolute bottom-0 w-full flex flex-col items-center justify-end pb-12 pointer-events-none z-20">
      <div className="relative w-full max-w-[400px] flex items-center justify-between px-8 pointer-events-auto">
        
        {/* Switch Speaker Button */}
        <motion.button
          onClick={onSwitchSpeaker}
          whileTap={{ scale: 0.95 }}
          disabled={isActive}
          className="relative size-14 flex items-center justify-center rounded-full group disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-white/10 rounded-full border border-white/20" />
          <div className="relative z-10 flex flex-col items-center">
            <ArrowLeftRight className="w-5 h-5 text-white/70" />
            <span className="text-[10px] text-white/50 mt-0.5">
              {currentSpeaker === 'staff' ? 'Staff' : 'Customer'}
            </span>
          </div>
        </motion.button>

        {/* Mic Button Wrapper */}
        <div className="relative flex items-center justify-center">
          {/* Ripple Effects */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence>
              {isListening && (
                <>
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ width: "96px", height: "96px", opacity: 0.5 }}
                      animate={{
                        width: ["96px", "180px"],
                        height: ["96px", "180px"],
                        opacity: [0.5, 0],
                        borderWidth: ["2px", "0px"]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeOut"
                      }}
                      className="absolute rounded-full"
                      style={{ borderColor: accentColor, borderStyle: "solid" }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Static Rings */}
            <div
              className="absolute w-[110px] h-[110px] rounded-full border opacity-40"
              style={{ borderColor: accentColor }}
            />
            <div
              className="absolute w-[140px] h-[140px] rounded-full border opacity-20"
              style={{ borderColor: accentColor }}
            />
            <div
              className="absolute w-[170px] h-[170px] rounded-full border opacity-10"
              style={{ borderColor: accentColor }}
            />
          </div>

          {/* Main Mic Button */}
          <motion.button
            onClick={onToggleListening}
            disabled={isProcessing}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: isListening ? 1.1 : 1,
              backgroundColor: isListening ? "#ffffff" : accentColor
            }}
            className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-shadow"
            style={{
              boxShadow: `0 0 40px ${accentColor}50`
            }}
          >
            {isProcessing ? (
              <div className="w-8 h-8 border-4 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <Mic
                className="w-10 h-10"
                style={{ color: isListening ? "#000000" : "#ffffff" }}
              />
            )}
          </motion.button>
        </div>

        {/* Close Button */}
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.95 }}
          className="relative size-14 flex items-center justify-center rounded-full group"
        >
          <div className="absolute inset-0 bg-white/5 rounded-full border border-white/10" />
          <X className="relative z-10 w-5 h-5 text-white/50" />
        </motion.button>
      </div>

      {/* Hint Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 text-sm text-white/40"
      >
        {isProcessing
          ? "Processing..."
          : isListening
          ? "Listening... tap to stop"
          : "Tap to speak"}
      </motion.p>
    </div>
  );
}

export default VoiceControls;
