
import User from "../models/user/user.model";
import BookingController from "../controllers/booking/booking.controller";
var Message = require('../models/message/message.model');
var MessageController = require('../controllers/message/messageController');

module.exports = {

    startChat: function (io) {  
        console.log('socket is on')
        
        var nsp = io.of('/manQol'); //namespace

        nsp.on('connection', async(socket) => { 
               nsp.emit('hi', 'Hello everyone!'); 
            var myId = socket.handshake.query.id
           
            var roomName = 'room-' + myId; 
            socket.join(roomName); 
            console.log('client ' + myId + ' connected.');

            var clients1 = nsp.allSockets()//old is nsp.clients();             
            socket.userId = myId; 
            console.log("socket: "+socket.userId);
            var clients=[];
            for (var id in clients1.connected) { 
                var userid= clients1.connected[id].userId;
                clients.push(userid);
            }
            
            var onlineData={
                id: myId,
                users : clients
            };
            //await User.findByIdAndUpdate(myId, {lastSeen:Date.parse(new Date()),online:true}, { new: true });
            
            
            socket.on('disconnect', async(reason) =>{
                var check = false;
                console.log(`socket ${socket.id} disconnected because: ${reason}`)
                MessageController.changeStatus(socket,{id: myId},check);
                nsp.emit('clientDisconnected',{id: myId})
            });

            
          
        });
    },
    startNotification : function(io){
        global.notificationNSP = io.of('/notification') ; 
        notificationNSP.on('connection',function(socket){
            var id = socket.handshake.query.id;
            var roomName = 'room-' + id;
            socket.join(roomName);
            console.log('client ' + id + ' connected on notification .');
        });
    }
}