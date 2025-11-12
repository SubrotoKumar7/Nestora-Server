const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Nestora server is running');
})

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@first-db.5h5o2p2.mongodb.net/?appName=first-db`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run(){
    try{
        await client.connect();

        const database = client.db('nestora_db');
        const usersCollections = database.collection('users');
        const propertiesCollections = database.collection('properties');

        // user related api
        app.post('/users', async(req, res)=> {
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            res.send(result);
        })

        // property related api
        app.get('/properties', async(req, res)=> {
            const email = req.query.email;
            const query = {};
            if(email){
                query.agentEmail = email;
            }
            const cursor = propertiesCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/properties', async(req, res)=> {
            const data = req.body;
            const result = await propertiesCollections.insertOne(data);
            res.send(result)
        })

        app.get('/latest-properties', async(req, res)=> {
            const query = {};
            const cursor =  propertiesCollections.find(query).sort({createdAt: -1}).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.delete('/properties/:id', async(req, res)=> {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await propertiesCollections.deleteOne(query);
            res.send(result);
        })

        app.patch('/properties/:id', async(req, res)=> {
            const id = req.params.id;
            const updateProperties = req.body;
            const query = {_id: new ObjectId(id)};
            const update = {
                $set: updateProperties
            }
            const options = {};
            const result = await propertiesCollections.updateOne(query, update, options);
            res.send(result);
        })

        await client.db('admin').command({ping: 1});
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir);

app.listen(port, ()=> {
    console.log(`Nestora app listening on port ${port}`);
})