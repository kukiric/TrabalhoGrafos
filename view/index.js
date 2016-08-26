const electron = require("electron");
const grafos = require("../src/grafos");
require("jquery");

const contexto = document.getElementById("grafo").getContext("2d");
let percorridos;
let grafo;

window.addEventListener("resize", event => {
    if (grafo != null) {
        desenhaGrafo(grafo);
    }
});

function atualizarBotoes() {
    $("#botao_abrir").removeClass("green").addClass("blue");
    $('#botoes').children("button").each(function() {
        $(this).prop("disabled", false);
    });
}

function abrirGrafo() {
    electron.ipcRenderer.once("set-grafo", (evento, grafoAciclico) => {
        if (grafoAciclico != null) {
            percorridos = [];
            grafoAciclico.toGrafo = grafos.GrafoAciclico.prototype.toGrafo;
            grafo = grafoAciclico.toGrafo();
            desenhaGrafo(grafo);
            atualizarBotoes();
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
    percorridos = resultado.visitados.map((vertice) => vertice.nome);    
    alert("Vértices percorridos a partir de " + verticeInicial + ": [" + percorridos.join(", ") + "]\nVértice " + verticeFinal + " encontrado: " + (resultado.encontrado ? "Sim" : "Não"));
    desenhaGrafo(grafo);
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

// Função adaptada do StackOverflow
// Usuário: http://stackoverflow.com/users/796329/titus-cieslewski
// Postagem: http://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag/6333775#6333775
function canvas_arrow(context, fromx, fromy, tox, toy){
    const headlen = 10; // length of head in pixels
    const arrowangle = 6; // 360 degrees divided by this = actual angle
    const angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/arrowangle),toy-headlen*Math.sin(angle-Math.PI/arrowangle));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/arrowangle),toy-headlen*Math.sin(angle+Math.PI/arrowangle));
}

function desenhaGrafo(grafo) {
    const raio = 16;
    contexto.canvas.width = contexto.canvas.scrollWidth;
    contexto.canvas.height = contexto.canvas.scrollHeight;
    contexto.clearRect(0, 0, contexto.canvas.width, contexto.canvas.height);
    // Calcula o centro do canvas e do grafo
    let centroCanvas = {x: contexto.canvas.width / 2, y: contexto.canvas.height / 2};
    let centroGrafo = centro(grafo.vertices, (v) => v.posicao.x, (v) => v.posicao.y);
    // Funções de desenho no canvas
    function drawVertice(vertice) {
        let x = centroCanvas.x + vertice.posicao.x - centroGrafo.x;
        let y = centroCanvas.y + vertice.posicao.y - centroGrafo.y;
        contexto.beginPath();
        contexto.lineWidth = 4;
        contexto.strokeStyle = "black";
        contexto.arc(x, y, raio, 0, 2*Math.PI);
        contexto.stroke();
        // Pinta os vértices percorridos
        if (percorridos.find(nomeVertice => nomeVertice == vertice.nome)) {
            contexto.fillStyle = "lightblue";
        }
        else {
            contexto.fillStyle = "lightgray";
        }
        contexto.arc(x, y, raio, 0, 2*Math.PI);
        contexto.fill();
        contexto.fillStyle = "black";
        contexto.textAlign = "center";
        contexto.font = "12px sans-serif";
        contexto.fillText(vertice.nome, x, y + 4);
    }
    function drawArco(v1, v2) {
        let x1 = centroCanvas.x + v1.posicao.x - centroGrafo.x;
        let y1 = centroCanvas.y + v1.posicao.y - centroGrafo.y;
        let x2 = centroCanvas.x + v2.posicao.x - centroGrafo.x;
        let y2 = centroCanvas.y + v2.posicao.y - centroGrafo.y;
        // Move os finais das arestas para uma de quatro posições do círculo
        if (x1 - raio > x2) {
            //x1 -= raio;
            x2 += raio;
        }
        else if (x1 + raio < x2) {
            //x1 += raio;
            x2 -= raio;
        }
        if (y1 - raio > y2) {
            //y1 -= raio;
            y2 += raio;
        }
        else if (y1 + raio < y2) {
            //y1 += raio;
            y2 -= raio;
        }
        let angulo = Math.atan2(y2 - y1, x2 - x1);
        x2 += Math.cos(angulo) * Math.PI / raio;
        y2 += Math.sin(angulo) * Math.PI / raio;
        contexto.strokeStyle = "black";
        contexto.beginPath();
        contexto.lineWidth = 2;
        contexto.moveTo(x1, y1);
        contexto.lineTo(x2, y2);
        canvas_arrow(contexto, x1, y1, x2, y2);
        contexto.stroke();
    }
    // Desenha os arcos primeiro
    grafo.vertices.forEach(vertice => {
        vertice.adjacentes.forEach((outro) => {
            drawArco(vertice, outro);
        });
    });
    // E depois os vértices por cima
    grafo.vertices.forEach(vertice => {
        drawVertice(vertice);
    });
}
