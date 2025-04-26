import chalk from "chalk";
import sqlite3 from 'sqlite3';
import { open } from "sqlite";
import { Menus } from "../index.js";

const db = await open({
    filename: './banco.db',
    driver: sqlite3.Database,
});

export async function fazerPedido(clienteId, produtos) {
    try {
        const data = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const total = produtos.reduce((acc, produto) => acc + produto.preco * produto.quantidade, 0);

        const pedido = await db.run(
            `INSERT INTO pedidos (cliente_id, data, total) VALUES (?, ?, ?)`,
            [clienteId, data, total]
        );

        for (const produto of produtos) {
            await db.run(
                `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)`,
                [pedido.lastID, produto.id, produto.quantidade, produto.preco]
            );
        }

        console.log(chalk.green('\nPedido realizado com sucesso!\n'));
        Menus();
    } catch (error) {
        console.error(chalk.red('\nErro ao fazer pedido:\n'), error.message);
    }
}
