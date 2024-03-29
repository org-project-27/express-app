import {DataTypes, Op} from "sequelize";
import craftModel from "../craftModel.js";
import { refactorModelFields } from "../../assets/helpers/modelHelpers.js";
import UserDetailsModel from "./userDetails.model.js";

const userModel = {
    tableName: 'Users',
    tableFields: {
        fullname: {
            type: DataTypes.STRING,
            allowNull: false,
            queryValue: 'VARCHAR(255) NOT NULL'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            queryValue: 'VARCHAR(255) NOT NULL UNIQUE'
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            queryValue: 'VARCHAR(255) NOT NULL'
        },
    },
};

const model = craftModel(userModel);
const modelFields = {...userModel.tableFields};
const includes = {
    details: {
        model: UserDetailsModel.model,
        foreignKey: 'user_id',
        relationType: 'hasOne',
        as: 'details',
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
    async findOne(where = {...modelFields}, included = []){
        const include = []
        included.forEach((key) => includes[key] && include.push(includes[key]));
        const result = await model.findOne({ where, include });
        return result?.toJSON();
    },
    async findByPk(primary_key, included = []) {
        const include = []
        included.forEach((key) => includes[key] && include.push(includes[key]));
        const result = await model.findByPk(primary_key, { include })
        return result?.toJSON();
    },
    async destroyByPk(primary_key) {
        const result = await model.findByPk(primary_key);
        return await result.destroy();
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
    includes,
}