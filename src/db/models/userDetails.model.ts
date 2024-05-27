import {DataTypes, Op} from "sequelize";
import craftModel from "@/db/craftModel";
import { refactorModelFields } from "#assets/helpers/modelHelpers";
import TokenSessions from "#models/tokenSessions";

const userDetailsModel = {
    tableName: 'UserDetails',
    tableFields: {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            queryValue: 'INT PRIMARY KEY UNIQUE'
        },
        phone: {
            type: DataTypes.STRING,
            queryValue: `VARCHAR(50) UNIQUE`
        },
        birthday: {
            type: DataTypes.DATE,
            queryValue: 'DATETIME'
        },
        description: {
            type: DataTypes.STRING,
            queryValue: 'VARCHAR(255)'
        },
        email_registered: {
            type: DataTypes.BOOLEAN,
            queryValue: 'BOOL'
        },
        preferred_lang: {
            type: DataTypes.STRING(10),
            queryValue: 'VARCHAR(10)',
        }
    }
}

const model = craftModel(userDetailsModel);
const modelFields = {...userDetailsModel.tableFields};
const includes = {
    tokens: {
        model: TokenSessions.model,
        foreignKey: 'owner_id',
        relationType: 'hasMany',
        as: 'tokens',
    },
}

// Cleaning model object
const { requiredFields } = refactorModelFields(modelFields);

const methods = {
    async findAll(){
        let result = await model.findAll();
        result = result.map(value => value?.toJSON());
        return result;
    },
    async findAllBy(filter: any = {...modelFields}){
        let orConditions = Object.keys((filter)).map((key: string) => {
            return {
                [key]: filter[key]
            };
        });

        let result = await model.findAll({
            where: {
                [Op.and]: orConditions
            }
        });
        result = result.map(value => value?.toJSON());
        return result;
    },
    async findOne(where = {...modelFields}){
        const result = await model.findOne({ where });
        return result?.toJSON();
    },
    async findByPk(primary_key: any) {
        const result = await model.findByPk(primary_key)
        return result?.toJSON();
    },
    async create(data = {...modelFields}){
        return await model.create({...data});
    },
};

export default {
    model,
    methods,
    includes,
    modelFields,
    requiredFields,
}