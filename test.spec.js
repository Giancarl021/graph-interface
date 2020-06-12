require('dotenv').config();

const createGraphInterface = require('./index');


const credentials = {
    tenant_id: process.env.TENANT_ID,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
};

const options = {
    cache: {
        type: 'fs'
    }
};

const ttl = 3600;

async function main() {
    console.log('Connecting to Graph API...');

    const graph = await createGraphInterface(credentials, options);

    console.log('Getting users...');
    const users = await graph.list('users?$select=id,mail,displayName,jobTitle,userPrincipalName,onPremisesExtensionAttributes', {
        map: user => ({
            id: user.id,
            name: user.displayName,
            email: user.mail,
            job: user.jobTitle,
            upn: user.userPrincipalName,
            costCenter: user.onPremisesExtensionAttributes.extensionAttribute4
        }),
        cache: {
            expiresIn: ttl
        }
    });

    console.log(users.length + ' users retrieved');

    console.log('Getting licenses...');
    const licenses = await graph.massive('users/{id}/licenseDetails?$select=skuPartNumber', {
        id: users.map(user => user.id)
    }, {
        map: license => license.skuPartNumber,
        binder: 'id',
        type: 'list',
        cycle: {
            async: true
        },
        cache: {
            // expiresIn: ttl
        }
    });

    console.log(require('./util/object')(licenses).size() + ' licenses retrived');

    console.log('Binding licenses...');
    for(let i = 0; i < users.length; i++) {
        const { id } = users[i];
        users[i].licenses = licenses[id];
    }

    console.log('Saving response...');

    require('./util/json')(`responses/${Date.now()}`).save(users);

    console.log('Response built');
}

main()
    .catch(console.error)
    .finally(() => {
        process.exit(0)
    })