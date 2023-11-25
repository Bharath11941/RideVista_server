import { Server } from "socket.io";

function socketConnection(server) {
  console.log("socket connection calling");
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    let activeUsers = [];

    socket.on("disconnect", () => {
      activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
      io.emit("get-users", activeUsers);
    });

    socket.on("setup", (userId) => {
      const existingUser = activeUsers.find((user) => user.userId === userId);
      if (!existingUser) {
        activeUsers.push({
          userId: userId,
          socketId: socket.id,
        });
      }
      io.emit("get-users", activeUsers);
      socket.join(123);
      socket.emit("connected");
    });
    

    socket.on("send_message", (data) => {
      socket.to(123).emit("recieve_message", data);
    });

    //socket for video call

    socket.on('me',(conversation) => {
      socket.join(conversation)
      
    }) 

    socket.on('disconnect',()=>{
      socket.broadcast.emit('callended')
    })

    // socket.on('callended',(id)=>{
    //   socket.broadcast.to(id).emit('callended',id)
    //   socket.leave(id)
    //   console.log(id,"call ended")
    // })
    socket.on('calluser',({from,userToCall,signalData,name})=>{
      io.to(userToCall).emit('calluser',{signal:signalData,from,name})
    })
    socket.on('answercall',(data)=>{
      console.log('answercall on')
      io.to(data.to).emit('callaccepted',data.signal)
    })
  });
}

export default socketConnection;
