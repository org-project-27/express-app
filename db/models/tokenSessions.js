import {DataTypes, Op} from "sequelize";
import craftModel from "../craftModel.js";
import {refactorModelFields} from "../../assets/helpers/modelHelpers.js";

const tokenSessionsModel = {
    tableName: 'TokenSessions',
    tableFields: {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            queryValue: 'INT AUTO_INCREMENT PRIMARY KEY'
        },
        owner_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            queryValue: 'INT NOT NULL'
        },
        created_for: {
            type: DataTypes.STRING(50),
            allowNull: false,
            queryValue: 'VARCHAR(50) NOT NULL'
        },
        token: {
            type: DataTypes.STRING(250),
            unique: true,
            allowNull: false,
            queryValue: 'VARCHAR(250) UNIQUE NOT NULL'
        },
        payload: {
            type: DataTypes.JSON,
            queryValue: 'JSON'
        },
        expired_at: {
            type: DataTypes.DATE,
            allowNull: false,
            queryValue: 'DATETIME NOT NULL'
        }
    }
}

const model = craftModel(tokenSessionsModel, {});
const modelFields = {...tokenSessionsModel.tableFields};

const {requiredFields} = refactorModelFields(modelFields);

const methods = {
    async findAll(){
        let result = await model.findAll();
        result = result.map(value => value?.toJSON());
        return result;
    },
    async findAllBy(filter = {...modelFields}){
        let orConditions = Object.keys(filter).map(key => {
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
    async findByPk(primary_key) {
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
    modelFields,
    requiredFields,
}