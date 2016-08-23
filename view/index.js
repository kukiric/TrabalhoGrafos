const electron = require("electron");

function abrirGrafo() {
    electron.ipcRenderer.send('abrir-grafo');
}

function devTools() {
    electron.ipcRenderer.send('dev-tools');
}
