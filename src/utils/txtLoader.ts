import { Point, LoadProgress } from './plyLoader';

// TXT格式点云加载器
// TXT格式：每行包含 x y z r g b（空格分隔），无头部信息
export async function loadTXTFile(
  filePath: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<Point[]> {
  const response = await fetch(filePath);
  
  if (!response.body) {
    throw new Error('无法读取文件流');
  }

  const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let buffer = '';
  let loadedBytes = 0;
  const points: Point[] = [];
  const BATCH_SIZE = 50000; // 每批处理50000个点
  
  // 流式读取和解析
  while (true) {
    const { done, value } = await reader.read();
    if (done && !buffer) break;
    
    if (value) {
      loadedBytes += value.length;
      buffer += decoder.decode(value, { stream: true });
    }
    
    // 处理缓冲区中的数据
    const lines = buffer.split('\n');
    buffer = ''; // 清空缓冲区
    
    // 保留最后一行（可能不完整）
    const lastLine = lines.pop();
    if (lastLine) {
      buffer = lastLine;
    }
    
    // 批量处理点数据 - 使用优化的解析算法
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.length < 10) continue; // 快速跳过空行和短行
      
      // 跳过注释行（以#开头）
      if (line.trim().startsWith('#')) continue;
      
      // 使用indexOf代替split，减少内存分配
      let idx1 = line.indexOf(' ', 0);
      if (idx1 === -1) continue;
      let idx2 = line.indexOf(' ', idx1 + 1);
      if (idx2 === -1) continue;
      let idx3 = line.indexOf(' ', idx2 + 1);
      if (idx3 === -1) {
        // 可能只有x y z，没有颜色信息
        const x = parseFloat(line.substring(0, idx1));
        const y = parseFloat(line.substring(idx1 + 1, idx2));
        const z = parseFloat(line.substring(idx2 + 1));
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          points.push({ x, y, z, r: 255, g: 255, b: 255 }); // 默认白色
        }
        continue;
      }
      
      let idx4 = line.indexOf(' ', idx3 + 1);
      if (idx4 === -1) {
        // 只有x y z，没有颜色
        const x = parseFloat(line.substring(0, idx1));
        const y = parseFloat(line.substring(idx1 + 1, idx2));
        const z = parseFloat(line.substring(idx2 + 1, idx3));
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          points.push({ x, y, z, r: 255, g: 255, b: 255 }); // 默认白色
        }
        continue;
      }
      
      let idx5 = line.indexOf(' ', idx4 + 1);
      if (idx5 === -1) idx5 = line.length;
      
      // 使用substring代替split，直接解析
      const x = parseFloat(line.substring(0, idx1));
      const y = parseFloat(line.substring(idx1 + 1, idx2));
      const z = parseFloat(line.substring(idx2 + 1, idx3));
      const r = parseInt(line.substring(idx3 + 1, idx4), 10);
      const g = parseInt(line.substring(idx4 + 1, idx5), 10);
      const b = parseInt(line.substring(idx5 + 1), 10);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        points.push({ 
          x, 
          y, 
          z, 
          r: isNaN(r) ? 255 : r, 
          g: isNaN(g) ? 255 : g, 
          b: isNaN(b) ? 255 : b 
        });
      }
    }
    
    // 每处理一批后，让出控制权，避免阻塞UI
    if (points.length % BATCH_SIZE === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // 更新进度
      if (onProgress && contentLength > 0) {
        onProgress({
          loaded: loadedBytes,
          total: contentLength,
          percentage: (loadedBytes / contentLength) * 100
        });
      }
    }
  }
  
  // 处理最后剩余的数据
  const lastLine = buffer.trim();
  if (lastLine && lastLine.length >= 10 && !lastLine.startsWith('#')) {
    let idx1 = lastLine.indexOf(' ', 0);
    if (idx1 !== -1) {
      let idx2 = lastLine.indexOf(' ', idx1 + 1);
      if (idx2 !== -1) {
        let idx3 = lastLine.indexOf(' ', idx2 + 1);
        if (idx3 !== -1) {
          let idx4 = lastLine.indexOf(' ', idx3 + 1);
          if (idx4 !== -1) {
            let idx5 = lastLine.indexOf(' ', idx4 + 1);
            if (idx5 === -1) idx5 = lastLine.length;
            
            const x = parseFloat(lastLine.substring(0, idx1));
            const y = parseFloat(lastLine.substring(idx1 + 1, idx2));
            const z = parseFloat(lastLine.substring(idx2 + 1, idx3));
            const r = parseInt(lastLine.substring(idx3 + 1, idx4), 10);
            const g = parseInt(lastLine.substring(idx4 + 1, idx5), 10);
            const b = parseInt(lastLine.substring(idx5 + 1), 10);
            
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              points.push({ 
                x, 
                y, 
                z, 
                r: isNaN(r) ? 255 : r, 
                g: isNaN(g) ? 255 : g, 
                b: isNaN(b) ? 255 : b 
              });
            }
          }
        }
      }
    }
  }
  
  // 最终进度
  if (onProgress) {
    onProgress({
      loaded: loadedBytes,
      total: contentLength || loadedBytes,
      percentage: 100
    });
  }
  
  return points;
}

