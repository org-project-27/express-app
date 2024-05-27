import sequelize from "#assets/configurations/sequelizeConfig";
import {DataTypes} from "sequelize";
import UserDetailsModel from "#models/userDetails.model";
import {DefaultModelClass} from "#types/model";
class UserModel implements DefaultModelClass {
    public model;
    public methods: any;
    public includes: any;
    public requiredFields: string[] = ['fullname', 'email', 'password']

    public static modelName: string = "Users"
    public static modelFields = {
        fullname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    };

    constructor(associate: {}, options={}) {
        this.model = sequelize.define(UserModel.modelName, UserModel.modelFields)
        this.includes = associate;
        this.methods = {
            setUserPassword: this.setUserPassword,
        }
    }

    private setUserPassword(password: string){console.log(password)}
}

export default new UserModel({
    details: {
        model: UserDetailsModel.model,
        foreignKey: 'user_id',
        relationType: 'hasOne',
        as: 'details',
    },
});