# 点云仿真平台

一个基于 React + Three.js + Tailwind CSS 的现代化点云可视化平台，支持 PLY 格式点云文件的加载、渲染和交互展示。

## 功能特性

- 🎨 现代化的 UI 设计，使用 Aceternity UI 风格和 Tailwind CSS
- 📦 支持 PLY 格式点云文件加载
- 🎮 流畅的 3D 交互控制（旋转、缩放、平移）
- 🎯 自动居中显示点云
- 📱 响应式布局设计
- 🎨 支持彩色点云渲染

## 技术栈

- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Three.js** - 3D 渲染引擎
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画库

## 项目结构

```
project_pointcloud/
├── public/
│   └── test.ply          # 示例点云文件
├── src/
│   ├── components/
│   │   ├── Header.tsx           # 顶部导航栏
│   │   ├── Sidebar.tsx          # 左侧导航栏
│   │   └── PointCloudViewer.tsx # 3D 点云查看器
│   ├── utils/
│   │   └── plyLoader.ts         # PLY 文件解析器
│   ├── App.tsx                   # 主应用组件
│   ├── main.tsx                  # 入口文件
│   └── index.css                 # 全局样式
├── package.json
└── README.md
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产构建

```bash
npm run preview
```

## 使用说明

### 基本操作

- **左键拖拽**：旋转视角
- **滚轮**：缩放场景
- **右键拖拽**：平移场景
- **重置视角按钮**：恢复初始视角

### 加载点云文件

1. 点击左侧导航栏的"加载点云文件"按钮
2. 选择 PLY 格式的点云文件
3. 文件将自动加载并显示在 3D 场景中

### 默认文件

项目默认加载 `public/test.ply` 文件，该文件包含约 12.6 万個点云数据。

## PLY 文件格式

当前支持 ASCII 格式的 PLY 文件，需要包含以下属性：

- `x, y, z` - 顶点坐标
- `red, green, blue` - 颜色信息（0-255）

## 开发计划

详细的产品需求文档请参考 [PRD.md](./PRD.md)

## 许可证

MIT
