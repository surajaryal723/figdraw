import dotenv from "dotenv";
dotenv.config();

import express from "express";


import {router} from './routes/user'

const app=express()
app.use(express.json())
app.use('/user/api/v1',router)



app.listen(8080)

