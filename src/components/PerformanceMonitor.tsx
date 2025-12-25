import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export interface PerformanceMetrics {
  totalTime: number; // 总耗时（毫秒）
  fileLoadTime: number; // 文件加载耗时
  parseTime: number; // 解析耗时
  renderTime: number; // 渲染耗时
  pointCount: number; // 点云数量
  fileName?: string; // 文件名
  fileSize?: number; // 文件大小（字节）
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics | null;
  onClose?: () => void;
}

export default function PerformanceMonitor({ metrics, onClose }: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (metrics) {
      setIsVisible(true);
    }
  }, [metrics]);

  if (!metrics || !isVisible) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(2)} ms`;
    }
    return `${(ms / 1000).toFixed(2)} s`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN');
  };

  const getPerformanceColor = (time: number) => {
    if (time < 500) return 'text-green-400';
    if (time < 1000) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <motion.div
          className={`
            bg-slate-900/95 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-2xl
            ${isMinimized ? 'w-64' : 'w-80'}
            overflow-hidden
          `}
        >
          {/* 标题栏 */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-purple-500/20 cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <h3 className="text-sm font-semibold text-purple-300">性能监控</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                {isMinimized ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                    onClose();
                  }}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 内容区域 */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {/* 总耗时 */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">总耗时</span>
                      <span className={`text-lg font-bold ${getPerformanceColor(metrics.totalTime)}`}>
                        {formatTime(metrics.totalTime)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((metrics.totalTime / 3000) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                  </div>

                  {/* 详细指标 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">文件加载</span>
                      <span className="text-purple-300 font-mono">{formatTime(metrics.fileLoadTime)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">数据解析</span>
                      <span className="text-purple-300 font-mono">{formatTime(metrics.parseTime)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">场景渲染</span>
                      <span className="text-purple-300 font-mono">{formatTime(metrics.renderTime)}</span>
                    </div>
                  </div>

                  {/* 分隔线 */}
                  <div className="border-t border-purple-500/20"></div>

                  {/* 点云信息 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">点云数量</span>
                      <span className="text-purple-300 font-mono">{formatNumber(metrics.pointCount)}</span>
                    </div>
                    {metrics.fileName && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">文件名</span>
                        <span className="text-purple-300 text-xs truncate max-w-[180px]" title={metrics.fileName}>
                          {metrics.fileName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 性能评级 */}
                  <div className="pt-2 border-t border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">性能评级</span>
                      <span className={`text-xs font-semibold ${
                        metrics.totalTime < 1000 ? 'text-green-400' :
                        metrics.totalTime < 2000 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {metrics.totalTime < 1000 ? '优秀' :
                         metrics.totalTime < 2000 ? '良好' :
                         '需优化'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

