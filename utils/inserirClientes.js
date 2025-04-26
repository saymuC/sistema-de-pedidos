import chalk from "chalk";
import sqlite3 from 'sqlite3';
import { open } from "sqlite";

const db = await open({
    filename: './banco.db',
    driver: sqlite3.Database,
});

export async function inserirClientes(nome, email, telefone) {
    const emailRepetido = await db.get(
        `SELECT * FROM clientes WHERE email = ?`, [email]
    );

    if (emailRepetido) {
        console.log(chalk.red('\nJá existe um usuário cadastrado com este email. Por favor tente outro.'));
        return;
    }   
    await db.run(
        `INSERT INTO clientes (nome, email, telefone)
         VALUES (?, ?, ?)`,
        [nome, email, telefone]
    );
    console.log(chalk.green('\n Cliente cadastrado com sucesso!\n'));
}