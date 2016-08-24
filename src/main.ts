import electron = require("electron");
import util = require("util");
import grafos = require("./grafos");

let janela: Electron.BrowserWindow;

electron.app.on("ready", () => {
    // Abre a janela
    janela = new electron.BrowserWindow();
    janela.setMenu(null);
    janela.maximize();
    janela.loadURL("file://" + __dirname + "/../view/index.html");

    // Adiciona os eventos
    electron.ipcMain.on("dev-tools", () => {
        const contents = janela.webContents;
        if (contents.isDevToolsOpened()) {
            contents.closeDevTools();
        }
        else {
            contents.openDevTools({mode: "right"});
        }
    })
    // Importa um grafo de .xml e envia de volta pelo evento de retorno passado como parâmetro
    .on("abrir-grafo", (evento, retorno) => {
        let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
        if (arquivo != null) {
            let grafo = grafos.importarXML(arquivo[0]);
            evento.sender.send(retorno, grafo.exportarMatriz());
        }
        else {
            evento.sender.send(retorno, null);
        }
    });
})
// Finaliza a aplicação
.on("window-all-closed", () => {
    electron.app.quit();
});
