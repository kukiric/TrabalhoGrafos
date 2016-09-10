import electron = require("electron");
import util = require("util");
import grafos = require("./grafos");

let janela: Electron.BrowserWindow;

electron.app.on("ready", () => {
    // Cria a janela do navegador sem barra de menu
    janela = new electron.BrowserWindow({title: "Grafos", show: false});
    janela.setMenu(null);

    // Exibe a janela na primeira vez que a página terminar de carregar
    janela.webContents.on("did-finish-load", () => {
        janela.webContents.removeAllListeners("did-finish-load");
        // Abre as ferramentas de desenvolvimento em modo debug
        if (process.env.NODE_ENV === "development") {
            janela.webContents.openDevTools();
        }
        janela.maximize();
    });

    // Abre a página principal da aplicação
    janela.webContents.loadURL("file://" + __dirname + "/../view/index.html");

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
