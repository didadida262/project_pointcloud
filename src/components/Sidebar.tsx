import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { PerformanceMetrics } from './PerformanceMonitor';

interface SidebarProps {
  onResetView: () => void;
  onLoadFile?: (file: File) => void;
  performanceMetrics?: PerformanceMetrics | null;
}

export default function Sidebar({ onResetView, onLoadFile, performanceMetrics }: SidebarProps) {
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

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-64 bg-slate-900/95 border-r border-purple-500/20 h-full overflow-y-auto flex-shrink-0"
    >
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="url(#gradient1)" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>控制面板</span>
          </h3>
          
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onResetView}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              复位视角
            </motion.button>

            <div className="pt-4 border-t border-purple-500/30">
              <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="url(#gradient2)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>加载点云文件</span>
              </h3>
              
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

        {/* 性能监控 */}
        {performanceMetrics && (
          <div className="pt-6 border-t border-purple-500/30">
            <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="url(#gradient3)" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>性能监控</span>
            </h3>
            <div className="space-y-3">
              {/* 总耗时 */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">总耗时</span>
                  <span className={`text-sm font-bold ${
                    performanceMetrics.totalTime < 1000 ? 'text-green-400' :
                    performanceMetrics.totalTime < 2000 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {performanceMetrics.totalTime < 1000 
                      ? `${performanceMetrics.totalTime.toFixed(2)} ms`
                      : `${(performanceMetrics.totalTime / 1000).toFixed(2)} s`
                    }
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((performanceMetrics.totalTime / 3000) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              {/* 详细指标 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">文件加载</span>
                  <span className="text-purple-300 font-mono text-xs">
                    {performanceMetrics.fileLoadTime < 1000 
                      ? `${performanceMetrics.fileLoadTime.toFixed(2)} ms`
                      : `${(performanceMetrics.fileLoadTime / 1000).toFixed(2)} s`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">数据解析</span>
                  <span className="text-purple-300 font-mono text-xs">
                    {performanceMetrics.parseTime < 1000 
                      ? `${performanceMetrics.parseTime.toFixed(2)} ms`
                      : `${(performanceMetrics.parseTime / 1000).toFixed(2)} s`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">场景渲染</span>
                  <span className="text-purple-300 font-mono text-xs">
                    {performanceMetrics.renderTime < 1000 
                      ? `${performanceMetrics.renderTime.toFixed(2)} ms`
                      : `${(performanceMetrics.renderTime / 1000).toFixed(2)} s`
                    }
                  </span>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="border-t border-purple-500/20 my-2"></div>

              {/* 点云信息 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">点云数量</span>
                  <span className="text-purple-300 font-mono text-xs">
                    {performanceMetrics.pointCount.toLocaleString('zh-CN')}
                  </span>
                </div>
                {performanceMetrics.fileSize && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">文件大小</span>
                    <span className="text-purple-300 font-mono text-xs">
                      {formatFileSize(performanceMetrics.fileSize)}
                    </span>
                  </div>
                )}
                {performanceMetrics.fileName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">文件名</span>
                    <span className="text-purple-300 text-xs truncate max-w-[140px]" title={performanceMetrics.fileName}>
                      {performanceMetrics.fileName}
                    </span>
                  </div>
                )}
              </div>

              {/* 性能评级 */}
              <div className="pt-2 border-t border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">性能评级</span>
                  <span className={`text-xs font-semibold ${
                    performanceMetrics.totalTime < 1000 ? 'text-green-400' :
                    performanceMetrics.totalTime < 2000 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {performanceMetrics.totalTime < 1000 ? '优秀' :
                     performanceMetrics.totalTime < 2000 ? '良好' :
                     '需优化'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

