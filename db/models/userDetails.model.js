import {DataTypes, Op} from "sequelize";
import craftModel from "../craftModel.js";
import { refactorModelFields } from "../../assets/helpers/modelHelpers.js";

const userDetailsModel = {
    tableName: 'UserDetails',
    tableFields: {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            queryValue: 'INT PRIMARY KEY'
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
        is_seller: {
            type: DataTypes.BOOLEAN,
            queryValue: 'BOOL'
        }
    }
}

const model = craftModel(userDetailsModel, {});
const modelFields = {...userDetailsModel.tableFields};

// Cleaning model object
const { requiredFields } = refactorModelFields(modelFields);

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