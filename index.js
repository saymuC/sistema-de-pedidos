import inquirer  from "inquirer";
import chalk from "chalk";
import readline from "readline-sync";
import sqlite3 from 'sqlite3';
import { open } from "sqlite";
//funções
import { inserirClientes } from "./utils/inserirClientes.js";
import { inserirProdutos } from "./utils/inserirProdutos.js";
import { fazerPedido } from "./utils/fazerPedido.js";
import { detlhesPedidos } from "./utils/detalhesPedido.js";

const db = await open({
    filename: './banco.db',
    driver: sqlite3.Database,
});

async function criarTabelas() {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE,
        telefone TEXT
      );
  
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        estoque INTEGER NOT NULL
      );
  
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      );
  
      CREATE TABLE IF NOT EXISTS itens_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      );
    `);
  };

await criarTabelas();
const dbClientes = await db.all('SELECT * FROM clientes');
const dbProdutos = await db.all('SELECT * FROM produtos');
const dbPedidos = await db.all(`SELECT * FROM pedidos`);

const MENU = [
    'Cadastrar Cliente',
    'Cadastrar produto',
    'Fazer pedido',
    'Listar clientes',
    'Listar produtos',
    'listar pedidos feitos',
    'ver detalhes de um pedido',
    'Sair'
];

export function Menus() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'menu',
            message: 'Escolha uma opção:',
            choices: MENU,
        },
    ]).then((resposta) => {
        switch (resposta.menu) {
            case 'Cadastrar Cliente':
                console.log(chalk.blue('\n===Cadastrar clinete===\n'));
                const nome = readline.question('Digite o nome do cliente: ');
                const email = readline.questionEMail('Digite o email do cliente: ');
                const telefone = readline.questionInt('Digite o telefone do cliente: ');
                inserirClientes(nome, email, telefone);
                break;
            case 'Cadastrar produto':
                console.log(chalk.blue('\n===Cadastrar Produto===\n'));
                const nome_Produto = readline.question('Nome do produto: ');
                const preco = readline.questionFloat('Digite o preço: ');
                const estoque = readline.questionInt('Digite o Estoque: ');
                inserirProdutos(nome_Produto, preco, estoque)
                break;
            case 'Fazer pedido':
                console.log(chalk.blue('\n===Fazer pedido===\n'));
                const clienteId = inquirer.prompt([
                    {
                        type: 'list',
                        name: 'clienteId',
                        message: 'Escolha um cliente:',
                        choices: dbClientes.map(cliente => ({ name: cliente.nome, value: cliente.id })),
                    },
                ]).then((resposta1) => {
                    const clienteId = resposta1.clienteId;
                    const produtos = inquirer.prompt([
                        {
                            type: 'list',
                            name: 'produtos',
                            message: 'Escolha os produtos:',
                            choices: dbProdutos.map(produto => ({ name: produto.nome, value: produto.id })),
                        },
                    ]).then((resposta) => {
                        const quantidade = readline.questionInt('Digite a quantidade: ');
                        const produtoSelecionado = dbProdutos.find(produto => produto.id === resposta.produtos);
                        const quantidadeEstoque = produtoSelecionado.estoque;

                        if (quantidade > produtoSelecionado.estoque) {
                            console.log(chalk.red('\nQuantidade maior que o estoque.\n'));
                            return;
                        }
                        if (quantidade <= 0) {
                            console.log(chalk.red('\nQuantidade inválida.\n'));
                            return;
                        }
                        if (quantidadeEstoque <= 0) {
                            console.log(chalk.red('\nProduto fora de estoque.\n'));
                            return;
                        }
                        if (quantidadeEstoque < quantidade) {
                            console.log(chalk.red('\nProduto fora de estoque.\n'));
                            return;
                        }
                        const quantidadeFinal = quantidadeEstoque - quantidade;
                        db.run(`UPDATE produtos SET estoque = ? WHERE id = ?`, [quantidadeFinal, produtoSelecionado.id]);
                        fazerPedido(clienteId, [{ id: resposta.produtos, quantidade, preco: produtoSelecionado.preco }], quantidadeFinal);           
                    });
                });
                break;
            case 'Listar clientes':
                console.log(chalk.blue('\n===Clientes cadastrados===\n'));
                console.table(dbClientes);
                break;
            case 'Listar produtos':
                console.log(chalk.blue('\n===Produtos registrados\n'));
                console.table(dbProdutos);
                break;
            case 'listar pedidos feitos':
                console.log(chalk.blue('\n===Pedidos feitos===\n'));
                console.table(dbPedidos);
                break;
            case 'ver detalhes de um pedido':
                console.log(chalk.blue('\nVocê escolheu ver detalhes de um pedido.\n'));
                const id = inquirer.prompt([
                    {
                        type: 'list',
                        name: 'id',
                        message: 'Escolha um pedido:',
                        choices: dbPedidos.map(pedido => ({ name: pedido.nome, value: pedido.id })),
                    },
                ]).then((resposta) => {
                    const id = resposta.id;
                    detlhesPedidos(id);
                    return;
                });
                break;
            case 'Sair':
                console.log(chalk.red('\nSaindo...\n'));
                process.exit(0);
        }
    });
}
Menus();