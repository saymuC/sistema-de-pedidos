import chalk from "chalk";
import sqlite3 from 'sqlite3';
import { open } from "sqlite";
import { Menus } from "../index.js";

const db = await open({
    filename: './banco.db',
    driver: sqlite3.Database,
});

export async function inserirProdutos(nome, preco, estoque) { 
    const produtoRepetido = await db.get(
        `SELECT * FROM produtos WHERE nome = ?`, [nome]
    );
    if (produtoRepetido) {
        console.log(chalk.red('\nJá existe um produto cadastrado com este nome. Por favor tente outro.'));
        return;
    }
    await db.run(
        `INSERT INTO produtos (nome, preco, estoque)
         VALUES (?, ?, ?)`,
        [nome, preco, estoque]
    );
    console.log(chalk.green('\n Produto cadastrado com sucesso!\n'));
    Menus();
}