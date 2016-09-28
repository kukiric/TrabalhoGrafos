import * as electron from "electron";
import * as grafos from "./lib/grafos";

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

    // Cria os eventos chamváveis do processo do navegador
    electron.ipcMain.on("abrir-grafo", (esseEvento, eventoRetorno) => {
        // Importa o grafo em um .XML e o envia de volta pelo evento de retorno passado como parâmetro
        let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
        if (arquivo != null) {
            let grafo = grafos.importarXML(arquivo[0]);
            esseEvento.sender.send(eventoRetorno, new grafos.GrafoAciclico(grafo));
        }
        else {
            esseEvento.sender.send(eventoRetorno, null);
        }
    });

    // Abre a página principal da aplicação
    janela.webContents.loadURL("file://" + __dirname + "/../view/index.html");
})
.on("window-all-closed", () => {
    // Finaliza a aplicação
    electron.app.quit();
});
