import Users from './models/user.model.js';
import UserDetails from './models/userDetails.model.js';

const listOfModelsToSync = [
    Users,
    UserDetails,
]

export default async function() {
    //associateTables();
    await listOfModelsToSync.forEach(async (target) => {
        associateTable(target);
        await target.model.sync();
    });
}

function associateTables(){
    // User <- One to One -> UserDetails
    Users.model.hasOne(Users.includes['details'].model, {
        foreignKey: Users.includes['details'].foreignKey,
        as: Users.includes['details'].as
    });
    Users.includes['details'].model.belongsTo(Users.model, {
        foreignKey: Users.includes['details'].foreignKey,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    } );
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