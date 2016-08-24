const electron = require("electron");
const grafos = require("../src/grafos");

const contexto = document.getElementById("grafo").getContext("2d");
let grafo;

window.addEventListener("resize", (event) => {
    if (grafo != null) {
        desenhaGrafo(grafo);
    }
});

function abrirGrafo() {
    electron.ipcRenderer.once("set-grafo", (evento, grafoAciclico) => {
        if (grafoAciclico != null) {
            grafoAciclico.toGrafo = grafos.GrafoAciclico.prototype.toGrafo;
            grafo = grafoAciclico.toGrafo();
            desenhaGrafo(grafo);
        }
    });
    electron.ipcRenderer.send("abrir-grafo", "set-grafo");
}

function devTools() {
    electron.ipcRenderer.send('dev-tools');
}

function DFS() {
    if (grafo != null) {
        let v1 = grafo.getVerticePorNome("A");
        let encontrados = grafos.buscaDFS(v1);
        let lista = encontrados.map((vertice) => vertice.nome).join(", ");
        alert("Vértices encontrados a partir de A: [" + lista + "]");
    }
}

function desenhaGrafo(grafo) {
    contexto.canvas.width = contexto.canvas.scrollWidth;
    contexto.canvas.height = contexto.canvas.scrollHeight;
    contexto.clearRect(0, 0, contexto.canvas.width, contexto.canvas.height);
    function drawVertice(pos, nome) {
        contexto.beginPath();
        contexto.lineWidth = 4;
        contexto.arc(pos.x, pos.y, 16, 0, 2*Math.PI);
        contexto.stroke();
        contexto.fillStyle = "yellow";
        contexto.arc(pos.x, pos.y, 16, 0, 2*Math.PI);
        contexto.fill();
        contexto.fillStyle = "black";
        contexto.textAlign = "center";
        contexto.font = "12px sans-serif";
        contexto.fillText(nome, pos.x, pos.y + 4);
    }
    function drawArco(pos1, pos2) {
        contexto.beginPath();
        contexto.lineWidth = 2;
        contexto.moveTo(pos1.x, pos1.y);
        contexto.lineTo(pos2.x, pos2.y);
        contexto.stroke();
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
