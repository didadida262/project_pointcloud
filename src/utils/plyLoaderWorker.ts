// Web Worker 版本的PLY加载器 - 真正的性能优化
// 在后台线程处理，不阻塞主线程

export interface Point {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  pointsProcessed: number;
  totalPoints: number;
}

// 使用Web Worker进行后台解析
export function loadPLYFileWithWorker(
  filePath: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<Point[]> {
  return new Promise((resolve, reject) => {
    // 创建Worker（内联代码）
    const workerCode = `
      // 优化的PLY解析器 - 使用更高效的算法
      self.onmessage = function(e) {
        const { text, startIndex, endIndex } = e.data;
        
        if (e.data.type === 'parse') {
          const lines = text.split('\\n');
          const points = [];
          let vertexCount = 0;
          let headerEnd = false;
          let dataStartIndex = 0;
          
          // 快速解析头部
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('element vertex')) {
              const match = line.match(/element vertex (\\d+)/);
              if (match) vertexCount = parseInt(match[1], 10);
            }
            if (line === 'end_header') {
              headerEnd = true;
              dataStartIndex = i + 1;
              break;
            }
          }
          
          if (!headerEnd) {
            self.postMessage({ error: '未找到end_header' });
            return;
          }
          
          // 预分配数组
          const pointsArray = new Array(vertexCount);
          let pointIndex = 0;
          
          // 优化的解析循环 - 减少函数调用和对象创建
          for (let i = dataStartIndex; i < lines.length && pointIndex < vertexCount; i++) {
            const line = lines[i];
            if (!line || line.trim() === '') continue;
            
            // 使用更高效的解析方式
            let spaceIndex1 = line.indexOf(' ', 0);
            if (spaceIndex1 === -1) continue;
            let spaceIndex2 = line.indexOf(' ', spaceIndex1 + 1);
            if (spaceIndex2 === -1) continue;
            let spaceIndex3 = line.indexOf(' ', spaceIndex2 + 1);
            if (spaceIndex3 === -1) continue;
            let spaceIndex4 = line.indexOf(' ', spaceIndex3 + 1);
            if (spaceIndex4 === -1) continue;
            let spaceIndex5 = line.indexOf(' ', spaceIndex4 + 1);
            if (spaceIndex5 === -1) spaceIndex5 = line.length;
            
            const x = parseFloat(line.substring(0, spaceIndex1));
            const y = parseFloat(line.substring(spaceIndex1 + 1, spaceIndex2));
            const z = parseFloat(line.substring(spaceIndex2 + 1, spaceIndex3));
            const r = parseInt(line.substring(spaceIndex3 + 1, spaceIndex4), 10);
            const g = parseInt(line.substring(spaceIndex4 + 1, spaceIndex5), 10);
            const b = parseInt(line.substring(spaceIndex5 + 1), 10);
            
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              pointsArray[pointIndex] = { x, y, z, r, g, b };
              pointIndex++;
            }
            
            // 每处理10000个点报告一次进度
            if (pointIndex % 10000 === 0) {
              self.postMessage({ 
                progress: {
                  pointsProcessed: pointIndex,
                  totalPoints: vertexCount,
                  percentage: (pointIndex / vertexCount) * 100
                }
              });
            }
          }
          
          self.postMessage({ 
            points: pointsArray.slice(0, pointIndex),
            complete: true
          });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    // 先获取文件内容
    fetch(filePath)
      .then(response => response.text())
      .then(text => {
        // 发送到Worker处理
        worker.postMessage({ type: 'parse', text });
      })
      .catch(err => {
        worker.terminate();
        reject(err);
      });
    
    worker.onmessage = (e) => {
      if (e.data.error) {
        worker.terminate();
        reject(new Error(e.data.error));
        return;
      }
      
      if (e.data.progress && onProgress) {
        onProgress(e.data.progress);
      }
      
      if (e.data.complete) {
        worker.terminate();
        URL.revokeObjectURL(blob);
        resolve(e.data.points);
      }
    };
    
    worker.onerror = (error) => {
      worker.terminate();
      URL.revokeObjectURL(blob);
      reject(error);
    };
  });
}

// 更高效的同步解析器 - 使用优化的算法
export async function loadPLYFileOptimized(
  filePath: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<Point[]> {
  const response = await fetch(filePath);
  const text = await response.text();
  
  const lines = text.split('\n');
  let vertexCount = 0;
  let dataStartIndex = 0;
  
  // 快速解析头部
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('element vertex')) {
      const match = line.match(/element vertex (\d+)/);
      if (match) vertexCount = parseInt(match[1], 10);
    }
    if (line === 'end_header') {
      dataStartIndex = i + 1;
      break;
    }
  }
  
  if (!vertexCount) {
    throw new Error('PLY文件格式错误：未找到vertex数量');
  }
  
  // 预分配数组
  const points: Point[] = new Array(vertexCount);
  let pointIndex = 0;
  const BATCH_SIZE = 50000; // 增大批次以提高效率
  
  // 优化的解析循环 - 减少字符串操作
  for (let i = dataStartIndex; i < lines.length && pointIndex < vertexCount; i++) {
    const line = lines[i];
    if (!line || line.length < 10) continue; // 快速跳过空行
    
    // 使用indexOf代替split，减少内存分配
    let idx1 = line.indexOf(' ', 0);
    if (idx1 === -1) continue;
    let idx2 = line.indexOf(' ', idx1 + 1);
    if (idx2 === -1) continue;
    let idx3 = line.indexOf(' ', idx2 + 1);
    if (idx3 === -1) continue;
    let idx4 = line.indexOf(' ', idx3 + 1);
    if (idx4 === -1) continue;
    let idx5 = line.indexOf(' ', idx4 + 1);
    if (idx5 === -1) idx5 = line.length;
    
    const x = parseFloat(line.substring(0, idx1));
    const y = parseFloat(line.substring(idx1 + 1, idx2));
    const z = parseFloat(line.substring(idx2 + 1, idx3));
    const r = parseInt(line.substring(idx3 + 1, idx4), 10);
    const g = parseInt(line.substring(idx4 + 1, idx5), 10);
    const b = parseInt(line.substring(idx5 + 1), 10);
    
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      points[pointIndex] = { x, y, z, r, g, b };
      pointIndex++;
    }
    
    // 批量更新进度，减少回调频率
    if (pointIndex % BATCH_SIZE === 0 && onProgress) {
      // 使用requestIdleCallback或setTimeout让出控制权
      await new Promise(resolve => setTimeout(resolve, 0));
      onProgress({
        loaded: 0,
        total: 0,
        percentage: (pointIndex / vertexCount) * 100,
        pointsProcessed: pointIndex,
        totalPoints: vertexCount
      });
    }
  }
  
  if (onProgress) {
    onProgress({
      loaded: 0,
      total: 0,
      percentage: 100,
      pointsProcessed: pointIndex,
      totalPoints: vertexCount
    });
  }
  
  return points.slice(0, pointIndex);
}

