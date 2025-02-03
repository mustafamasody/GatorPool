import { motion } from "framer-motion";

export default function LeftHalfAnimation() {
  const dots = Array.from({ length: 36 }, (_, i) => i);
  const lines = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="h-screen w-1/2 fixed left-0 top-0 dark:bg-black overflow-hidden">
      {/* Moving Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b dark:from-green-900/40 via-transparent to-black"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      {/* Floating Dots */}
      {dots.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-green-400 rounded-full opacity-30"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          initial={{ y: 0, opacity: 0.3 }}
          animate={{ y: [-5, 5, -5], opacity: [0.2, 0.5, 0.2] }}
          transition={{
            duration: Math.random() * 4 + 2,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Vertical Lines */}
      {lines.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-40 bg-green-500/40"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${(i + 1) * 10}%`,
          }}
          initial={{ opacity: 0.1, y: -20 }}
          animate={{ opacity: [0.2, 0.5, 0.2], y: [0, 20, 0] }}
          transition={{
            duration: Math.random() * 6 + 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
