const config = require('config.json');
const jwt = require('jsonwebtoken');

// users hardcoded for simplicity, store in a db for production applications
//const users = [{ id: 1, username: 'user', password: 'pass', firstName: 'Test', lastName: 'User' }];

module.exports = {
    authenticate,
    getAll
};

async function authenticate({ username, password/*, userType */}) {
    const MongoClient = require('mongodb').MongoClient;
    require('dotenv').config();
    const url = process.env.MONGO_URI_PROD || process.env.MONGO_URI;
    const db = await MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
    const dbo = db.db("ffq_database");
    var query = { username: username };
    var user = await dbo.collection("admins").find(query).toArray();
    let viewConfiguration = null
    if(!Object.keys(user).length){
        user = await dbo.collection("clinicians").find(query).toArray();
    }
    if(!Object.keys(user).length){
        user = await dbo.collection("parents").find(query).toArray();
    }
    if (!Object.keys(user).length) {
        user = await dbo.collection("researchers").find(query).toArray();
        const institutionId = user[0]?.assignedResearchInstitutionId;
        if(institutionId) {
            [viewConfiguration] = await dbo.collection("view-configurations").find({
                institutionId: institutionId
            }).toArray();
        }
    }
    if (!Object.keys(user).length) {
        user = await dbo.collection("participants").find(query).toArray();
        const institutionId = user[0]?.assignedResearcherInst;
        if(institutionId) {
            [viewConfiguration] = await dbo.collection("view-configurations").find({
                institutionId: institutionId
            }).toArray();
        }
    }

    const bcrypt = require('bcrypt');

    if (Object.keys(user).length) {
        user = user[0];
        // Load hash from the db, which was previously stored
        // keeping plain pw validation for backwards compatibility,
        // has to be removed after the password update feature is implemented
        let match = await bcrypt.compare(password, user.userpassword) || password === user.userpassword;
        if (match) {
            const token = jwt.sign({ sub: user._id }, config.secret);
            if(viewConfiguration) {
                user.viewConfiguration = viewConfiguration;
            }
            const { userpassword, ...userWithoutPassword } = user;
            return [{
                ...userWithoutPassword,
                token
            }];
        }
    }
}

async function getAll() {
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
}
