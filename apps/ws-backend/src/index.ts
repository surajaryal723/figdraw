import dotenv, { parse } from "dotenv"
dotenv.config()
import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken"
const wss=new WebSocketServer({port:3001})
import {JWT_SECRET} from '@repo/backend-common/config'


interface User{
    socket:WebSocket,
    rooms:string[],
    userId:string

}

const users:User[]=[]

function checkUser(token:string): string | null{
    try {
        const decoded = jwt.verify(token, JWT_SECRET || "") as JwtPayload;
    
       
        if (!decoded || typeof decoded.id !== 'string') {
          return null;
        }
    
        return decoded.id;
      } catch (err) {
        
        return null;
      }
}

wss.on('connection',(socket,request)=>{
    const url=request.url
    if(!url){
        return;
    }
    const queryParams=new URLSearchParams(url.split('?')[1])
    const token=queryParams.get('token') || ""
    const userId=checkUser(token)

    if(!userId){
        socket.close()
    return;

    }
    users.push({
        socket,
        rooms:[],
        userId

         
    })
    
   

    socket.on('message',(data)=>{
        const parsedData=JSON.parse(data as unknown as string)
        
        
        if(parsedData.type==='join'){
            const user=users.find(x=>x.socket===socket)
            user?.rooms.push(parsedData.roomId)
        } 

        if(parsedData.type==='leave'){
            const user=users.find(x=>x.socket===socket)
            if(!user){
                return;
            }
            user.rooms=user?.rooms.filter(x=>x===parsedData.room)
        }

        if(parsedData.type==='chat'){
            const roomId=parsedData.roomId
            const message=parsedData.message

            users.forEach(user=>{
                if(user.rooms.includes(roomId)){
                    user.socket.send(JSON.stringify({
                        type:"chat",
                        message:message,
                        roomId:roomId
                    }))
                }
            })

        }
    })


})