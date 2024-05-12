import { Dialect, Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const DB_NAME: string = process.env.DB_NAME || '';
const DB_USER: string = process.env.DB_USER || '';
const DB_PASSWORD: string = process.env.DB_PASSWORD || '';
const DB_HOST: string = process.env.DB_HOST || '';
// @ts-ignore
const DB_DIALECT: Dialect = process.env.DB_DIALECT || 'mysql';

export default new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    {
        host: DB_HOST,
        dialect: DB_DIALECT,
    }
);