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
function limpar() {
    console.clear();
}
limpar();
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

export async function Menus() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'menu',
            message: 'Escolha uma opção:',
            choices: MENU,
        },
    ]).then(async (resposta) => {
        switch (resposta.menu) {
            case 'Cadastrar Cliente':
                limpar();
                console.log(chalk.blue('\n===Cadastrar clinete===\n'));
                const nome = readline.question('Digite o nome do cliente: ');
                if (nome === '') {
                    console.log(chalk.yellow('\nNome inválido. Tente outro \n'));
                    return Menus();
                }
                const email = readline.questionEMail('Digite o email do cliente: ');
                const telefone = readline.questionInt('Digite o telefone do cliente: ');
                limpar();
                inserirClientes(nome, email, telefone);
                break;
            case 'Cadastrar produto':
                limpar();
                console.log(chalk.blue('\n===Cadastrar Produto===\n'));
                const nome_Produto = readline.question('Nome do produto: ');
                if (nome_Produto === '') {
                    console.log(chalk.yellow('\nNome inválido. Tente outro \n'));
                    return Menus();
                }
                const preco = readline.questionFloat('Digite o preço: ');
                if (preco <= 0) {
                    console.log(chalk.yellow('\nValor invalido, Tente outro \n'));
                    return Menus();
                }
                const estoque = readline.questionInt('Digite o Estoque: ');
                if (estoque <= 0) {
                    console.log(chalk.yellow('\nValor invalido, Tente outro \n'));
                    return Menus();
                }
                limpar();
                inserirProdutos(nome_Produto, preco, estoque);
                break;
                case 'Fazer pedido':
                    limpar();
                console.log(chalk.blue('\n=== Fazer pedido ===\n'));

                const dbClientes = await db.all('SELECT * FROM clientes');
                const dbProdutos = await db.all('SELECT * FROM produtos');

                if (dbClientes.length === 0) {
                    limpar();
                    console.log(chalk.yellow('\nNenhum cliente encontrado. Caso já tenha registrado um cliente, reinicie o programa.\n'));
                    return Menus();
                }

                if (dbProdutos.length === 0) {
                    limpar();
                    console.log(chalk.yellow('\nNenhum produto encontrado. Caso já tenha registrado um produto, reinicie o programa.\n'));
                    return Menus();
                }

                const resposta1 = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'clienteId',
                        message: 'Escolha um cliente:',
                        choices: dbClientes.map(cliente => ({ name: cliente.nome, value: cliente.id })),
                    },
                ]);
                const clienteId = resposta1.clienteId;

                const respostaProduto = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'produtos',
                        message: 'Escolha os produtos:',
                        choices: dbProdutos.map(produto => ({ name: produto.nome, value: produto.id })),
                    },
                ]);
                limpar();
                const quantidade = readline.questionInt('Digite a quantidade: ');

                const produtoSelecionado = dbProdutos.find(produto => produto.id === respostaProduto.produtos);

                if (quantidade <= 0) {
                    limpar();
                    console.log(chalk.red('\nQuantidade inválida.\n'));
                    return Menus();
                }

                if (quantidade > produtoSelecionado.estoque) {
                    limpar();
                    console.log(chalk.red(`\nQuantidade maior que o estoque disponível. Estoque atual: ${produtoSelecionado.estoque}\n`));
                    return Menus();
                }

                if (produtoSelecionado.estoque <= 0) {
                    limpar();
                    console.log(chalk.red('\nProduto fora de estoque.\n'));
                    return Menus;
                }

                const quantidadeFinal = produtoSelecionado.estoque - quantidade;
                await db.run(`UPDATE produtos SET estoque = ? WHERE id = ?`, [quantidadeFinal, produtoSelecionado.id]);

                await fazerPedido(clienteId, [{ id: respostaProduto.produtos, quantidade, preco: produtoSelecionado.preco }]);
                return Menus();

            case 'Listar clientes':
                limpar();
                console.log(chalk.blue('\n===Clientes cadastrados===\n'));
                (async () => {
                    const dbClientes1 = await db.all('SELECT * FROM clientes');
                    const resultado = await db.get('SELECT COUNT(*) as total FROM clientes');
                    if (resultado.total === 0) {
                        console.log(chalk.red('\nNenhum cliente encontrado! Adicione clientes.\n'));
                        return Menus();
                    }
                    console.table(dbClientes1);
                    return Menus();
                })();
                break;
            case 'Listar produtos':
                limpar();
                console.log(chalk.blue('\n===Produtos registrados===\n'));
                (async () => {
                    const dbProdutos1 = await db.all('SELECT * FROM produtos');
                    const resultado = await db.get('SELECT COUNT(*) as total FROM produtos');
                    if (resultado.total === 0) {
                        console.log(chalk.red('\nNenhum produto encontrado! Adicione produtos.\n'));
                        return Menus();
                    }
                    console.table(dbProdutos1);
                    return Menus();
                })();
                break;
            case 'listar pedidos feitos':
                limpar();
                console.log(chalk.blue('\n===Pedidos feitos===\n'));
                (async () => {
                    const dbPedidos1 = await db.all('SELECT * FROM itens_pedido');
                    const resultado = await db.get('SELECT COUNT(*) as total FROM itens_pedido');
                    if (resultado.total === 0) {
                        console.log(chalk.red('\nNenhum pedido encontrado! Adicione pedidos.\n'));
                        return Menus();
                    }
                    console.table(dbPedidos1);
                    return Menus();
                })();
                
                break;
                case 'ver detalhes de um pedido':
                    limpar();
                    console.log(chalk.blue('\n===Detalhes de um pedido===\n'));
                    
                    (async () => {
                        const dbPedidos = await db.all('SELECT * FROM itens_pedido');
                        if (dbPedidos.length === 0) {
                            limpar();
                            console.log(chalk.yellow('\nNenhum pedido encontrado.\n'));
                            return Menus();
                        }
                        const resposta1 = await inquirer.prompt([
                           
                            {
                                type: 'list',
                                name: 'id',
                                message: 'Escolha um pedido:',
                                choices: dbPedidos.map(pedido => ({ name: `Pedido ${pedido.id}`, value: pedido.id })),
                            },
                        ]);
                        const id = resposta1.id;
                        await detlhesPedidos(id);
                        return Menus();
                    })();
                    break;
            case 'Sair':
                limpar();
                console.log(chalk.red('\nSaindo...\n'));
                process.exit(0);
        }
    });
}
Menus();