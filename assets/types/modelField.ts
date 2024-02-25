import { DataType, DataTypes, Model, ModelStatic, ModelAttributeColumnOptions } from "sequelize";

export interface SimpleModelField {
    type: typeof DataTypes[keyof typeof DataTypes];
    unique?: boolean;
    allowNull?: boolean;
    primaryKey?: boolean;
    defaultValue?: any;
    validate?: Record<string, any>;
}

export interface ComplexModelField extends ModelAttributeColumnOptions {
    type: DataType;
    unique?: boolean | string | { name: string; msg: string };
    allowNull?: boolean;
    primaryKey?: boolean;
    defaultValue?: any;
    validate?: Record<string, any>;
    autoIncrement?: boolean;
    autoIncrementIdentity?: boolean;
    comment?: string;
    references?: {
        model: string | ModelStatic<Model<any, any>>;
        key: string;
    };
    onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
    onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';
    get?: () => any;
    set?: (value: any) => void;
    field?: string;
    fieldMap?: string;
    index?: boolean | string | { name: string; unique?: boolean; using?: string; order?: 'ASC' | 'DESC'; where?: any };
}

