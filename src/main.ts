import electron = require("electron");
import util = require("util");
import grafos = require("./grafos");

let janela: Electron.BrowserWindow;

electron.app.on("ready", () => {
    // Abre a janela
    janela = new electron.BrowserWindow({title: "Grafos"});
    janela.setMenu(null);
    janela.maximize();
    janela.loadURL("file://" + __dirname + "/../view/index.html");
    if (process.env.NODE_ENV === "development") {
        janela.webContents.openDevTools();
    }

    // Adiciona os eventos
    electron.ipcMain.on("dev-tools", () => {
        const contents = janela.webContents;
        if (contents.isDevToolsOpened()) {
            contents.closeDevTools();
        }
        else {
            contents.openDevTools();
        }
    })
    // Importa um grafo de .xml e envia de volta pelo evento de retorno passado como parâmetro
    .on("abrir-grafo", (evento, retorno) => {
        let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
        if (arquivo != null) {
            let grafo = grafos.importarXML(arquivo[0]);
            evento.sender.send(retorno, new grafos.GrafoAciclico(grafo));
        }
        else {
            evento.sender.send(retorno, null);
        }
    });
})
.on("window-all-closed", () => {
    // Finaliza a aplicação
    electron.app.quit();
});
