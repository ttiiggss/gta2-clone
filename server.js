const http=require('http'), fs=require('fs'), path=require('path');
const {WebSocketServer}=require('ws');
const PORT=process.env.PORT||8080;
const MAX=16;

const ROOT=__dirname, MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
  let f=(req.url==='/'?'/index.html':req.url.split('?')[0]);
  f=path.normalize(f).replace(/^([/\\])+/,'');
  const fp=path.join(ROOT,f);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)){res.writeHead(404);return res.end('nf');}
  res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});
  fs.createReadStream(fp).pipe(res);
});

const wss=new WebSocketServer({server});
const players=new Map(); // id -> state
let nextId=0;
const broadcast=(msg,except)=>{const s=JSON.stringify(msg);for(const[id,p]of players){if(except&&id===except)continue;p.ws.send(s);}};
const roster=()=>[...players.values()].map(p=>({id:p.id,pubkey:p.pubkey,name:p.name,pfp:p.pfp}));
const pushRoster=()=>broadcast({t:'roster',players:roster()});

wss.on('connection',ws=>{
  let id=null;
  const hb=setInterval(()=>{if(ws.readyState===1)ws.ping();},25000);
  ws.on('message',d=>{
    let m;try{m=JSON.parse(d);}catch{return;}
    if(m.t==='join'){
      if(players.size>=MAX){ws.send(JSON.stringify({t:'full'}));return ws.close(4000,'full');}
      id='p'+(nextId++);
      players.set(id,{ws,pubkey:m.pubkey,name:m.name||'anon',pfp:m.pfp||'',x:m.x||200,y:m.y||200,angle:0,inCar:false});
      ws.send(JSON.stringify({t:'joined',id,count:players.size,max:MAX}));
      pushRoster();
      return;
    }
    if(m.t==='state'&&id){const p=players.get(id);if(!p)return;
      p.x=m.x;p.y=m.y;p.angle=m.angle;p.inCar=m.inCar;
      // throttled upstream; relay to others
      broadcast({t:'state',id,x:m.x,y:m.y,angle:m.angle,inCar:m.inCar,carX:m.carX,carY:m.carY,carAngle:m.carAngle},id);
    }
  });
  ws.on('close',()=>{clearInterval(hb);if(id){players.delete(id);pushRoster();}});
  ws.on('error',()=>{});
});
server.listen(PORT,()=>console.log('GTA2 lite on http://localhost:'+PORT+'  ('+MAX+' max players)'));
