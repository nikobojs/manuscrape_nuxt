export const runsInElectron = (): boolean => {
  if (!process.client) return false;
  const electronUserAgent = window.navigator.userAgent.indexOf('Electron') != -1;
  const electronAPI = !!window.electronAPI;

  if (electronUserAgent !== electronAPI) {
    console.error('Electron user agent and electron api mismatch');
    // TODO: report
  }

  return electronUserAgent && electronAPI;
}