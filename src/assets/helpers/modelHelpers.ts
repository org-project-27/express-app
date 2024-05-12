import {DataTypes} from "sequelize";

export const premierDefaults = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        queryValue: 'INT AUTO_INCREMENT PRIMARY KEY'
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        queryValue: 'DATETIME NOT NULL'
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        queryValue: 'DATETIME NOT NULL'
    }
}

export const modelRequired = {
    tableName: 'unnamed',
    tableFields: {}
}

export function refactorModelFields(model){
    const requiredFields = []
    Object.entries(model).map(([key, value]) => {
        model[key] = null;
        if(value.type.key === DataTypes.DATE.key){
            model[key] = new Date();
        }
        if(value.autoIncrement || key === 'createdAt' || key === 'updatedAt'){
            delete model[key];
        } else if(value.allowNull === false){
            requiredFields.push(key);
        }
    });  
    return { requiredFields }
}