import Users from './models/user.model.js';
import UserDetails from './models/userDetails.model.js';
import TokenSessions from "./models/tokenSessions.js";

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

function associateTable(Table){
    if(Table.includes){
        Object.entries(Table.includes).forEach(([key, value]) => {
            console.log(key, '==>', Table.model, `<- ${value.relationType} ->`, value.model);
            if(value.relationType === 'hasOne' || value.relationType === 'hasMany'){

                Table.model[value.relationType](value.model, {
                    foreignKey: value.foreignKey,
                    as: value.as
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