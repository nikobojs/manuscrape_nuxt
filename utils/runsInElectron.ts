export const runsInElectron = (): boolean => {
  const electronUserAgent = navigator.userAgent.indexOf('Electron') != -1;
  const electronAPI = !!window.electronAPI;

  if (electronUserAgent !== electronAPI) {
    console.error('Electron user agent and electron api mismatch');
    // TODO: report
  }

  return electronUserAgent && electronAPI;
}