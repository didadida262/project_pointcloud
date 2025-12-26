import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadPointCloudFile, Point, LoadProgress } from '../utils/plyLoader';
import { PerformanceMetrics } from './PerformanceMonitor';

interface PointCloudViewerProps {
  filePath?: string;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  startTime?: number; // 页面加载开始时间
  onResetViewReady?: (resetFn: () => void) => void; // 暴露重置函数给父组件
}

export default function PointCloudViewer({ 
  filePath = '/test.ply', 
  onPerformanceUpdate,
  startTime,
  onResetViewReady
}: PointCloudViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const resetViewRef = useRef<(() => void) | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  
  // 性能监控时间点
  const fileLoadStartRef = useRef<number>(0);
  const fileLoadEndRef = useRef<number>(0);
  const parseStartRef = useRef<number>(0);
  const parseEndRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);
  const renderEndRef = useRef<number>(0);
  const fileSizeRef = useRef<number>(0);
  
  // 使用ref保存回调函数，避免依赖变化导致重新渲染
  const onPerformanceUpdateRef = useRef(onPerformanceUpdate);
  const startTimeRef = useRef(startTime);
  const onResetViewReadyRef = useRef(onResetViewReady);
  
  useEffect(() => {
    onPerformanceUpdateRef.current = onPerformanceUpdate;
    startTimeRef.current = startTime;
    onResetViewReadyRef.current = onResetViewReady;
  }, [onPerformanceUpdate, startTime, onResetViewReady]);


  // 初始化场景（只执行一次）
  useEffect(() => {
    if (!mountRef.current || isInitializedRef.current) return;
    isInitializedRef.current = true;

    // 初始化场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    // 初始化相机
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // 初始化渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 初始化控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 动画循环
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (controls && renderer && camera && sceneRef.current) {
        controls.update();
        renderer.render(sceneRef.current, camera);
      }
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      renderer.dispose();
      controls.dispose();
      isInitializedRef.current = false;
    };
  }, []); // 只在组件挂载时执行一次

  // 加载点云文件（当filePath改变时执行）
  useEffect(() => {
    if (!isInitializedRef.current || !sceneRef.current) return;
    
    setLoading(true);
    setError(null);
    
    // 清理旧的点云
    if (pointsRef.current && sceneRef.current) {
      sceneRef.current.remove(pointsRef.current);
      pointsRef.current = null;
    }
    if (geometryRef.current) {
      geometryRef.current.dispose();
      geometryRef.current = null;
    }
    if (materialRef.current) {
      materialRef.current.dispose();
      materialRef.current = null;
    }

    // 记录文件加载开始时间
    fileLoadStartRef.current = performance.now();
    setLoadProgress(0);
    fileSizeRef.current = 0;
    
    // 加载点云（使用通用加载器，自动识别PLY/TXT格式，支持进度回调）
    loadPointCloudFile(filePath, (progress: LoadProgress) => {
      setLoadProgress(progress.percentage);
      // 从进度回调中获取文件大小
      if (progress.total && progress.total > 0) {
        fileSizeRef.current = progress.total;
      }
    })
      .then((points: Point[]) => {
        // 记录文件加载结束和解析开始时间
        fileLoadEndRef.current = performance.now();
        parseStartRef.current = performance.now();

        setLoading(false);
        setError(null);

        // 创建几何体
        const geometry = new THREE.BufferGeometry();
        geometryRef.current = geometry;
        const positions = new Float32Array(points.length * 3);
        const colors = new Float32Array(points.length * 3);

        // 计算中心点用于居中显示
        let centerX = 0, centerY = 0, centerZ = 0;
        points.forEach(p => {
          centerX += p.x;
          centerY += p.y;
          centerZ += p.z;
        });
        centerX /= points.length;
        centerY /= points.length;
        centerZ /= points.length;

        // 填充数据
        points.forEach((point, i) => {
          const i3 = i * 3;
          positions[i3] = point.x - centerX;
          positions[i3 + 1] = point.y - centerY;
          positions[i3 + 2] = point.z - centerZ;
          colors[i3] = point.r / 255;
          colors[i3 + 1] = point.g / 255;
          colors[i3 + 2] = point.b / 255;
        });

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // 记录解析结束和渲染开始时间
        parseEndRef.current = performance.now();
        renderStartRef.current = performance.now();

        // 创建材质
        const material = new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: true,
          sizeAttenuation: true,
        });
        materialRef.current = material;

        // 创建点云对象
        const pointsMesh = new THREE.Points(geometry, material);
        if (sceneRef.current) {
          sceneRef.current.add(pointsMesh);
        }
        pointsRef.current = pointsMesh;

        // 调整相机位置以查看整个点云
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (camera && controls) {
          const box = new THREE.Box3().setFromObject(pointsMesh);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.5;
          camera.position.set(center.x, center.y, center.z + cameraZ);
          camera.lookAt(center);
          controls.target.copy(center);
          controls.update();
        }

        // 记录渲染结束时间
        renderEndRef.current = performance.now();

        // 计算性能指标
        const fileLoadTime = fileLoadEndRef.current - fileLoadStartRef.current;
        const parseTime = parseEndRef.current - parseStartRef.current;
        const renderTime = renderEndRef.current - renderStartRef.current;
        const totalTime = startTimeRef.current 
          ? renderEndRef.current - startTimeRef.current 
          : fileLoadTime + parseTime + renderTime;

        // 获取文件名
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';

        // 通知性能更新
        if (onPerformanceUpdateRef.current) {
          onPerformanceUpdateRef.current({
            totalTime,
            fileLoadTime,
            parseTime,
            renderTime,
            pointCount: points.length,
            fileName: fileName === 'unknown' ? undefined : fileName,
            fileSize: fileSizeRef.current > 0 ? fileSizeRef.current : undefined,
          });
        }

        // 设置重置视角函数
        resetViewRef.current = () => {
          const camera = cameraRef.current;
          const controls = controlsRef.current;
          if (pointsMesh && camera && controls) {
            const box = new THREE.Box3().setFromObject(pointsMesh);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5;
            camera.position.set(center.x, center.y, center.z + cameraZ);
            camera.lookAt(center);
            controls.target.copy(center);
            controls.update();
          }
        };
        
        // 暴露重置函数给父组件
        if (onResetViewReadyRef.current) {
          onResetViewReadyRef.current(resetViewRef.current);
        }
      })
      .catch((err: Error) => {
        setLoading(false);
        setError(err.message || '加载点云文件失败');
        console.error('Error loading point cloud file:', err);
      });
  }, [filePath]); // 当filePath改变时重新加载点云

  return (
    <div ref={mountRef} className="w-full h-full relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="text-center w-full max-w-md px-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-purple-400 mb-4">加载点云数据中...</p>
            
            {/* 进度条 */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
              <div
                style={{ width: `${loadProgress}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              />
            </div>
            <p className="text-xs text-gray-400">{Math.round(loadProgress)}%</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-2">错误</p>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

