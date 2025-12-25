import { motion } from 'framer-motion';
import { useState } from 'react';

interface SidebarProps {
  onResetView: () => void;
  onLoadFile?: (file: File) => void;
}

export default function Sidebar({ onResetView, onLoadFile }: SidebarProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLoadFile) {
      setIsLoading(true);
      onLoadFile(file);
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-slate-900/95 border-r border-purple-500/20 h-full overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-purple-400 mb-4">控制面板</h2>
          
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onResetView}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              重置视角
            </motion.button>

            <div>
              <label className="block text-sm text-gray-300 mb-2">加载点云文件</label>
              <input
                type="file"
                accept=".ply"
                onChange={handleFileChange}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-slate-800 text-gray-300 rounded-lg border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-400 mb-3">操作说明</h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li>• 左键拖拽：旋转视角</li>
            <li>• 滚轮：缩放</li>
            <li>• 右键拖拽：平移</li>
            <li>• 点击重置：恢复初始视角</li>
          </ul>
        </div>
      </div>
    </motion.aside>
  );
}

