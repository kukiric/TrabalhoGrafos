const electron = require("electron");
const grafos = require("../src/grafos");

const canvas = document.getElementById("grafo").getContext("2d");

function abrirGrafo() {
    electron.ipcRenderer.once("set-grafo", (evento, grafoAciclico) => {
        if (grafoAciclico != null) {
            grafoAciclico.toGrafo = grafos.GrafoAciclico.prototype.toGrafo;
            desenhaGrafo(grafoAciclico.toGrafo());
        }
    });
    electron.ipcRenderer.send("abrir-grafo", "set-grafo");
}

function devTools() {
    electron.ipcRenderer.send('dev-tools');
}

function desenhaGrafo(grafo) {
    canvas.clearRect(0, 0, 1024, 768);
    function drawVertice(pos, nome) {
        canvas.beginPath();
        canvas.lineWidth = 4;
        canvas.arc(pos.x, pos.y, 16, 0, 2*Math.PI);
        canvas.stroke();
        canvas.fillStyle = "yellow";
        canvas.arc(pos.x, pos.y, 16, 0, 2*Math.PI);
        canvas.fill();
        canvas.fillStyle = "black";
        canvas.textAlign = "center";
        canvas.font = "12px sans-serif";
        canvas.fillText(nome, pos.x, pos.y + 4);
    }
    function drawArco(pos1, pos2) {
        canvas.beginPath();
        canvas.lineWidth = 2;
        canvas.moveTo(pos1.x, pos1.y);
        canvas.lineTo(pos2.x, pos2.y);
        canvas.stroke();
    }
    // Desenha os arcos primeiro
    grafo.vertices.forEach((vertice) => {
        vertice.adjacentes.forEach((outro) => {
            drawArco(vertice.posicao, outro.posicao);
        });
    });
    // E depois os vértices por cima
    grafo.vertices.forEach((vertice) => {
        drawVertice(vertice.posicao, vertice.nome);
    });
    // TODO desnhar as setas dos arcos
}
