import sequelizeConfig from "@/sequelize/database";

async function runSqlQuery(query = '', database = sequelizeConfig) {
    try {
        return await database.query(query);
    } catch (error) {
        console.error(`SQL QUERY ERROR: ${query} ErrorMessage::=>`, error);
    }
}

async function createTableIfNotExists(tableModel = { tableName: 'unnamed', tableFields: {} }, database = sequelizeConfig) {
    const tableFields: string[] = [];
    tableModel.tableName = tableModel.tableName.replace(' ', '_');

    for (const [key, value] of Object.entries(tableModel.tableFields)) {
        // @ts-ignore
        const queryValue = `\`${key}\` ${value.queryValue}`;
        tableFields.push(queryValue);
        delete (value as any).queryValue; // Type assertion to bypass TS error for delete
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${tableModel.tableName} (${tableFields.join(', ')})`;
    return await runSqlQuery(sql, database);
}

async function dropTable(tableName = 'unnamed', database = sequelizeConfig) {
    const sql = `DROP TABLE ${tableName}`;
    return await runSqlQuery(sql, database);
}

async function showTables(database = sequelizeConfig) {
    const sql = `SHOW TABLES`;
    return await runSqlQuery(sql, database);
}

export default {
    runSqlQuery,
    createTableIfNotExists,
    dropTable,
    showTables,
};
