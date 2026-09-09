import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerWindowControls } from './windowControls'
import { registerWatchlistIpc } from './watchlist'
import { registerTmdbIpc } from './services/tmdb'
import { registerAppLauncherIpc } from './appLauncher'
import { registerUpdaterIpc } from './updater'

// O .env fica de fora do pacote de propósito (senão as chaves da API iriam
// pro DMG publicado no GitHub Release, que é público). No app empacotado,
// process.cwd() não é a pasta do projeto, então carregamos de um local fixo
// fora do bundle — o mesmo diretório onde já fica o banco SQLite. Em dev
// (npm run dev), esse arquivo não existe ainda, então cai no fallback e lê
// o .env normal da raiz do projeto, como sempre.
try {
  process.loadEnvFile(join(app.getPath('userData'), '.env'))
} catch {
  try {
    process.loadEnvFile()
  } catch {
    // .env é opcional; chamadas às APIs externas falham com erro claro se as chaves faltarem
  }
}

// Necessário no MacBook Air 2017 (GPU Intel integrada antiga): o backend OpenGL
// padrão do ANGLE falha na inicialização nessa GPU ("eglQueryDeviceAttribEXT: bad
// attribute") e a janela nunca abre. Forçar o backend Metal evita esse caminho
// quebrado sem desligar a aceleração de GPU por completo (o que causava
// corrupção visual nas imagens ao renderizar tudo via software).
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('use-angle', 'metal')
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#1b1b1f',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.sofaos.launcher')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerWindowControls()
  registerWatchlistIpc()
  registerTmdbIpc()
  registerAppLauncherIpc()
  registerUpdaterIpc()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
