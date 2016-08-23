const electron = require("electron");
const grafos = require("../src/grafos");

const canvas = document.getElementById("grafo").getContext("2d");
var grafo;

function abrirGrafo() {
    let arquivo = electron.ipcRenderer.sendSync("abrir");
    if (arquivo != null) {
        grafo = grafos.importarXML(arquivo);
    }
    desenhaGrafo();
}

function devTools() {
    electron.ipcRenderer.send('dev-tools');
}

function desenhaGrafo() {
    canvas.clearRect(0, 0, 1024, 768);
    function circulo(x, y) {
        canvas.beginPath();
        canvas.lineWidth = 4;
        canvas.arc(x, y, 16, 0, 2*Math.PI);
        canvas.stroke();
        canvas.fillStyle = "yellow";
        canvas.arc(x, y, 16, 0, 2*Math.PI);
        canvas.fill();
    }
    function texto(x, y, texto) {
        canvas.fillStyle = "black";
        canvas.textAlign = "center";
        canvas.font = "12px sans-serif";
        canvas.fillText(texto, x, y + 4);
    }
    grafo.vertices.forEach((vertice) => {
        var x = vertice.posicao.x;
        var y = vertice.posicao.y;
        circulo(x, y);
        texto(x, y, vertice.nome);
    });
}
