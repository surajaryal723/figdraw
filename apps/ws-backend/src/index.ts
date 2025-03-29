import dotenv from "dotenv"
dotenv.config()
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken"
const wss=new WebSocketServer({port:3001})

wss.on('connection',(socket,request)=>{
    const url=request.url
    if(!url){
        return;
    }
    const queryParams=new URLSearchParams(url.split('?')[1])
    const token=queryParams.get('token') || ""

    const decoded=jwt.verify(token,process.env.JWT_SECRET || "")
    if(!decoded || typeof decoded === 'string' || !('email' in decoded)){
        wss.close()
        return;
    }

    console.log(decoded)
    socket.on('message',(data)=>{
        console.log(data.toString())
    })
})