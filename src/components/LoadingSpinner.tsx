
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner = ({ size = "md", className = "" }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className={`${sizeMap[size]} ${className}`}
    >
      <svg
        className="w-full h-full text-storysnap-blue"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </motion.div>
  );
};

export default LoadingSpinner;
