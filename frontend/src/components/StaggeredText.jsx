import { motion } from 'framer-motion';

export default function StaggeredText({ text, className = "", delay = 0, once = true }) {
  // Split text into words, keeping spaces
  const words = text.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i },
    }),
  };

  const childVariants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(10px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      className={`flex flex-wrap ${className}`}
    >
      {words.map((word, index) => (
        <motion.span variants={childVariants} key={index} className="mr-[0.25em]">
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
