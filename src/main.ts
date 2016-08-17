import xml2js = require("xml2js");

class Arco {
    public id: Number;
    public nos: No[];
}

class No {
    public id: Number;
    public nome: String;
    public arcos: Arco[];
}

class Grafo {
    public nos: No[];
    public arcos: Arco[];
}

console.log("Importando XML...");
xml2js.parseString("<elemento><valor>1.5</valor><valor>2.3</valor></elemento>", function(err, result) {
    console.log("Imprimindo:");
    console.log(result);
    console.log(result.elemento.valor);
});
