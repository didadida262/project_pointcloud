import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 z-50"
    >
      <div className="h-full flex items-center justify-center px-6">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
        >
          点云仿真平台
        </motion.h1>
      </div>
    </motion.header>
  );
}

