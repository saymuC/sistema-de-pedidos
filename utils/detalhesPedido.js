import chalk from "chalk";
import sqlite3 from 'sqlite3';
import { open } from "sqlite";
import { Menus } from "../index.js";

const db = await open({
    filename: './banco.db',
    driver: sqlite3.Database,
});

export async function detlhesPedidos(id) {
    const dadosPedidos2 = await db.all(`SELECT * FROM itens_pedido`);
    const dadosProdutos = await db.all(`SELECT * FROM produtos`);
    const dadosClientes = await db.all(`SELECT * FROM clientes`);
    const dadosPedidosCompleto = await db.all(`
        SELECT p.id, p.data, p.total, c.nome AS cliente_nome, i.quantidade, pr.nome AS produto_nome, i.preco_unitario
        FROM pedidos p
        JOIN clientes c ON p.cliente_id = c.id
        JOIN itens_pedido i ON p.id = i.pedido_id
        JOIN produtos pr ON i.produto_id = pr.id
        WHERE p.id = ?`, [id]
    );
    if (dadosPedidosCompleto.length === 0) {
        console.log(chalk.red('\nPedido não encontrado.\n'));
        return Menus();
    }
    console.log(chalk.blue('\nDetalhes do Pedido:\n'));
    console.table(dadosPedidosCompleto, ['id', 'data', 'total', 'cliente_nome', 'quantidade', 'produto_nome', 'preco_unitario']);

};