import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PointCloudViewer from './components/PointCloudViewer';

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('/test.ply');
  const blobUrlRef = useRef<string | null>(null);

  const handleResetView = () => {
    setResetKey(prev => prev + 1);
  };

  const handleLoadFile = (file: File) => {
    // 清理之前的blob URL
    if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

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
        <Sidebar onResetView={handleResetView} onLoadFile={handleLoadFile} />
        <div className="flex-1">
          <PointCloudViewer key={resetKey} filePath={currentFile} />
        </div>
      </div>
    </div>
  );
}

export default App;

