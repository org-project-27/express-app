import Users from './models/user.model';
import UserDetails from './models/userDetails.model';
import TokenSessions from "./models/tokenSessions";

const listOfModelsToSync = [
    Users,
    UserDetails,
    TokenSessions
]

export default async function() {
    //associateTables();
    await listOfModelsToSync.forEach(async (target) => {
        associateTable(target);
        await target.model.sync();
    });
}

function associateTable(Table: any){
    if(Table.includes){
        Object.keys(Table.includes).forEach((key: any) => {
            let value: any = Table.includes[key];
            console.log(key, '==>', Table.model, `<- ${value.relationType} ->`, value.model);
            if(value.relationType === 'hasOne' || value.relationType === 'hasMany'){

                Table.model[value.relationType](value.model, {
                    foreignKey: value.foreignKey,
                    as: value.as,
                    sourceKey: 'id'
                });

                value.model.belongsTo(Table.model, {
                    foreignKey: value.foreignKey,
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                } );

            }
        });
    }
}