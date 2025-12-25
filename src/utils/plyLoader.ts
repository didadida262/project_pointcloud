export interface Point {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
}

export async function loadPLYFile(filePath: string): Promise<Point[]> {
  const response = await fetch(filePath);
  const text = await response.text();
  
  const lines = text.split('\n');
  const points: Point[] = [];
  
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
  
  // 解析顶点数据
  for (let i = currentLine; i < lines.length && points.length < vertexCount; i++) {
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
        points.push({ x, y, z, r, g, b });
      }
    }
  }
  
  return points;
}

