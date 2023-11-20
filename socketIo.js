import { Server } from 'socket.io';

function socketConnection(server){
  console.log("socket connection calling")
  const io = new Server(server,{
    cors:{
      origin: 'http://localhost:5173',
      methods:["GET","POST"]
    }
  })

  io.on('connection',(socket)=>{
    let activeUsers = []
    socket.on('new-user-add',(newUserId) => {
      console.log(newUserId,"from front end")
      //if userId is not added previously
      if(!activeUsers.some(user => user.userId === newUserId)){
        activeUsers.push({
          userId:newUserId,
          socketId:socket.id
        })
      }
      io.emit('get-users',activeUsers)
    })

    socket.on('disconnect',()=>{
      activeUsers = activeUsers.filter((user)=>user.socketId !== socket.id)
      io.emit('get-users',activeUsers)
    })

    socket.on('setup',(Id)=>{
      socket.join(123);
      socket.emit('connected')
    })

    socket.on('send_message',(data)=>{
      socket.to(123).emit('recieve_message',data)
    })

  })


}

export default socketConnection

