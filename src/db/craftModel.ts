import { modelRequired, premierDefaults } from "#assets/helpers/modelHelpers";
import database from "#assets/configurations/sequelizeConfig";

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