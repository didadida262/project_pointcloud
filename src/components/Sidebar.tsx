import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

interface SidebarProps {
  onResetView: () => void;
  onLoadFile?: (file: File) => void;
}

export default function Sidebar({ onResetView, onLoadFile }: SidebarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (file && onLoadFile) {
      setSelectedFile(file.name);
      setIsLoading(true);
      onLoadFile(file);
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.ply')) {
      handleFileChange(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
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
              <label className="block text-sm font-medium text-gray-300 mb-3">加载点云文件</label>
              
              {/* 隐藏的原生文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".ply"
                onChange={handleFileInputChange}
                disabled={isLoading}
                className="hidden"
              />

              {/* 自定义文件上传区域 */}
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative w-full p-4 rounded-xl border-2 border-dashed
                  transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-purple-500/30 bg-slate-800/50 hover:border-purple-500/50 hover:bg-slate-800'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-purple-400">加载中...</p>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-purple-400 truncate max-w-full" title={selectedFile}>
                        {selectedFile}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">点击或拖拽更换文件</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-300">点击选择或拖拽文件</p>
                      <p className="text-xs text-gray-500 mt-1">支持 .ply 格式</p>
                    </div>
                  </div>
                )}
              </motion.div>
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

