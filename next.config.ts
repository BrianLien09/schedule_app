import type { NextConfig } from "next";

// 判斷是否為生產環境 (只有在 build 的時候才是 true)
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  
  // 只有在部署(Production)時才加上 basePath，本地開發(Local)時保持空白
  basePath: isProd ? "/schedule_app" : "", 
  
  // 允許區域網路裝置 (如手機) 存取開發伺服器 HMR 資源
  allowedDevOrigins: ["192.168.0.186", "192.168.0.*", "192.168.1.*"],

  images: {
    unoptimized: true,
  },
};

export default nextConfig;