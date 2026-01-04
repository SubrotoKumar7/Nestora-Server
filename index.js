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
        // await client.connect();

        const database = client.db('nestora_db');
        const usersCollections = database.collection('users');
        const propertiesCollections = database.collection('properties');
        const reviewsCollections = database.collection('reviews');

        // user related api
        app.post('/users', async(req, res)=> {
            const user = req.body;
            user.createdAt = new Date();
            user.role = "user";
            const result = await usersCollections.insertOne(user);
            res.send(result);
        })

        // property related api
        app.get('/properties', async (req, res) => {
            try {
                const email = req.query.email;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 8;
                const sort = req.query.sort || "none";

                const query = {};
                if (email) {
                query.agentEmail = email;
                }

                // sorting logic
                let sortQuery = {};
                if (sort === "low2high") {
                sortQuery.price = 1;
                } else if (sort === "high2low") {
                sortQuery.price = -1;
                }

                const skip = (page - 1) * limit;

                // paginated + sorted data
                const data = await propertiesCollections
                .find(query)
                .sort(sortQuery)
                .skip(skip)
                .limit(limit)
                .toArray();

                // total count (filtered)
                const totalItems = await propertiesCollections.countDocuments(query);
                const totalPages = Math.ceil(totalItems / limit);

                res.send({
                    data,
                    totalPages,
                    currentPage: page,
                    totalItems,
                });
            } catch (error) {
                res.status(500).send({
                message: "Failed to fetch properties",
                error,
                });
            }
        });


        app.get('/properties/:id', async(req, res)=> {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await propertiesCollections.findOne(query);
            res.send(result);
        })

        app.post('/properties', async(req, res)=> {
            const data = req.body;
            const result = await propertiesCollections.insertOne(data);
            res.send(result)
        })

        app.get('/latest-properties', async(req, res)=> {
            const query = {};
            const cursor =  propertiesCollections.find(query).sort({createdAt: -1}).limit(8);
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
            delete updateProperties._id;
            const query = {_id: new ObjectId(id)};
            const update = {
                $set: updateProperties
            }
            const options = {};
            const result = await propertiesCollections.updateOne(query, update, options);
            res.send(result);
        })

        app.get('/sort', async (req, res) => {
            const sortBy = req.query.price;
            let sortQuery;
            if (sortBy === 'low2high') {
                sortQuery = { price: 1 };
            }
            if (sortBy === 'high2low') {
                sortQuery = { price: -1 };
            }
            if(sortBy === 'none'){
                sortQuery = {};
            }
            const result = await propertiesCollections.find({}).sort(sortQuery).toArray();
            res.send(result);
        });

        // reviews related api
        app.post('/reviews', async(req, res)=> {
            const data = req.body;
            const result = await reviewsCollections.insertOne(data);
            res.send(result);
        })

        app.get('/reviews/:id', async(req, res)=> {
            const id = req.params.id;
            const query = {productId: id}
            const cursor = reviewsCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/reviews', async(req, res)=> {
            const email = req.query.email;
            const query = {};
            if(email){
                query.reviewerEmail = email;
            }
            const cursor = reviewsCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // await client.db('admin').command({ping: 1});
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