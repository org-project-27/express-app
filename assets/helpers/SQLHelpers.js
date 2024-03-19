import sequelizeConfig from "../../configs/sequelizeConfig.js";
async function RUN_SQL_QUERY(query='', database = sequelizeConfig){
    try {
       return await database.query(query)
    } catch (error) {
        console.error(`SQL QUERY ERROR ${query} ErrorMessage::=>`, error);
    }
}

export default {
    RUN_SQL_QUERY,
    CREATE_TABLE_IF_NOT_EXISTS: async (tableModel = { tableName: 'unnamed', tableFields: {}}, database = sequelizeConfig) => {
        const tablesFields = [];
        tableModel.tableName = tableModel.tableName.replace(' ', '_');
        Object.entries(tableModel.tableFields).forEach(([key, value]) => {
            const queryValue = `\`${key}\` ${value.queryValue}`;
            tablesFields.push(queryValue);
            // #TODO: ATTENTION HERE:
            delete value.queryValue;
        })
        const sql = `CREATE TABLE IF NOT EXISTS ${tableModel.tableName} (${tablesFields.join(',')})`;

        return await RUN_SQL_QUERY(sql, database);
    },
    DROP_TABLE: async (tableName = 'unnamed', database = sequelizeConfig) => {
        const sql = `DROP TABLE ${tableName}`;
        return await RUN_SQL_QUERY(sql, database);
    },
    SHOW_TABLES: async (database = sequelizeConfig) => {
        const sql = `SHOW TABLES`;
        return await RUN_SQL_QUERY(sql, database);
    }
}