import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PointCloudViewer from './components/PointCloudViewer';
import { PerformanceMetrics } from './components/PerformanceMonitor';

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('/test.ply');
  const blobUrlRef = useRef<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const pageStartTimeRef = useRef<number>(performance.now());

  const handleResetView = () => {
    setResetKey(prev => prev + 1);
  };

  const handleLoadFile = (file: File) => {
    // 清理之前的blob URL
    if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    // 重置性能监控开始时间
    pageStartTimeRef.current = performance.now();
    setPerformanceMetrics(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setCurrentFile(url);
      setResetKey(prev => prev + 1); // 重置查看器以加载新文件
    };
    reader.readAsText(file);
  };

  const handlePerformanceUpdate = (metrics: PerformanceMetrics) => {
    setPerformanceMetrics(metrics);
  };

  // 清理blob URL
  useEffect(() => {
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950">
      <Header />
      <div className="flex-1 flex overflow-hidden" style={{ marginTop: '64px' }}>
        <Sidebar 
          onResetView={handleResetView} 
          onLoadFile={handleLoadFile}
          performanceMetrics={performanceMetrics}
        />
        <div className="flex-1">
          <PointCloudViewer 
            key={resetKey} 
            filePath={currentFile}
            onPerformanceUpdate={handlePerformanceUpdate}
            startTime={pageStartTimeRef.current}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

