import type { NextConfig } from "next";

// 判斷是否為生產環境 (只有在 build 的時候才是 true)
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  
  // 只有在部署(Production)時才加上 basePath，本地開發(Local)時保持空白
  basePath: isProd ? "/schedule_app" : "", 
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;