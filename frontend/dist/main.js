const L={en:{},es:{}};
let lang='en',busy=false,catData=[],pickedT=new Set(),pickedA=new Set(),curTab='restore',pkgMgr='winget';

function T(k){return L[lang]?.[k]||L.en?.[k]||k}
function LO(v){return(typeof v==='object'&&v)?(v[lang]||v['en']||''):(v||'')}

const APPS=[
  {cat:'Navegadores',icon:'🌐',id:'firefox',img:'/icons/browsers/firefox.svg',n:{en:'Firefox',es:'Firefox'},d:{en:'Privacy-focused browser',es:'Navegador centrado en privacidad'},w:'Mozilla.Firefox',c:'firefox',u:'https://www.mozilla.org/firefox/'},
  {cat:'Navegadores',icon:'🦁',id:'brave',img:'/icons/browsers/brave.svg',n:{en:'Brave',es:'Brave'},d:{en:'Chromium + ad blocker',es:'Chromium + bloqueador de anuncios'},w:'Brave.Brave',c:'brave',u:'https://brave.com/'},
  {cat:'Navegadores',icon:'🐺',id:'librewolf',img:'/icons/browsers/librewolf.svg',n:{en:'LibreWolf',es:'LibreWolf'},d:{en:'Hardened Firefox fork',es:'Fork de Firefox reforzado'},w:'LibreWolf.LibreWolf',c:'librewolf',u:'https://librewolf.net/'},
  {cat:'Navegadores',icon:'🔴',id:'chrome',img:'/icons/browsers/chrome.svg',n:{en:'Google Chrome',es:'Google Chrome'},d:{en:'Popular Chromium browser',es:'Navegador Chromium mas popular'},w:'Google.Chrome',c:'googlechrome',u:'https://www.google.com/chrome/'},
  {cat:'Navegadores',icon:'🔵',id:'chromium',img:'/icons/browsers/chromium.svg',n:{en:'Chromium (Hibbiki)',es:'Chromium (Hibbiki)'},d:{en:'Ungoogled Chromium build',es:'Compilacion Chromium sin Google'},w:'Hibbiki.Chromium',c:'chromium',u:'https://github.com/Hibbiki/chromium-win64'},
  {cat:'Navegadores',icon:'🎻',id:'vivaldi',img:'/icons/browsers/vivaldi.svg',n:{en:'Vivaldi',es:'Vivaldi'},d:{en:'Customizable Chromium browser',es:'Navegador Chromium personalizable'},w:'Vivaldi.Vivaldi',c:'vivaldi',u:'https://vivaldi.com/'},
  {cat:'Navegadores',icon:'💧',id:'waterfox',img:'/icons/browsers/waterfox.png',n:{en:'Waterfox',es:'Waterfox'},d:{en:'Privacy-focused Firefox fork',es:'Fork de Firefox centrado en privacidad'},w:'Waterfox.Waterfox',c:'waterfox',u:'https://www.waterfox.com/'},
  {cat:'Navegadores',icon:'🧘',id:'zen',img:'/icons/browsers/zen-browser.svg',n:{en:'Zen Browser',es:'Zen Browser'},d:{en:'Beautifully designed Firefox fork',es:'Fork de Firefox con diseno cuidado'},w:'Zen.Browser',c:'zen-browser',u:'https://zen-browser.app/'},
  {cat:'Navegadores',icon:'🌙',id:'palemoon',img:'/icons/browsers/palemoon.png',n:{en:'Pale Moon',es:'Pale Moon'},d:{en:'Lightweight Goanna-based browser',es:'Navegador ligero basado en Goanna'},w:'MoonchildProductions.PaleMoon',c:'palemoon',u:'https://www.palemoon.org/'},
  {cat:'Navegadores',icon:'🟢',id:'mullvad',img:'/icons/browsers/mullvad.svg',n:{en:'Mullvad Browser',es:'Mullvad Browser'},d:{en:'Privacy browser by Mullvad & Tor',es:'Navegador privado de Mullvad y Tor'},w:'MullvadVPN.MullvadBrowser',c:'mullvad-browser',u:'https://mullvad.net/es/browser'},
  {cat:'Navegadores',icon:'🎈',id:'helium',img:'/icons/browsers/helium.png',n:{en:'Helium',es:'Helium'},d:{en:'Lightweight web browser',es:'Navegador web ligero'},w:'',c:'',u:'https://github.com/imputnet/helium/'},
  {cat:'Navegadores',icon:'🏠',id:'floorp',img:'/icons/browsers/floorp.svg',n:{en:'Floorp',es:'Floorp'},d:{en:'Customizable Firefox fork',es:'Fork de Firefox altamente personalizable'},w:'Ablaze.Floorp',c:'floorp',u:'https://floorp.app/'},
  {cat:'Navegadores',icon:'🦅',id:'falkon',img:'/icons/browsers/falkon.webp',n:{en:'Falkon',es:'Falkon'},d:{en:'KDE QtWebEngine browser',es:'Navegador KDE con QtWebEngine'},w:'KDE.Falkon',c:'falkon',u:'https://www.falkon.org/'},
  {cat:'Navegadores',icon:'📐',id:'edge',img:'/icons/browsers/edge.svg',n:{en:'Microsoft Edge',es:'Microsoft Edge'},d:{en:'Chromium-based MS browser',es:'Navegador MS basado en Chromium'},w:'Microsoft.Edge',c:'microsoft-edge',u:'https://www.microsoft.com/edge/'},
  {cat:'Navegadores',icon:'🧅',id:'tor',img:'/icons/browsers/tor.svg',n:{en:'Tor Browser',es:'Tor Browser'},d:{en:'Anonymous browsing via Tor',es:'Navegacion anonima via Tor'},w:'TorProject.TorBrowser',c:'tor-browser',u:'https://www.torproject.org/'},
  {cat:'Multimedia',icon:'🎬',id:'vlc',img:'/icons/multimedia/vlc.ico',n:{en:'VLC Media Player',es:'VLC Media Player'},d:{en:'Universal media player',es:'Reproductor multimedia universal'},w:'VideoLAN.VLC',c:'vlc',u:'https://www.videolan.org/vlc/'},
  {cat:'Multimedia',icon:'🎥',id:'obs',img:'/icons/multimedia/obs.png',n:{en:'OBS Studio',es:'OBS Studio'},d:{en:'Streaming & recording',es:'Streaming y grabacion'},w:'OBSProject.OBSStudio',c:'obs-studio',u:'https://obsproject.com/'},
  {cat:'Multimedia',icon:'🎨',id:'gimp',img:'/icons/multimedia/gimp.png',n:{en:'GIMP',es:'GIMP'},d:{en:'Image editor (alt to Photoshop)',es:'Editor de imagenes (alternativa a Photoshop)'},w:'GIMP.GIMP',c:'gimp',u:'https://www.gimp.org/'},
  {cat:'Multimedia',icon:'🖌',id:'krita',img:'/icons/multimedia/krita.ico',n:{en:'Krita',es:'Krita'},d:{en:'Digital painting',es:'Pintura digital'},w:'KDE.Krita',c:'krita',u:'https://krita.org/'},
  {cat:'Multimedia',icon:'🔊',id:'audacity',img:'/icons/multimedia/audacity.ico',n:{en:'Audacity',es:'Audacity'},d:{en:'Audio editor',es:'Editor de audio'},w:'Audacity.Audacity',c:'audacity',u:'https://www.audacityteam.org/'},
  {cat:'Multimedia',icon:'✏',id:'inkscape',img:'/icons/multimedia/inkscape.ico',n:{en:'Inkscape',es:'Inkscape'},d:{en:'Vector graphics editor',es:'Editor de graficos vectoriales'},w:'Inkscape.Inkscape',c:'inkscape',u:'https://inkscape.org/'},
  {cat:'Multimedia',icon:'🧊',id:'blender',img:'/icons/multimedia/blender.svg',n:{en:'Blender',es:'Blender'},d:{en:'3D modeling & animation',es:'Modelado y animacion 3D'},w:'BlenderFoundation.Blender',c:'blender',u:'https://www.blender.org/'},
  {cat:'Multimedia',icon:'🎤',id:'voicemeeter',img:'/icons/multimedia/voicemeeter.png',n:{en:'Voicemeeter',es:'Voicemeeter'},d:{en:'Virtual audio mixer',es:'Mezclador de audio virtual'},w:'VB-Audio.Voicemeeter',c:'voicemeeter',u:'https://voicemeeter.com/'},
  {cat:'Multimedia',icon:'🎞',id:'ffmpeg',img:'/icons/multimedia/ffmpeg.ico',n:{en:'FFmpeg',es:'FFmpeg'},d:{en:'Audio/video processing suite',es:'Suite de procesamiento A/V'},w:'Gyan.FFmpeg',c:'ffmpeg',u:'https://ffmpeg.org/'},
  {cat:'Multimedia',icon:'⬇',id:'ytdlp',img:'/icons/multimedia/yt-dlp.svg',n:{en:'yt-dlp',es:'yt-dlp'},d:{en:'Video/audio downloader',es:'Descargador de video/audio'},w:'yt-dlp.yt-dlp',c:'yt-dlp',u:'https://github.com/yt-dlp/yt-dlp'},
  {cat:'Multimedia',icon:'📺',id:'potplayer',img:'/icons/multimedia/potplayer.ico',n:{en:'PotPlayer',es:'PotPlayer'},d:{en:'Lightweight media player',es:'Reproductor multimedia ligero'},w:'Daum.PotPlayer',c:'potplayer',u:'https://potplayer.tv/'},
  {cat:'Multimedia',icon:'📐',id:'freecad',img:'/icons/multimedia/freecad.svg',n:{en:'FreeCAD',es:'FreeCAD'},d:{en:'Parametric 3D CAD modeler',es:'Modelador CAD 3D parametrico'},w:'FreeCAD.FreeCAD',c:'freecad',u:'https://www.freecadweb.org/'},
  {cat:'Multimedia',icon:'🎬',id:'handbrake',img:'/icons/multimedia/handbrake.ico',n:{en:'HandBrake',es:'HandBrake'},d:{en:'Video transcoder',es:'Transcodificador de video'},w:'HandBrake.HandBrake',c:'handbrake',u:'https://handbrake.fr/'},
  {cat:'Multimedia',icon:'🎵',id:'fxsound',img:'/icons/multimedia/fxsound.ico',n:{en:'FxSound',es:'FxSound'},d:{en:'Audio enhancer & equalizer',es:'Mejorador de audio y ecualizador'},w:'FxSoundLLC.FxSound',c:'fxsound',u:'https://www.fxsound.com/'},
  {cat:'Multimedia',icon:'📸',id:'greenshot',img:'/icons/multimedia/greenshot.ico',n:{en:'Greenshot',es:'Greenshot'},d:{en:'Screenshot tool',es:'Herramienta de captura'},w:'Greenshot.Greenshot',c:'greenshot',u:'https://getgreenshot.org/'},
  {cat:'Multimedia',icon:'🖼',id:'lightshot',img:'/icons/multimedia/lightshot.ico',n:{en:'Lightshot',es:'Lightshot'},d:{en:'Fast screenshot tool',es:'Captura de pantalla rapida'},w:'',c:'lightshot',u:'https://app.prntscr.com/'},
  {cat:'Multimedia',icon:'📺',id:'stremio',img:'/icons/multimedia/stremio.svg',n:{en:'Stremio',es:'Stremio'},d:{en:'Media center & streaming hub',es:'Centro multimedia y streaming'},w:'Stremio.Stremio',c:'stremio',u:'https://www.stremio.com/'},
  {cat:'Desarrollo',icon:'💻',id:'vscode',img:'/icons/desarrollo/visual-studio-code.svg',n:{en:'VS Code',es:'VS Code'},d:{en:'Code editor',es:'Editor de codigo'},w:'Microsoft.VisualStudioCode',c:'vscode',u:'https://code.visualstudio.com/'},
  {cat:'Desarrollo',icon:'🔀',id:'git',img:'/icons/desarrollo/git.svg',n:{en:'Git',es:'Git'},d:{en:'Version control',es:'Control de versiones'},w:'Git.Git',c:'git',u:'https://git-scm.com/'},
  {cat:'Desarrollo',icon:'🖥',id:'winterm',img:'/icons/desarrollo/windows-terminal.svg',n:{en:'Windows Terminal',es:'Windows Terminal'},d:{en:'Modern terminal',es:'Terminal moderna'},w:'Microsoft.WindowsTerminal',c:'microsoft-windows-terminal',u:'https://github.com/microsoft/terminal'},
  {cat:'Desarrollo',icon:'📝',id:'notepadpp',img:'/icons/desarrollo/notepad-plus-plus.svg',n:{en:'Notepad++',es:'Notepad++'},d:{en:'Advanced text editor',es:'Editor de texto avanzado'},w:'Notepad++.Notepad++',c:'notepadplusplus',u:'https://notepad-plus-plus.org/'},
  {cat:'Desarrollo',icon:'🗜',id:'7zip',img:'/icons/desarrollo/7-zip.svg',n:{en:'7-Zip',es:'7-Zip'},d:{en:'File archiver',es:'Compresor de archivos'},w:'7zip.7zip',c:'7zip',u:'https://www.7-zip.org/'},
  {cat:'Desarrollo',icon:'🔍',id:'everything',img:'/icons/desarrollo/everything.webp',n:{en:'Everything',es:'Everything'},d:{en:'Instant file search',es:'Busqueda instantanea de archivos'},w:'voidtools.Everything',c:'everything',u:'https://www.voidtools.com/'},
  {cat:'Desarrollo',icon:'🔱',id:'fork',img:'/icons/desarrollo/fork.ico',n:{en:'Fork',es:'Fork'},d:{en:'Git GUI client',es:'Cliente Git GUI'},w:'Fork.Fork',c:'fork',u:'https://git-fork.com/'},
  {cat:'Desarrollo',icon:'💚',id:'neovim',img:'/icons/desarrollo/neovim.ico',n:{en:'Neovim',es:'Neovim'},d:{en:'Modern Vim-based editor',es:'Editor moderno basado en Vim'},w:'Neovim.Neovim',c:'neovim',u:'https://neovim.io/'},
  {cat:'Desarrollo',icon:'🐍',id:'python',img:'/icons/desarrollo/python.ico',n:{en:'Python',es:'Python'},d:{en:'Python programming language',es:'Lenguaje de programacion Python'},w:'Python.Python.3.12',c:'python',u:'https://www.python.org/'},
  {cat:'Desarrollo',icon:'💚',id:'nodejs',img:'/icons/desarrollo/nodejs.ico',n:{en:'Node.js',es:'Node.js'},d:{en:'JavaScript runtime',es:'Entorno de ejecucion JavaScript'},w:'OpenJS.NodeJS',c:'nodejs',u:'https://nodejs.org/'},
  {cat:'Desarrollo',icon:'🔵',id:'go',img:'/icons/desarrollo/go.ico',n:{en:'Go',es:'Go'},d:{en:'Go programming language',es:'Lenguaje de programacion Go'},w:'GoLang.Go',c:'golang',u:'https://go.dev/'},
  {cat:'Desarrollo',icon:'🧰',id:'jetbrains',img:'/icons/desarrollo/jetbrains.ico',n:{en:'JetBrains Toolbox',es:'JetBrains Toolbox'},d:{en:'IDE manager',es:'Gestor de IDEs'},w:'JetBrains.Toolbox',c:'jetbrainstoolbox',u:'https://www.jetbrains.com/toolbox-app/'},
  {cat:'Desarrollo',icon:'💎',id:'ruby',img:'/icons/desarrollo/ruby.ico',n:{en:'Ruby',es:'Ruby'},d:{en:'Ruby programming language',es:'Lenguaje de programacion Ruby'},w:'RubyInstallerTeam.Ruby',c:'ruby',u:'https://rubyinstaller.org/'},
  {cat:'Desarrollo',icon:'🦥',id:'lazygit',n:{en:'LazyGit',es:'LazyGit'},d:{en:'Terminal Git UI',es:'UI de Git para terminal'},w:'JesseDuffield.lazygit',c:'lazygit',u:'https://github.com/jesseduffield/lazygit/'},
  {cat:'Desarrollo',icon:'🧶',id:'yarn',img:'/icons/desarrollo/yarn.png',n:{en:'Yarn',es:'Yarn'},d:{en:'Fast JS package manager',es:'Gestor de paquetes JS rapido'},w:'Yarn.Yarn',c:'yarn',u:'https://yarnpkg.com/'},
  {cat:'Desarrollo',icon:'⚙',id:'rust',img:'/icons/desarrollo/rust.svg',n:{en:'Rust',es:'Rust'},d:{en:'Rust programming language',es:'Lenguaje de programacion Rust'},w:'Rustlang.Rustup',c:'rust',u:'https://rust-lang.org/'},
  {cat:'Desarrollo',icon:'📐',id:'gitextensions',n:{en:'Git Extensions',es:'Git Extensions'},d:{en:'Git GUI + Visual Studio plugin',es:'GUI Git + plugin Visual Studio'},w:'GitExtensionsTeam.GitExtensions',c:'gitextensions',u:'https://gitextensions.github.io/'},
  {cat:'Desarrollo',icon:'🐙',id:'ghcli',img:'/icons/desarrollo/ghcli.png',n:{en:'GitHub CLI',es:'GitHub CLI'},d:{en:'GitHub from terminal',es:'GitHub desde terminal'},w:'GitHub.cli',c:'gh',u:'https://cli.github.com/'},
  {cat:'Desarrollo',icon:'⚡',id:'zed',img:'/icons/desarrollo/zed.webp',n:{en:'Zed',es:'Zed'},d:{en:'Fast collaborative editor',es:'Editor colaborativo rapido'},w:'Zed.Zed',c:'zed',u:'https://zed.dev/'},
  {cat:'Desarrollo',icon:'🔗',id:'sublimemerge',img:'/icons/desarrollo/sublimemerge.ico',n:{en:'Sublime Merge',es:'Sublime Merge'},d:{en:'Git client by Sublime',es:'Cliente Git de Sublime'},w:'SublimeHQ.SublimeMerge',c:'sublimemerge',u:'https://www.sublimemerge.com/'},
  {cat:'Desarrollo',icon:'💫',id:'ohmyposh',img:'/icons/desarrollo/ohmyposh.png',n:{en:'Oh My Posh',es:'Oh My Posh'},d:{en:'Terminal prompt theming',es:'Tematizador de prompt'},w:'JanDeDobbeleer.OhMyPosh',c:'oh-my-posh',u:'https://ohmyposh.dev/'},
  {cat:'Desarrollo',icon:'🐙',id:'githubdesktop',img:'/icons/desarrollo/githubdesktop.ico',n:{en:'GitHub Desktop',es:'GitHub Desktop'},d:{en:'GitHub GUI client',es:'Cliente GitHub GUI'},w:'GitHub.GitHubDesktop',c:'github-desktop',u:'https://github.com/apps/desktop'},
  {cat:'Desarrollo',icon:'📬',id:'postman',img:'/icons/desarrollo/postman.svg',n:{en:'Postman',es:'Postman'},d:{en:'API development platform',es:'Plataforma de desarrollo API'},w:'Postman.Postman',c:'postman',u:'https://www.postman.com/'},
  {cat:'Desarrollo',icon:'📄',id:'sublimetext',img:'/icons/desarrollo/sublimetext.ico',n:{en:'Sublime Text',es:'Sublime Text'},d:{en:'Sophisticated text editor',es:'Editor de texto sofisticado'},w:'SublimeHQ.SublimeText',c:'sublimetext4',u:'https://www.sublimetext.com/'},
  {cat:'Desarrollo',icon:'💜',id:'visualstudio',img:'/icons/desarrollo/visualstudio.svg',n:{en:'Visual Studio',es:'Visual Studio'},d:{en:'Full-featured IDE',es:'IDE completo'},w:'Microsoft.VisualStudio.2022.Community',c:'visualstudio2022community',u:'https://visualstudio.microsoft.com/'},
  {cat:'Desarrollo',icon:'🐙',id:'gitkraken',img:'/icons/desarrollo/gitkraken.ico',n:{en:'GitKraken',es:'GitKraken'},d:{en:'Git GUI client',es:'Cliente Git GUI'},w:'Axosoft.GitKraken',c:'gitkraken',u:'https://www.gitkraken.com/git-client'},
  {cat:'Desarrollo',icon:'📦',id:'pyenvwin',n:{en:'pyenv-win',es:'pyenv-win'},d:{en:'Python version manager',es:'Gestor de versiones Python'},w:'pyenv-win.pyenv-win',c:'pyenv-win',u:'https://pyenv-win.github.io/pyenv-win/'},
  {cat:'Desarrollo',icon:'🟢',id:'vscodium',img:'/icons/desarrollo/vscodium.svg',n:{en:'VSCodium',es:'VSCodium'},d:{en:'VS Code without MS telemetry',es:'VS Code sin telemetria de MS'},w:'VSCodium.VSCodium',c:'vscodium',u:'https://vscodium.com/'},
  {cat:'Juegos',icon:'🎮',id:'steam',n:{en:'Steam',es:'Steam'},d:{en:'Game platform',es:'Plataforma de juegos'},w:'Valve.Steam',c:'steam-client',u:'https://store.steampowered.com/'},
  {cat:'Juegos',icon:'💬',id:'discord',n:{en:'Discord',es:'Discord'},d:{en:'Voice & text chat',es:'Chat de voz y texto'},w:'Discord.Discord',c:'discord',u:'https://discord.com/'},
  {cat:'Utilidades',icon:'📥',id:'qbittorrent',n:{en:'qBittorrent',es:'qBittorrent'},d:{en:'Torrent client',es:'Cliente de torrents'},w:'qBittorrent.qBittorrent',c:'qbittorrent',u:'https://www.qbittorrent.org/'},
  {cat:'Utilidades',icon:'📸',id:'sharex',n:{en:'ShareX',es:'ShareX'},d:{en:'Screenshot & screen recorder',es:'Captura y grabacion de pantalla'},w:'ShareX.ShareX',c:'sharex',u:'https://getsharex.com/'},
  {cat:'Utilidades',icon:'📊',id:'hwinfo',n:{en:'HWiNFO',es:'HWiNFO'},d:{en:'System monitoring',es:'Monitorizacion del sistema'},w:'REALiX.HWiNFO',c:'hwinfo',u:'https://www.hwinfo.com/'},
  {cat:'Utilidades',icon:'💾',id:'crystaldiskinfo',n:{en:'CrystalDiskInfo',es:'CrystalDiskInfo'},d:{en:'Disk health monitor',es:'Monitor de salud del disco'},w:'CrystalDewWorld.CrystalDiskInfo',c:'crystaldiskinfo',u:'https://crystalmark.info/'},
  {cat:'Utilidades',icon:'💿',id:'rufus',n:{en:'Rufus',es:'Rufus'},d:{en:'Bootable USB creator',es:'Creador de USB bootable'},w:'Rufus.Rufus',c:'rufus',u:'https://rufus.ie/'},
  {cat:'Comunicacion',icon:'✈',id:'telegram',n:{en:'Telegram',es:'Telegram'},d:{en:'Secure messaging',es:'Mensajeria segura'},w:'Telegram.TelegramDesktop',c:'telegram',u:'https://desktop.telegram.org/'},
  {cat:'Comunicacion',icon:'🔒',id:'signal',n:{en:'Signal',es:'Signal'},d:{en:'Encrypted messaging',es:'Mensajeria encriptada'},w:'OpenWhisperSystems.Signal',c:'signal',u:'https://signal.org/'},
  {cat:'Seguridad',icon:'🔑',id:'bitwarden',n:{en:'Bitwarden',es:'Bitwarden'},d:{en:'Password manager',es:'Gestor de contrasenas'},w:'Bitwarden.Bitwarden',c:'bitwarden',u:'https://bitwarden.com/'},
  {cat:'Seguridad',icon:'🔐',id:'veracrypt',n:{en:'VeraCrypt',es:'VeraCrypt'},d:{en:'Disk encryption',es:'Encriptacion de discos'},w:'IDRIX.VeraCrypt',c:'veracrypt',u:'https://www.veracrypt.fr/'},
];

L.en={
  tabRestore:'Restore',tabApps:'Apps',tabTweaks:'Tweaks',
  restoreTitle:'System Restore Point',restoreDesc:'Create a restore point before making changes to your system. This allows you to revert if something goes wrong.',restoreBtn:'Create Restore Point',rpPlaceholder:'Restore point name...',
  installBtn:'Install Selected',installCount:'{n} apps selected',
  applyBtn:'Apply Selected',applyCount:'{n} tweaks selected',selectFirst:'Select tweaks',
  terminal:'Terminal — Logs',clear:'Clear',idle:'Idle',
  restoreRunning:'Creating restore point...',restoreOk:'Restore point created.',restoreFail:'Restore point failed',
  installRunning:'Installing apps...',installOk:'Installation complete.',installFail:'Installation failed',
  tweaksRunning:'Applying tweaks...',tweaksDone:'Done.',
  selectAll:'Select All',deselectAll:'Deselect All',
  cmds:'cmds',warn:'warnings',
  adminWarn:'Run as Administrator — registry, DISM, bcdedit, and WinGet commands require admin privileges',
  viaWinget:'winget:',viaChoco:'choco:',
  uninstall:'Uninstall',website:'Website',
};
L.es={
  tabRestore:'Restaurar',tabApps:'Apps',tabTweaks:'Tweaks',
  restoreTitle:'Punto de Restauracion',restoreDesc:'Crea un punto de restauracion antes de hacer cambios en el sistema. Esto permite revertir si algo sale mal.',restoreBtn:'Crear Punto de Restauracion',rpPlaceholder:'Nombre del punto...',
  installBtn:'Instalar Seleccionados',installCount:'{n} apps seleccionadas',
  applyBtn:'Aplicar Seleccionados',applyCount:'{n} tweaks seleccionados',selectFirst:'Selecciona tweaks',
  terminal:'Terminal — Registros',clear:'Limpiar',idle:'Inactivo',
  restoreRunning:'Creando punto de restauracion...',restoreOk:'Punto de restauracion creado.',restoreFail:'Fallo al crear punto de restauracion',
  installRunning:'Instalando apps...',installOk:'Instalacion completa.',installFail:'Fallo en la instalacion',
  tweaksRunning:'Aplicando tweaks...',tweaksDone:'Completado.',
  selectAll:'Seleccionar Todo',deselectAll:'Deseleccionar Todo',
  cmds:'cmds',warn:'advertencias',
  adminWarn:'Ejecutar como Administrador — comandos de registro, DISM, bcdedit y WinGet requieren privilegios de admin',
  viaWinget:'winget:',viaChoco:'choco:',
  uninstall:'Desinstalar',website:'Web',
};

/* ========= INIT ========= */
async function boot(){
  window.addEventListener('wails:ready',()=>{});

  try{catData=await window.go.main.App.GetCategories()}catch(e){
    document.getElementById('tweaks-grid').innerHTML='<div style="padding:20px;color:var(--rd)">Connection failed</div>';return
  }

  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',function(){switchTab(this.dataset.tab)}));
  document.getElementById('btn-restore').addEventListener('click',doRestore);
  document.getElementById('btn-install-apps').addEventListener('click',doInstall);
  document.getElementById('btn-apply-tweaks').addEventListener('click',doApply);
  document.getElementById('btn-clear').addEventListener('click',clearTerm);
  document.getElementById('btn-copy').addEventListener('click',copyTerm);
  document.querySelectorAll('.pkg-btn').forEach(b=>b.addEventListener('click',function(){pkgMgr=this.dataset.pkg;document.querySelectorAll('.pkg-btn').forEach(x=>x.classList.toggle('active',x===this));drawApps()}));
  document.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click',function(){switchLang(this.dataset.lang);document.querySelectorAll('.lang-btn').forEach(x=>x.classList.toggle('active',x===this))}));
  document.querySelector('.win-min')?.addEventListener('click',()=>window.runtime.WindowMinimise());
  document.querySelector('.win-max')?.addEventListener('click',async()=>{const m=await window.runtime.WindowIsMaximised();m?window.runtime.WindowUnmaximise():window.runtime.WindowMaximise()});
  document.querySelector('.win-close')?.addEventListener('click',()=>{try{window.runtime.Quit()}catch{try{window.runtime.WindowClose()}catch{window.go.main.App.Quit()}}});

  if(window.go?.main?.App){window.go.main.App.EventsOn('log',function(d){appendLog(d)})}
  checkAdmin();
  switchLang(lang);
  setTerm(T('idle'),'');
}

function switchLang(l){lang=l;document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));drawAll();switchTab(curTab)}

/* ========= TABS ========= */
function switchTab(tab){
  curTab=tab;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.toggle('active',c.id==='tab-'+tab));
  if(tab==='tweaks')drawTweaks();
  if(tab==='apps')drawApps();
  if(tab==='restore')drawRestore();
  refreshUI();
}

function drawAll(){drawRestore();drawApps();drawTweaks();refreshUI()}

/* ========= TAB: RESTORE ========= */
function drawRestore(){
  document.getElementById('tab-restore-label').textContent=T('tabRestore');
  document.getElementById('restore-title').textContent=T('restoreTitle');
  document.getElementById('restore-desc').textContent=T('restoreDesc');
  document.getElementById('btn-restore-text').textContent=T('restoreBtn');
  document.getElementById('rp-name').placeholder=T('rpPlaceholder');
}

async function doRestore(){
  if(busy)return;busy=true;refreshUI();
  const name=document.getElementById('rp-name').value.trim()||'CodeWinOptimizer Restore';
  setTerm(T('restoreRunning'),'running');appendLog('=== '+T('restoreRunning')+' ===');
  try{
    const r=await window.go.main.App.CreateRestorePoint(name);
    appendLog('[OK] '+T('restoreOk'));if(r)appendLog(r);
    setTerm(T('restoreOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('restoreFail')+': '+e);setTerm(T('restoreFail'),'err')}
  busy=false;refreshUI();
}

/* ========= TAB: APPS ========= */
function drawApps(){
  document.getElementById('tab-apps-label').textContent=T('tabApps');
  const cats=[...new Set(APPS.map(a=>a.cat))];
  const grid=document.getElementById('apps-grid');
  grid.innerHTML=cats.map((c,ci)=>{
    const apps=APPS.filter(a=>a.cat===c);
    return `<div class="app-cat-section">
      <div class="app-cat-title">${c}<span class="app-cat-sel-all" data-ci="${ci}">${T('selectAll')}</span><span style="font-weight:400;color:var(--tx3);margin-left:auto">${apps.length} apps</span></div>
       <div class="app-cat-grid">${apps.map(a=>{
         const sel=pickedA.has(a.id)?' selected':'';
         const chk=pickedA.has(a.id)?'checked':'';
         const pkg=pkgMgr==='winget'?a.w:a.c;
         const noPkg=!pkg;
         const label=pkg?(pkgMgr==='winget'?T('viaWinget')+' '+pkg:T('viaChoco')+' '+pkg):pkgMgr==='winget'?'No WinGet':'No Choco';
         return `<div class="app-card${sel}" data-aid="${a.id}">
          <label class="toggle"><input type="checkbox" data-aid="${a.id}" ${chk} ${noPkg?'disabled':''}><span class="toggle-slider"></span></label>
          ${a.img?`<img class="app-icon" src="${a.img}" alt="">`:`<span class="app-icon">${a.icon}</span>`}
          <div class="app-info">
            <div class="app-name">${LO(a.n)}</div>
            <div class="app-desc">${LO(a.d)}</div>
            <div class="app-source">${label}</div>
            <div class="app-actions">
              <button class="app-btn app-btn-uninstall" data-aid="${a.id}" data-action="uninstall" ${noPkg?'disabled':''}>${T('uninstall')}</button>
              <button class="app-btn app-btn-web" data-aid="${a.id}" data-action="web">${T('website')}</button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.app-card').forEach(card=>{
    card.addEventListener('click',function(e){if(e.target.tagName==='INPUT'||e.target.closest('button')||e.target.closest('label'))return;const cb=this.querySelector('input[type="checkbox"]');cb.checked=!cb.checked;cb.dispatchEvent(new Event('change'))});
  });
  grid.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change',function(e){e.stopPropagation();const id=this.dataset.aid;if(this.checked)pickedA.add(id);else pickedA.delete(id);this.closest('.app-card').classList.toggle('selected',this.checked);refreshUI()});
  });
  grid.querySelectorAll('.app-cat-sel-all').forEach(el=>{
    el.addEventListener('click',function(e){e.stopPropagation();const ci=parseInt(this.dataset.ci);const c=cats[ci];if(!c)return;const apps=APPS.filter(a=>a.cat===c);const all=apps.every(a=>pickedA.has(a.id));apps.forEach(a=>all?pickedA.delete(a.id):pickedA.add(a.id));drawApps();refreshUI()});
  });
  grid.querySelectorAll('.app-btn-uninstall').forEach(btn=>{
    btn.addEventListener('click',function(e){e.stopPropagation();doUninstall(this.dataset.aid)});
  });
  grid.querySelectorAll('.app-btn-web').forEach(btn=>{
    btn.addEventListener('click',function(e){e.stopPropagation();const app=APPS.find(a=>a.id===this.dataset.aid);if(app&&app.u)window.go.main.App.OpenURL(app.u)});
  });
}

async function doInstall(){
  if(busy||pickedA.size===0)return;busy=true;refreshUI();
  setTerm(T('installRunning'),'running');
  const ids=Array.from(pickedA).map(id=>{const a=APPS.find(x=>x.id===id);return a?(pkgMgr==='winget'?a.w:a.c):id}).filter(id=>id);
  if(ids.length===0){appendLog('[WARN] No installable apps selected for '+pkgMgr);busy=false;refreshUI();return;}
  appendLog('--- '+T('installRunning')+' ('+ids.length+' apps via '+(pkgMgr==='winget'?'WinGet':'Chocolatey')+') ---');
  try{
    const r=await window.go.main.App.InstallApps(ids,lang,pkgMgr);
    if(r)appendLog(r);
    appendLog('[OK] '+T('installOk'));setTerm(T('installOk'),'ok');
  }catch(e){appendLog('[ERR] '+T('installFail')+': '+e);setTerm(T('installFail'),'err')}
  busy=false;refreshUI();
}

async function doUninstall(appId){
  const app=APPS.find(a=>a.id===appId);if(!app)return;
  const name=LO(app.n);
  const pkg=pkgMgr==='winget'?app.w:app.c;
  if(!confirm(`Uninstall ${name} via ${pkgMgr==='winget'?'WinGet':'Chocolatey'}?`))return;
  if(busy)return;busy=true;refreshUI();
  appendLog('--- Uninstalling: '+name+' ('+pkg+') ---');
  setTerm('Uninstalling...','running');
  try{
    await window.go.main.App.UninstallApp(pkg,pkgMgr);
    appendLog('[OK] '+name+' uninstalled');setTerm('Uninstall complete','ok');
  }catch(e){appendLog('[ERR] Uninstall failed: '+e);setTerm('Uninstall failed','err')}
  busy=false;refreshUI();
}

/* ========= TAB: TWEAKS ========= */
function drawTweaks(){
  document.getElementById('tab-tweaks-label').textContent=T('tabTweaks');
  const grid=document.getElementById('tweaks-grid');
  grid.innerHTML=catData.map((c,ci)=>catCard(c,ci)).join('');
  bindTweakEv();
}

function catCard(c,ci){
  const n=LO(c.name);const w=c.tweaks.filter(t=>t.commands&&t.commands.length>0);
  return `<div class="cat-card" data-ci="${ci}">
    <div class="cat-head"><div class="cat-head-left"><span class="cat-name">${n}</span></div><div style="display:flex;align-items:center;gap:10px"><span class="cat-badge">${w.length}</span><span class="cat-arrow">▼</span></div></div>
    <div class="cat-body"><div class="cat-sel-all" data-ci="${ci}"><span>☐</span><span class="sel-lbl">${T('selectAll')}</span></div>${c.tweaks.map(t=>tweakRow(t)).join('')}</div>
  </div>`;
}

function tweakRow(t){
  const n=LO(t.name);const d=LO(t.description);const cmds=(t.commands||[]).length;
  const hasW=(t.warnings?.[lang]||t.warnings?.['en']||[]).length>0;
  const chk=pickedT.has(t.id)?'checked':'';
  return `<div class="tweak-row" data-tid="${t.id}">
    <input type="checkbox" data-tid="${t.id}" ${chk} ${cmds===0?'disabled':''}>
    <div class="tweak-inf"><div class="tweak-inf-name"><span>${n}</span>${hasW?'<span class="warn-dot">●</span>':''}</div><div class="tweak-inf-desc">${d}</div><div class="tweak-inf-meta"><span class="badge badge-${t.impact}">${t.impact}</span>${cmds>0?`<span>${cmds} ${T('cmds')}</span>`:'<span>info</span>'}</div></div>
  </div>`;
}

function bindTweakEv(){
  document.querySelectorAll('.cat-card').forEach(card=>{card.querySelector('.cat-head').addEventListener('click',function(e){if(e.target.tagName==='INPUT')return;const w=card.classList.contains('expanded');document.querySelectorAll('.cat-card').forEach(c=>c.classList.remove('expanded'));if(!w)card.classList.add('expanded')})});
  document.querySelectorAll('.cat-sel-all').forEach(el=>{el.addEventListener('click',function(e){e.stopPropagation();const ci=parseInt(this.dataset.ci);const cat=catData[ci];if(!cat)return;const tw=cat.tweaks.filter(t=>t.commands&&t.commands.length>0);const all=tw.length>0&&tw.every(t=>pickedT.has(t.id));tw.forEach(t=>all?pickedT.delete(t.id):pickedT.add(t.id));syncTweakCb(ci);refreshUI()})});
  document.querySelectorAll('.tweak-row input[type="checkbox"]').forEach(cb=>{cb.addEventListener('change',function(e){e.stopPropagation();const id=this.dataset.tid;if(this.checked)pickedT.add(id);else pickedT.delete(id);refreshUI()})});
}

function syncTweakCb(ci){
  const card=document.querySelector(`.cat-card[data-ci="${ci}"]`);if(!card)return;
  const cat=catData[ci];if(!cat)return;
  const tw=cat.tweaks.filter(t=>t.commands&&t.commands.length>0);
  const all=tw.length>0&&tw.every(t=>pickedT.has(t.id));
  const lbl=card.querySelector('.sel-lbl');const ico=card.querySelector('.cat-sel-all span:first-child');
  if(lbl)lbl.textContent=all?T('deselectAll'):T('selectAll');
  if(ico)ico.textContent=all?'☑':'☐';
  card.querySelectorAll('.tweak-row input[type="checkbox"]').forEach(cb=>{if(cb.disabled)return;cb.checked=pickedT.has(cb.dataset.tid)});
}

async function doApply(){
  if(busy||pickedT.size===0)return;busy=true;refreshUI();
  setTerm(T('tweaksRunning'),'running');
  const ids=Array.from(pickedT);
  appendLog('--- '+T('tweaksRunning')+' ('+ids.length+' tweaks) ---');
  try{const r=await window.go.main.App.RunCommands(ids,lang);if(r)appendLog(r);appendLog('[OK] '+T('tweaksDone'));setTerm(T('tweaksDone'),'ok')}catch(e){appendLog('[ERR] '+e);setTerm('Error','err')}
  busy=false;refreshUI();
}

/* ========= UI ========= */
function refreshUI(){
  document.getElementById('term-title').textContent=T('terminal');
  const ab=document.getElementById('btn-apply-tweaks'),at=document.getElementById('btn-apply-text');
  const ib=document.getElementById('btn-install-apps'),it=document.getElementById('btn-install-text');
  const rb=document.getElementById('btn-restore'),rt=document.getElementById('btn-restore-text');

  rb.disabled=busy;rt.textContent=busy?'...':T('restoreBtn');

  const tc=pickedT.size;ab.disabled=busy||tc===0;
  at.textContent=busy?'...':tc>0?T('applyCount').replace('{n}',tc):T('selectFirst');
  document.getElementById('tweaks-count-label').textContent=tc>0?T('applyCount').replace('{n}',tc):'';

  const ac=pickedA.size;ib.disabled=busy||ac===0;
  it.textContent=busy?'...':ac>0?T('installCount').replace('{n}',ac):T('installBtn');
  document.getElementById('apps-count-label').textContent=ac>0?T('installCount').replace('{n}',ac):'';

  document.querySelectorAll('.cat-card').forEach(c=>{const ci=parseInt(c.dataset.ci);if(!isNaN(ci))syncTweakCb(ci)});
}

/* ========= TERMINAL ========= */
function appendLog(m){
  const l=document.getElementById('term-log');if(!l)return;
  let c='';if(m.startsWith('[OK]'))c='log-ok';else if(m.startsWith('[ERR]'))c='log-err';else if(m.startsWith('[WARN]'))c='log-warn';else if(m.startsWith('[CMD]'))c='log-cmd';else if(m.startsWith('---'))c='log-hdr';else if(m.startsWith('==='))c='log-dim';
  const e=document.createElement('span');e.className=c;e.textContent=m+'\n';l.appendChild(e);l.scrollTop=l.scrollHeight;
}
function setTerm(t,c){const el=document.getElementById('term-status');if(el){el.textContent=t;el.className=c}}
function clearTerm(){const l=document.getElementById('term-log');if(l)l.innerHTML='';setTerm(T('idle'),'')}
async function copyTerm(){const l=document.getElementById('term-log');if(!l)return;try{await navigator.clipboard.writeText(l.textContent);setTerm('Copied!','ok');setTimeout(()=>setTerm(T('idle'),''),1500)}catch(e){setTerm('Copy failed','err')}}

async function checkAdmin(){
  try{const ok=await window.go.main.App.CheckAdmin();if(!ok){document.getElementById('warning-text').textContent=T('adminWarn');document.getElementById('admin-warning').classList.remove('hidden')}}catch(e){}
}

document.addEventListener('DOMContentLoaded',boot);
