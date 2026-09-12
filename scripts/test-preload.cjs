/**
 * 某些 Windows 受限執行環境會將 uv_os_get_passwd 回報為 ENOMEM。
 * tsx 只需要 username 建立快取目錄，因此只在該系統呼叫失敗時提供測試用替代值。
 */
const os = module.require('node:os');

try {
  os.userInfo();
} catch (error) {
  if (error?.syscall !== 'uv_os_get_passwd' || error?.info?.code !== 'ENOMEM') {
    throw error;
  }

  const username = process.env.USERNAME || process.env.USER || 'test-runner';
  const homeDirectory = process.env.USERPROFILE || process.env.HOME || process.cwd();

  os.userInfo = () => ({
    username,
    uid: -1,
    gid: -1,
    shell: null,
    homedir: homeDirectory,
  });
}
