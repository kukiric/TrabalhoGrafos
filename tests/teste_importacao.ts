import util = require("util");
import grafos = require("../src/grafos");

// TODO melhorar separação dos testes

// Arquivos a serem testados
let arquivos = ["grafo1.xml", "grafo2.xml", "grafo3.xml"];

arquivos.forEach(arquivo => {
    // Leitura do XML
    console.log("\n\nImportando XML de " + arquivo);
    let grafo = grafos.importarXML(arquivo);
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
});
