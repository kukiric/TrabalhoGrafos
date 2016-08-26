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

function busca(verticeInicial, verticeFinal, algoritmo) {
    verticeInicial = verticeInicial.trim().toUpperCase();
    verticeFinal = verticeFinal.trim().toUpperCase();
    let v1 = grafo.getVerticePorNome(verticeInicial);
    let v2 = grafo.getVerticePorNome(verticeFinal);
    if (v1 == null && v2 == null) {
        alert("Os vértices " + verticeInicial + " e " + verticeFinal + " não existem no grafo!");
        return;
    }
    if (v1 == null) {
        alert("O vértice " + verticeInicial + " não existe no grafo!");
        return;
    }
    if (v2 == null) {
        alert("O vértice " + verticeFinal + " não existe no grafo!");
        return;
    }
    console.warn("A busca será realizadas no processo do navegador");
    let resultado = algoritmo(v1, v2);
    let lista = resultado.visitados.map((vertice) => vertice.nome).join(", ");
    alert("Vértices percorridos a partir de " + verticeInicial + ": [" + lista + "]\nVértice " + verticeFinal + " encontrado: " + (resultado.encontrado ? "Sim" : "Não"));
}

function fazerDFS() {
    if (grafo != null) {
        busca(document.getElementById("grafo_v1").value, document.getElementById("grafo_v2").value, grafos.buscaDFS);
    }
}

function fazerBFS() {
    if (grafo != null) {
        busca(document.getElementById("grafo_v1").value, document.getElementById("grafo_v2").value, grafos.buscaBFS);
    }
}

function testeIsConexo() {
    if (grafo != null) {
        if (grafo.isConexo()) {
            alert("Conexo: Sim");
        }
        else {
            alert("Conexo: Não");
        }
    }
}

function centro(elementos, getx, gety) {
    let minX = getx(elementos[0]), minY = gety(elementos[0]);
    let maxX = minX, maxY = minY;
    elementos.slice(1).forEach(elemento => {
        let x = getx(elemento), y = gety(elemento);
        if (x < minX) {
            minX = x;
        }
        if (x > maxX) {
            maxX = x;
        }
        if (y < minY) {
            minY = y;
        }
        if (y > maxY) {
            maxY = y;
        }
    });
    return {x: (minX + maxX) / 2, y: (minY + maxY) / 2};
}

function desenhaGrafo(grafo) {
    contexto.canvas.width = contexto.canvas.scrollWidth;
    contexto.canvas.height = contexto.canvas.scrollHeight;
    contexto.clearRect(0, 0, contexto.canvas.width, contexto.canvas.height);
    // Calcula o centro do canvas e do grafo
    let centroCanvas = {x: contexto.canvas.width / 2, y: contexto.canvas.height / 2};
    let centroGrafo = centro(grafo.vertices, (v) => v.posicao.x, (v) => v.posicao.y);
    // Funções de desenho no canvas
    function drawVertice(pos, nome) {
        let x = centroCanvas.x + pos.x - centroGrafo.x;
        let y = centroCanvas.y + pos.y - centroGrafo.y;
        contexto.beginPath();
        contexto.lineWidth = 4;
        contexto.arc(x, y, 16, 0, 2*Math.PI);
        contexto.stroke();
        contexto.fillStyle = "yellow";
        contexto.arc(x, y, 16, 0, 2*Math.PI);
        contexto.fill();
        contexto.fillStyle = "black";
        contexto.textAlign = "center";
        contexto.font = "12px sans-serif";
        contexto.fillText(nome, x, y + 4);
    }
    function drawArco(pos1, pos2) {
        let x1 = centroCanvas.x + pos1.x - centroGrafo.x;
        let y1 = centroCanvas.y + pos1.y - centroGrafo.y;
        let x2 = centroCanvas.x + pos2.x - centroGrafo.x;
        let y2 = centroCanvas.y + pos2.y - centroGrafo.y;
        contexto.beginPath();
        contexto.lineWidth = 2;
        contexto.moveTo(x1, y1);
        contexto.lineTo(x2, y2);
        contexto.stroke();
    }
    // Desenha os arcos primeiro
    grafo.vertices.forEach(vertice => {
        vertice.adjacentes.forEach((outro) => {
            drawArco(vertice.posicao, outro.posicao);
        });
    });
    // E depois os vértices por cima
    grafo.vertices.forEach(vertice => {
        drawVertice(vertice.posicao, vertice.nome);
    });
    // TODO desenhar as setas dos arcos
}
