import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadPLYFile, Point } from '../utils/plyLoader';

interface PointCloudViewerProps {
  filePath?: string;
}

export default function PointCloudViewer({ filePath = '/test.ply' }: PointCloudViewerProps) {
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
  const resetViewRef = useRef<(() => void) | null>(null);


  useEffect(() => {
    if (!mountRef.current) return;

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

    // 加载点云
    loadPLYFile(filePath)
      .then((points: Point[]) => {
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

        // 创建材质
        const material = new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: true,
          sizeAttenuation: true,
        });
        materialRef.current = material;

        // 创建点云对象
        const pointsMesh = new THREE.Points(geometry, material);
        scene.add(pointsMesh);
        pointsRef.current = pointsMesh;

        // 调整相机位置以查看整个点云
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

        // 设置重置视角函数
        resetViewRef.current = () => {
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
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || '加载点云文件失败');
        console.error('Error loading PLY file:', err);
      });

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
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
      resetViewRef.current = null;
    };
  }, [filePath]);

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-purple-400">加载点云数据中...</p>
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

