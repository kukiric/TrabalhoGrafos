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
    // Abre um arquivo e retorna o caminho
    .on("abrir", (event) => {
        let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
        if(arquivo != null) {
            event.returnValue = arquivo[0];
        }
        else {
            event.returnValue = null;
        }
    })
    // Abre o grafo e testa a estrutura
    .on("abrir-grafo", () => {
        try {
            let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
            if (arquivo != null) {
                // Leitura do XML
                console.log("Importando XML de " + arquivo);
                let grafo = grafos.importarXML(arquivo[0]);
                let vertices: grafos.Vertice[];
                console.log(util.inspect(grafo, false, 4, true));

                // Busca de profundidade
                console.log("\nDFS a partir de A: ");
                vertices = grafos.buscaDFS(grafo.getVerticePorNome("A"));
                console.log(util.inspect(vertices, false, 1, true));
                console.log("\nDFS a partir de C: ");
                vertices = grafos.buscaDFS(grafo.getVerticePorNome("C"));
                console.log(util.inspect(vertices, false, 1, true));

                // Busca de amplitude
                console.log("\nBFS a partir de A: ");
                vertices = grafos.buscaBFS(grafo.getVerticePorNome("A"));
                console.log(util.inspect(vertices, false, 1, true));
                console.log("\nBFS a partir de C: ");
                vertices = grafos.buscaBFS(grafo.getVerticePorNome("C"));
                console.log(util.inspect(vertices, false, 1, true));

                // Testa se o grafo é conexo
                console.log("\nGrafo conexo: " + grafo.isConexo());
            }
        }
        catch (erro) {
            console.error(erro);
            electron.app.exit(1);
        }
    });
})
// Finaliza a aplicação
.on("window-all-closed", () => {
    electron.app.quit();
});
