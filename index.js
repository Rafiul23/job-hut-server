const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Job hut server is running');
})

// const verifyToken = async(req, res, next)=>{
//   const token = req.cookies?.token;
  
//   if(!token){
//     return res.status(401).send({message: 'Unauthorized'})
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
//     if(error){
//       return res.status(401).send({message: 'Not Authorized'})
//     }
//     req.user= decoded;
//     next();
//   })
 
// }

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wlof2pa.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const jobCollection = client.db('jobsDB').collection('jobs');
    const appliedCollection = client.db('appliedDB').collection('appliedJobs');

    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,  
      })
      .send({success: true});
    })

    app.get('/jobs', async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    })

    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    })

    app.post('/appliedjobs', async(req, res)=>{
      const appliedJob = req.body;
      const result = await appliedCollection.insertOne(appliedJob);
      req.send(result);
    })

    
    app.get('/myjobs/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    })

    app.put('/job/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedJob = req.body;
      const job = {
        $set: {
          job_banner: updatedJob.job_banner,
          job_title: updatedJob.job_title,
          employee_name: updatedJob.employee_name,
          job_category: updatedJob.job_category,
          salary_range: updatedJob.salary_range,
          job_description: updatedJob.job_description,
          job_posting_date: updatedJob.job_posting_date,
          application_deadline: updatedJob.application_deadline,
          job_applicants_number: updatedJob.job_applicants_number
        }
      }
      const result = await jobCollection.updateOne(filter, job, options);
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`server is running on port ${port}`);
})