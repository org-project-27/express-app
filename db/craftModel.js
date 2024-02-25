import { modelRequired, premierDefaults } from "../assets/helpers/modelHelpers.js";
import database from "./sequelizeConfig.js";

export default function(
    tableModel = {...modelRequired},
    defaults = premierDefaults,
    sequelize = database,
    ) {

    tableModel.tableFields = {
        ...defaults,
        ...tableModel.tableFields, 
    };

    return sequelize.define(
        tableModel.tableName, 
        {...tableModel.tableFields}
    );
}