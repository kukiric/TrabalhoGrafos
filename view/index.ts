// Estilos extras
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "materialize-css/dist/css/materialize.css";

// Bibliotecas
import "script!jquery";
import "materialize-css";
import {desenhaGrafo} from "../src/lib/drawing";
import {
    Arco,
    Vertice,
    Grafo,
    Conectividade,
    GrafoAciclico,
    FuncaoBusca,
    ResultadoBusca,
    buscaBFS,
    buscaDFS,
    buscaDijkstra,
    buscaPCV,
    buscaAStar,
    importarXML
}
from "../src/lib/grafos";

// Variáveis globais
const contexto = (document.getElementById("grafo") as HTMLCanvasElement).getContext("2d");
let buscaCompleta = false;
let buscaTerminada = false;
let distancias: number[];
let frameBusca: ResultadoBusca;
let busca: Iterator<ResultadoBusca>;
let cores: Map<Vertice, number>;
let grafo: Grafo;

// Eventos do HTML
$(window).on("resize", () => {
    desenhaGrafo(contexto, grafo, frameBusca, buscaCompleta, cores);
});

$("#input_grafo").on("change", () => {
    let input = $("#input_grafo").get(0) as HTMLInputElement;
    let arquivo = input.files[0];
    if (arquivo != null) {
        let grafoAntigo = grafo;
        // Limpa o canvas e bloqueia os botões
        grafo = null;
        limparBusca();
        grafoCarregado();
        // Usa o grafo novo se o carregamento completar com sucesso
        importarXML(arquivo, (grafoNovo: Grafo) => {
            if (grafoNovo) {
                grafo = grafoNovo;
            }
            else {
                grafo = grafoAntigo;
            }
            grafoCarregado();
        });
    }
});

$("#botao_limpar").on("click", () => {
    limparBusca();
});

$("#botao_info").on("click", () => {
    if (frameBusca) {
        $("#modal_caminho").openModal();
    }
});

$("#botao_dfs").on("click", () => {
    buscar(buscaDFS);
});

$("#botao_bfs").on("click", () => {
    buscar(buscaBFS);
});

$("#botao_dijkstra").on("click", () => {
    buscar(buscaDijkstra);
});

$("#botao_pcv").on("click", () => {
    buscar(buscaPCV, true);
});

$("#botao_astar").on("click", () => {
    buscar(buscaAStar);
});

$("#botao_next").on("click", () => {
    buscaNext();
});

$("#botao_skip").on("click", () => {
    while (!buscaNext()) {
        continue;
    }
});

$("#botao_coloracao").on("click", () => {
    limparBusca();
    $("#botao_limpar").removeClass("disabled").addClass("waves-effect");
    cores = grafo.geraColoracao();
    desenhaGrafo(contexto, grafo, frameBusca, buscaCompleta, cores);
    let maiorCor = 0;
    for (let cor of cores.values()) {
        if (1 + cor > maiorCor) {
            maiorCor = cor;
        }
    }
    // Converte o número da maior cor (indexado de zero) para um valor
    // de contagem incrementando o valor (assim, a primeira cor é 1,
    // para uma cor, segunda é 2, para duas cors, etc)
    $("#grafo_cores").text(maiorCor + 1);
});

function grafoCarregado() {
    // Preenche as opções da busca
    let selects = $("#grafo_v1, #grafo_v2");
    selects.empty();
    if (grafo != null) {
        $("#grafo_v2").append($("<option></option>").attr("value", "null").text("Indefinido"));
        grafo.vertices.forEach(vertice => {
            selects.append($("<option></option").attr("value", vertice.nome).text(vertice.nome));
        });
        // Pré-seleciona o vértice inicial e o final se aplicável
        if (grafo.inicial) {
            $("#grafo_v1").val(grafo.inicial.nome).change();
        }
        if (grafo.final) {
            $("#grafo_v2").val(grafo.final.nome).change();
        }
    }
    let isConexo = grafo != null && grafo.isConexo();
    // Ativa os botões do menu
    $("#botao_dfs, #botao_bfs, #botao_coloracao, #grafo_v1, #grafo_v2").each(function() {
        $(this).prop("disabled", grafo == null);
    });
    $("#botao_dijkstra").prop("disabled", grafo == null || !grafo.ponderado);
    $("#botao_pcv").prop("disabled", grafo == null || !isConexo || grafo.dirigido || !grafo.ponderado);
    $("#botao_astar").prop("disabled", grafo == null || !grafo.mapa);
    $("#botao_next, #botao_skip").prop("disabled", true);
    selects.material_select();
    // Preenche as informações do grafo
    if (grafo != null) {
        $("#grafo_vertices").text(grafo.vertices.length);
        $("#grafo_arcos").text(grafo.getNumArestas());
        $("#grafo_direcionado").text(grafo.dirigido ? "Sim" : "Não");
        $("#grafo_ponderado").text(grafo.ponderado ? "Sim" : "Não");
        $("#grafo_mapa").text(grafo.mapa ? "Sim" : "Não");
        $("#grafo_conexo").text(isConexo ? "Sim" : "Não");
        $("#grafo_cores").text("?");
    }
    desenhaGrafo(contexto, grafo, frameBusca, buscaCompleta, cores);
}

function buscaNext() {
    let iteracao = busca.next();
    if (iteracao.value != null) {
        frameBusca = iteracao.value;
        desenhaGrafo(contexto, grafo, frameBusca, buscaCompleta, cores);
        if (frameBusca.detalhes != null) {
            if (typeof (frameBusca.detalhes) === "string") {
                $("#busca_detalhes").text(frameBusca.detalhes);
            }
            else {
                let props = "Propriedades de " + frameBusca.checado.nome + ": { ";
                let first = true;
                for (let key in frameBusca.detalhes) {
                    if (!first) {
                        props += ", ";
                    }
                    else {
                        first = false;
                    }
                    let value = frameBusca.detalhes[key];
                    if (typeof value === "number") {
                        value = value.toFixed(2);
                    }
                    else {
                        value = value.toString();
                    }
                    props += key + " = " + value;
                }
                props += " }";
                $("#busca_detalhes").text(props);
            }
        }
        else {
            $("#busca_detalhes").text("");
        }
    }
    if (iteracao.done) {
        $("#botao_next").prop("disabled", true);
        $("#botao_skip").prop("disabled", true);
        $("#busca_detalhes").text("Busca finalizada");
        grafo.arcosAdicionais = new Array();
        buscaTerminada = true;
        desenhaGrafo(contexto, grafo, frameBusca, buscaCompleta, cores);
        atualizarModalBusca();
        return true;
    }
    return false;
}

function chamarBusca(verticeInicial: string, verticeFinal: string, algoritmo: FuncaoBusca) {
    let v1 = grafo.getVerticePorNome(verticeInicial);
    let v2 = grafo.getVerticePorNome(verticeFinal);
    cores = null;
    distancias = null;
    buscaCompleta = false;
    busca = algoritmo(v1, v2);
    $("#botao_next").prop("disabled", false);
    $("#botao_skip").prop("disabled", false);
    buscaNext();
}

function chamarBuscaCompleta(verticeInicial: string, algoritmo: FuncaoBusca) {
    let v1 = grafo.getVerticePorNome(verticeInicial);
    limparBusca();
    let conexo = true;
    buscaCompleta = true;
    frameBusca = new ResultadoBusca(v1, null, new Array<Vertice>(), new Array<Vertice>(), false, new Array<number>(), "");
    // Percorre o grafo até todos os vértices terem sidos visistados, até os não conexos
    while (true) {
        frameBusca.visitados.push(v1);
        busca = algoritmo(v1, null, frameBusca.visitados);
        buscaNext();
        // Só adiciona distâncias finitas enquanto a busca for conexa
        if (conexo) {
            frameBusca.distancias = frameBusca.distancias.concat(frameBusca.distancias);
        }
        else {
            frameBusca.distancias = frameBusca.distancias.concat(frameBusca.distancias.map(d => -1));
        }
        // Busca o próximo vértice não visitado
        let completo = grafo.vertices.every(vertice => {
            if (frameBusca.visitados.find(visistado => vertice.equals(visistado))) {
                return true;
            }
            else {
                v1 = vertice;
                conexo = false;
                return false;
            }
        });
        // Termina o loop quando não houver mais nehnum vértice sobrando
        if (completo) {
            break;
        }
    }
}

function buscar(algoritmo: FuncaoBusca, isCaxeiroViajante: boolean = false) {
    if (grafo != null) {
        grafo.arcosAdicionais = new Array<Arco>();
        let v1 = $("#grafo_v1").val();
        let v2 = $("#grafo_v2").val();
        // Não alterar, o valor do null é representado em string no HTML
        if (isCaxeiroViajante || v2 !== "null") {
            chamarBusca(v1, v2, algoritmo);
        }
        else {
            chamarBuscaCompleta(v1, algoritmo);
        }
        if (frameBusca) {
            $("#botao_limpar").removeClass("disabled").addClass("waves-effect");
            $("#botao_info").removeClass("disabled").addClass("waves-effect");
        }
        desenhaGrafo(contexto, grafo, frameBusca, buscaCompleta, cores);
    }
}

function limparBusca() {
    cores = null;
    frameBusca = null;
    distancias = null;
    buscaCompleta = false;
    if (grafo != null) {
        grafo.arcosAdicionais = new Array();
    }
    $("#botao_next, #botao_skip").prop("disabled", true);
    $("#botao_limpar").addClass("disabled").removeClass("waves-effect");
    $("#botao_info").addClass("disabled").removeClass("waves-effect");
    $("#busca_detalhes").text("");
    desenhaGrafo(contexto, grafo, frameBusca, buscaCompleta, cores);
}

function atualizarModalBusca() {
    if (frameBusca) {
        let contemDistancias = frameBusca.distancias.length > 0 && frameBusca.distancias[0] >= 0;
        $("#busca_nome").text(frameBusca.nome);
        $("#busca_v1").text(frameBusca.inicial.nome);
        $("#busca_v2").text(frameBusca.procurado ? frameBusca.procurado.nome : "Todos");
        let visitados = contemDistancias
            ? frameBusca.visitados.map((v, i) => `${v.nome} (${frameBusca.distancias[i] >= 0 ? frameBusca.distancias[i] : "∞"})`)
            : frameBusca.visitados.map(v => v.nome);
        $("#busca_visitados").text(visitados.join(" > "));
        $("#busca_caminho").text(frameBusca.caminho.length > 0 ? frameBusca.caminho.map(v => v.nome).join(" > ") : "Nenhum");
        let distanciaFinal = frameBusca.encontrado ? frameBusca.distancias[frameBusca.visitados.findIndex(e => e.equals(frameBusca.procurado))] : "-1";
        $("#busca_custo").text(buscaCompleta || !contemDistancias ? "" : "Custo para o destino: " + (distanciaFinal >= 0 ? distanciaFinal.toString() : "∞"));
        $("#modal_caminho").openModal();
    }
}

grafoCarregado();

// Esconde a tela de carregamento
$("#loader").addClass("hidden");
