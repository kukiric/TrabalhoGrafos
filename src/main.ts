import electron = require("electron");
import util = require("util");
import grafos = require("./grafos");

// Função principal da aplicação
electron.app.on("ready", function() {
    try {
        let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
        if (arquivo != null) {

            // Leitura do XML
            console.log("Importando XML...");
            let grafo = grafos.importarXML(arquivo[0]);
            let vertices: grafos.Vertice[];
            console.log(util.inspect(grafo, false, 4, true));

            // Busca de profundidade
            console.log("\nDFS a partir de A: ");
            vertices = grafos.buscaDFS(grafo.getVerticePorNome("A"));
            console.log(util.inspect(vertices, false, 1, true));
            console.log("Conexo: " + grafo.contemTodos(vertices));
            console.log("\nDFS a partir de C: ");
            vertices = grafos.buscaDFS(grafo.getVerticePorNome("C"));
            console.log(util.inspect(vertices, false, 1, true));
            console.log("Conexo: " + grafo.contemTodos(vertices));

            // Busca de amplitude
            console.log("\nBFS a partir de A: ");
            vertices = grafos.buscaBFS(grafo.getVerticePorNome("A"));
            console.log(util.inspect(vertices, false, 1, true));
            console.log("Conexo: " + grafo.contemTodos(vertices));
            console.log("\nBFS a partir de C: ");
            vertices = grafos.buscaBFS(grafo.getVerticePorNome("C"));
            console.log(util.inspect(vertices, false, 1, true));
            console.log("Conexo: " + grafo.contemTodos(vertices));
        }
    }
    catch (erro) {
        console.error(erro);
        electron.app.exit(1);
    }
    electron.app.exit(0);
});
