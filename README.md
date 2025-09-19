# Next.js 文件上传项目

这是一个使用 Next.js 和 Geist 字体构建的文件上传演示应用。

## 功能特性

- ✨ 支持拖拽上传文件
- 📁 支持多文件同时上传
- 🎨 美观的用户界面（使用 Tailwind CSS）
- 📱 响应式设计
- 🔍 文件预览和管理
- ⚡ 快速的文件服务

## 如何使用

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 上传文件

1. **拖拽上传**: 直接将文件拖拽到上传区域
2. **点击上传**: 点击上传区域选择文件
3. **多文件上传**: 支持同时选择和上传多个文件

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Geist Font** - 字体
- **File System API** - 文件处理

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── upload/          # 文件上传 API
│   │   └── files/           # 文件服务 API
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 布局组件
│   └── page.tsx             # 主页组件
└── uploads/                 # 上传文件存储目录
```

## API 接口

### POST /api/upload
上传文件接口

**请求格式**: `multipart/form-data`
**参数**: `files` - 要上传的文件

**响应示例**:
```json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "name": "example.jpg",
      "size": 12345,
      "type": "image/jpeg",
      "url": "/api/files/timestamp-randomid.jpg"
    }
  ]
}
```

### GET /api/files/[filename]
获取上传的文件

**参数**: `filename` - 文件名
**响应**: 文件内容

## 部署

### Vercel 部署

```bash
npm run build
```

然后部署到 Vercel 或其他 Next.js 兼容的平台。

## 注意事项

- 上传的文件存储在 `uploads/` 目录中
- 生产环境建议使用云存储服务（如 AWS S3、阿里云 OSS）
- 可以根据需要调整文件大小限制和支持的文件类型

## 许可证

MIT