import { ComplexModelField } from 'assets/types/modelField.js'

export interface UserModel {
    fullname: ComplexModelField,
    email: ComplexModelField,
    password: ComplexModelField
}

export interface UserCreationAttributes {
    fullname: string;
    email: string;
    password: string;
}