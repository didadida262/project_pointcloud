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
}

// 优化的PLY文件加载器 - 使用更高效的解析算法
// 主要优化：
// 1. 使用indexOf代替split，减少内存分配
// 2. 预分配数组，避免动态扩容
// 3. 批量处理，减少进度回调频率
// 4. 使用substring代替split，提高解析速度
export async function loadPLYFile(
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
  let headerEnd = false;
  let vertexCount = 0;
  let loadedBytes = 0;
  
  // 第一阶段：读取头部信息
  while (!headerEnd) {
    const { done, value } = await reader.read();
    if (done) break;
    
    loadedBytes += value.length;
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    
    // 查找header结束位置
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('element vertex')) {
        const match = line.match(/element vertex (\d+)/);
        if (match) {
          vertexCount = parseInt(match[1], 10);
        }
      }
      
      if (line === 'end_header') {
        headerEnd = true;
        // 保留header之后的数据
        buffer = lines.slice(i + 1).join('\n');
        break;
      }
    }
    
    // 更新进度
    if (onProgress && contentLength > 0) {
      onProgress({
        loaded: loadedBytes,
        total: contentLength,
        percentage: Math.min((loadedBytes / contentLength) * 50, 50) // 头部解析占50%
      });
    }
  }
  
  if (!headerEnd) {
    throw new Error('PLY文件格式错误：未找到end_header');
  }
  
  // 第二阶段：读取并解析顶点数据（分块处理）
  const points: Point[] = new Array(vertexCount);
  let pointIndex = 0;
  const BATCH_SIZE = 50000; // 每批处理50000个点（增大批次减少回调频率）
  
  // 继续读取剩余数据
  while (pointIndex < vertexCount) {
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
    for (let i = 0; i < lines.length && pointIndex < vertexCount; i++) {
      const line = lines[i];
      if (!line || line.length < 10) continue; // 快速跳过空行和短行
      
      // 使用indexOf代替split，减少内存分配和函数调用
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
      
      // 使用substring代替split，直接解析
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
    }
    
    // 每处理一批后，让出控制权，避免阻塞UI
    if (pointIndex % BATCH_SIZE === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // 更新进度
      if (onProgress && contentLength > 0) {
        const parseProgress = (pointIndex / vertexCount) * 50; // 解析占50%
        onProgress({
          loaded: loadedBytes,
          total: contentLength,
          percentage: 50 + parseProgress
        });
      }
    }
  }
  
  // 处理最后剩余的数据 - 使用优化的解析
  const lastLine = buffer.trim();
  if (lastLine && lastLine.length >= 10 && pointIndex < vertexCount) {
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
              points[pointIndex] = { x, y, z, r, g, b };
              pointIndex++;
            }
          }
        }
      }
    }
  }
  
  // 确保数组长度正确
  if (pointIndex < vertexCount) {
    return points.slice(0, pointIndex);
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

// 兼容旧版本的简单加载器（用于小文件）
export async function loadPLYFileSimple(filePath: string): Promise<Point[]> {
  const response = await fetch(filePath);
  const text = await response.text();
  
  const lines = text.split('\n');
  
  let headerEnd = false;
  let vertexCount = 0;
  let currentLine = 0;
  
  // 解析头部
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('element vertex')) {
      const match = line.match(/element vertex (\d+)/);
      if (match) {
        vertexCount = parseInt(match[1], 10);
      }
    }
    
    if (line === 'end_header') {
      headerEnd = true;
      currentLine = i + 1;
      break;
    }
  }
  
  if (!headerEnd) {
    throw new Error('PLY文件格式错误：未找到end_header');
  }
  
  // 预分配数组大小以提高性能
  const pointsArray: Point[] = new Array(vertexCount);
  let pointIndex = 0;
  
  // 解析顶点数据
  for (let i = currentLine; i < lines.length && pointIndex < vertexCount; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(/\s+/);
    if (parts.length >= 6) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parseFloat(parts[2]);
      const r = parseInt(parts[3], 10);
      const g = parseInt(parts[4], 10);
      const b = parseInt(parts[5], 10);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        pointsArray[pointIndex] = { x, y, z, r, g, b };
        pointIndex++;
      }
    }
  }
  
  return pointsArray.slice(0, pointIndex);
}
