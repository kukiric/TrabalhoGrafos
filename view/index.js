const electron = require("electron");
const grafos = require("../src/grafos");
require("jquery");

const contexto = document.getElementById("grafo").getContext("2d");
let encontrado = false;
let percorridos;
let caminho;
let grafo;

window.addEventListener("resize", event => {
    if (grafo != null) {
        desenhaGrafo(grafo);
    }
});

function grafoSelecionado(grafo) {
    let select = $("#botoes select");
    select.empty();
    if (grafo != null) {
        $("#grafo_v2").append($("<option></option>").attr("value", "null").text("Indefinido"));
        grafo.vertices.forEach(vertice => {
            select.append($("<option></option").attr("value", vertice.nome).text(vertice.nome));
        });
    }
    $("#botao_dfs, #botao_bfs, #botao_conexo, #grafo_v1, #grafo_v2").each(function() {
        $(this).prop("disabled", grafo == null);
    });
    select.material_select();
}
grafoSelecionado(null);

function abrirGrafo() {
    electron.ipcRenderer.once("set-grafo", (evento, grafoAciclico) => {
        if (grafoAciclico != null) {
            percorridos = [];
            grafoAciclico.toGrafo = grafos.GrafoAciclico.prototype.toGrafo;
            grafo = grafoAciclico.toGrafo();
            encontrado = false;
            grafoSelecionado(grafo);
            desenhaGrafo(grafo);
        }
    });
    electron.ipcRenderer.send("abrir-grafo", "set-grafo");
}

function devTools() {
    electron.remote.getCurrentWebContents().toggleDevTools();
}

function chamarBusca(verticeInicial, verticeFinal, algoritmo) {
    let v1 = grafo.getVerticePorNome(verticeInicial);
    let v2 = grafo.getVerticePorNome(verticeFinal);
    if (v1 == null) {
        alert("O vértice " + verticeInicial + " não existe no grafo!");
        return;
    }
    if (v2 == null) {
        alert("O vértice " + verticeFinal + " não existe no grafo!");
        return;
    }
    let resultado = algoritmo(v1, v2);
    percorridos = resultado.visitados.map(vertice => vertice.nome);
    encontrado = resultado.encontrado;
    caminho = resultado.caminho;
    alert("Vértices percorridos a partir de " + verticeInicial + ": [" + percorridos.join(", ") + "]\nVértice " + verticeFinal + " encontrado: " + (encontrado ? "Sim" : "Não"));
    desenhaGrafo(grafo);
}

function chamarBuscaCompleta(verticeInicial, algoritmo) {
    let v1 = grafo.getVerticePorNome(verticeInicial);
    if (v1 == null) {
        alert("O vértice " + verticeInicial + " não existe no grafo!");
        return;
    }
    let visitados = [];
    // Percorre o grafo até todos os vértices terem sidos visistados, até os não conexos
    while (true) {
        visitados.push(v1);
        let resultado = algoritmo(v1, null, visitados);
        visistados = visitados.concat(resultado.visistados); 
        // Busca o próximo vértice não visitado
        let completo = grafo.vertices.every(vertice => {
            if (visistados.find(visistado => vertice.equals(visistado))) {
                return true;
            }
            else {
                v1 = vertice;
                return false;
            }
        });
        // Termina o loop quando não houver mais nehnum vértice sobrando
        if (completo) {
            break;
        }
    }
    percorridos = visitados.map(vertice => vertice.nome);
    encontrado = false;
    alert("Vértices percorridos a partir de " + verticeInicial + " (busca completa): [" + percorridos.join(", ") + "]");
    desenhaGrafo(grafo);
}

function buscar(algoritmo) {
    if (grafo != null) {
        let v1 = document.getElementById("grafo_v1").value;
        let v2 = document.getElementById("grafo_v2").value;
        // Não alterar, o valor do null é representado em string no DOM
        if (v2 !== "null") {
            chamarBusca(v1, v2, algoritmo);
        }
        else {
            chamarBuscaCompleta(v1, algoritmo);
        }
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
        minX = Math.min(x, minX);
        maxX = Math.max(x, maxX);
        minY = Math.min(y, minY);
        maxY = Math.max(y, maxY);
    });
    return {x: (minX + maxX) / 2, y: (minY + maxY) / 2};
}

// Função adaptada do StackOverflow
// Usuário: http://stackoverflow.com/users/796329/titus-cieslewski
// Postagem: http://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag/6333775#6333775
function canvas_arrow(context, fromx, fromy, tox, toy) {
    const headlen = 10; // length of head in pixels
    const arrowangle = 6; // 360 degrees divided by this = actual angle
    const angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/arrowangle),toy-headlen*Math.sin(angle-Math.PI/arrowangle));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/arrowangle),toy-headlen*Math.sin(angle+Math.PI/arrowangle));
}

function noCaminho(caminho, v1, v2) {
    // Retorna se o v2 encontra-se após o v1 no caminho
    return caminho.slice(0, caminho.length - 1).find((v, indice) => v.equals(v1) && v2.equals(caminho[indice+1])) != null;
}

function desenhaGrafo(grafo) {
    const raioVertice = 16;
    const larguraLinha = 2;
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
        contexto.lineWidth = larguraLinha * 2;
        contexto.strokeStyle = "black";
        contexto.arc(x, y, raioVertice, 0, 2*Math.PI);
        contexto.stroke();
        // Pinta os vértices percorridos
        if (percorridos.find(nomeVertice => nomeVertice == vertice.nome)) {
            contexto.fillStyle = "lightblue";
        }
        else {
            contexto.fillStyle = "lightgray";
        }
        contexto.arc(x, y, raioVertice, 0, 2*Math.PI);
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
        let angulo = Math.atan2(y2 - y1, x2 - x1);
        // Desloca o início e o fim da linha até os raios dos vértices
        let distancia = raioVertice + larguraLinha; 
        x1 += distancia * Math.cos(angulo);
        y1 += distancia * Math.sin(angulo);
        x2 -= distancia * Math.cos(angulo);
        y2 -= distancia * Math.sin(angulo);
        if (encontrado && noCaminho(caminho, v1, v2)) {
            contexto.strokeStyle = "red";
        }
        else {
            contexto.strokeStyle = "black";
        }
        contexto.beginPath();
        contexto.lineWidth = larguraLinha;
        contexto.moveTo(x1, y1);
        contexto.lineTo(x2, y2);
        // Desenha seta somente se o grafo for direcionado
        if (grafo.dirigido) {
            canvas_arrow(contexto, x1, y1, x2, y2);
        }
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
