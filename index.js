const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.port || 5000;
// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nmmhgrv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const productCollection = client.db('toyDB').collection('toy');

    app.get('/toy-products', async(req, res)=>{
        const result = await productCollection.find().sort({ price : -1 }).limit(20).toArray();
        res.send(result);
    });

    app.get('/toy-products/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id)
        const query = { _id: new ObjectId(id) }
        const result = await productCollection.findOne(query);
        res.send(result);
    });

    app.get('/my-toy', async (req, res) => {
        let query = {};
        if (req.query?.email) {
            query = { sellerEmail: req.query.email}
        };
        const result = await productCollection.find(query).toArray();
        res.send(result);
    });

    app.get('/toy/:category', async (req, res) => {
        if (req.params.category == "all") {
          const result = await productCollection.find().toArray();
          return res.send(result);
        };
        const result = await productCollection.find({subcategory: req.params.category}).toArray();
        res.send(result);
    });

    const indexKeys = {name: 1};
    const indexOptions ={name: "serchName"}
    const result = await productCollection.createIndex(indexKeys, indexOptions)
    app.get('/toy-serch/:text', async (req, res) => {
        const text= req.params.text;
        const result = await productCollection.find({name: { $regex: text, $options: "i"}}).toArray();
        res.send(result);
    });

    app.post('/toy-products', async (req, res) => {
        const booking = req.body;
        console.log(booking);
        const result = await productCollection.insertOne(booking);
        res.send(result);
    });

    app.put('/toys/:id', async(req, res) =>{
      const id = req.params.id;
      const filter ={_id: new ObjectId(id)};
      const options = { upsert: true };
      const updatedToy = req.body;
      const toy = {
          $set: {
              name: updatedToy.name,
              quantity: updatedToy.quantity,
              subcategory: updatedToy.subcategory,
              details: updatedToy.details,
              rating: updatedToy.rating, 
              price: updatedToy.price, 
              photo: updatedToy.photo,
          },
        };
      const result = await productCollection.updateOne(filter, toy, options);
      res.send(result);
  })

    app.delete('/my-toy/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await productCollection.deleteOne(query);
        res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`));