const http = require("http");
const fs = require("fs");
const http_url = require("url");
const queryString = require("querystring");
const event = require("events");
const eventEmitter = new event.EventEmitter();

const file_name = "data.json";
const file_data = fs.readFileSync(file_name);

let data_list = JSON.parse(file_data);
let lastindex = data_list.length-1;
let lastindex_id = (data_list.length==0) ? 0  : data_list[data_list.length-1].id;


const listen_port =  process.env.PORT || 5050;

http.createServer((request, response) => {

    const url_obj = new URL(request.url, `http://${request.headers.host}`) || http_url.parse(request.url, true);

    let st_name = url_obj.searchParams.get("name");
    let st_phone = url_obj.searchParams.get("phone");

    if(request.method==="GET" && url_obj.pathname=="/"){
        fs.readFile("index.html", (err, html) => {
            if(err) throw err;
            response.writeHead(200, {"Content-Type":"text/html"});
            response.write(html);
            response.end();
        })
    }

    if(request.method==="GET" && url_obj.pathname=="/getdata"){
        response.writeHead(200, {"Content-Type":"application/json"});
        response.write(JSON.stringify(data_list, null, 2));
        response.end();
    }

    if(request.method==="POST" && url_obj.pathname=="/postData"){

        let body = []

        request.on('data', dataChunk => {
            body.push(dataChunk);
        })
        request.on('end', () => {
            body = Buffer.concat(body).toString();
            if(request.headers['content-type']==="appliation/json"){
                body = JSON.parse(body);
            }else{
                body = queryString.parse(body);
            }


            const title = body.title;
            if(title!=undefined){
                const insertData = {id: ++lastindex_id, title, tasks: [] };
                data_list.push(insertData);

                fs.writeFile('./data.json', JSON.stringify(data_list, null, 5), (err) => {
                    if(err){
                        const message = {status:"error", msg:"could not persist data"};
                        response.writeHead(500, {"Content-Type":"application/json"});
                        response.end(JSON.stringify(message, null, 2));
                    }else{
                        response.writeHead(200, {"Content-Type":"application/json"});
                        response.end(JSON.stringify(data_list, null, 2));

                    }
                })
            }else {
                const message = {status:"error", message: 'Title not found in body request!' };
                console.log(JSON.stringify(message, null, 2));
                response.writeHead(400, {"Content-Type":"application/json"});
                response.write(JSON.stringify(message, null, 2));
                response.end();
            }
        })
    }

    if(request.method==="GET" && url_obj.pathname=="/postData/task"){
        console.log("ok");
        fs.readFile("task.html", (err, html)=>{
            if(err) throw err;
            response.writeHead(200, {"Content-Type":"text/html"});
            response.write(html);
            response.end();
        })
    }

    if(request.method==="POST" && url_obj.pathname==="/postData/task"){
        let body = [];

        request.on("data", dataChunk => {
            body.push(dataChunk);
        })
        request.on("end", () => {
            body = Buffer.concat(body).toString();
            if(request.headers["Content-Type"]==="application/json"){
                body = JSON.parse(body);
            }else{
                body = queryString.parse(body);
            }

            let search = url_obj.search;
            // let search = url_obj.searchParams;
            if(search){
                const [, query] = search.split("?");
                const obj = queryString.parse(query);
                const id = obj.id;
                if(id){
                    const bodytask = body.task;
                    if(bodytask){
                        data_list.forEach((bs, index) => {
                            if(bs.id==id){
                                let data = {name:body.name, phone:body.phone, email:body.email, gen:body.gen};
                                data_list[index].task = data;
                            }
                        })
                        fs.writeFile(file_name, JSON.stringify(data_list, null, 5), (err)=>{
                            if(err){
                                const msg = {status: "error", msg:"Task not persist in file"};
                                response.writeHead(500, {"Content-Type":"applicaton/json"});
                                response.write(JSON.stringify(msg, null, 2));
                                response.end();
                            }else{
                                response.writeHead(200,{"Content-Type":"application/json"});
                                response.write(JSON.stringify(data_list, null, 2));
                                response.end();

                            }
                        })
                    }else{
                        const msg = {status:"error", msg:"No task found in body request."};
                        response.writeHead(400, {"Content-Type":"application/json"});
                        response.write(JSON.stringify(msg));
                        response.end();
                    }
                }else{
                    const msg = {status:"error", msg:"ID parameter no exist"};
                    response.writeHead(400, {"Content-Type":"application/json"});
                    response.write(JSON.stringify(msg, null, 5));
                    response.end();                    
                }
            }else{
                var msg = {status:"error", msg:"No query parameter"};
                response.writeHead(400, {"Content-Type":"application/json"});
                response.write(JSON.stringify(msg, null, 5));
                response.end();
            }
        });
    }

    if(request.method==="PUT" && url_obj.pathname=="/updateData"){


        let st_id = url_obj.searchParams.get("id");
        if(st_id){
            let ls = {
                        id: st_id,
                        name: st_name,
                        phone: st_phone
                    };

            data_list.forEach((bs, index)=>{
                if(bs.id==st_id){
                    data_list[index].task = ls;
                }
            })

            fs.writeFile(file_name, JSON.stringify(data_list, null, 5), (err)=>{
                if(err){
                    const msg = {status:"error", msg:"Data cannot update"};
                    response.writeHead(500, {"Content-Type":"application/json"});
                    response.write(JSON.stringify(msg, null, 2));
                    response.end();
                }else{
                    response.writeHead(200,{"Content-Type":"application/json"});
                    response.write(JSON.stringify(data_list, null, 5));
                    response.end();
                }
            })
        }else{
            const msg = {status:"error", msg:"ID not found in your url."};
            response.writeHead(500,{"Content-Type":"application/json"});
            response.write(JSON.stringify(msg, null, 2));
            response.end();
        }
        
        // fs.writeFileSync(file_name, JSON.stringify(data_list, null, 3));
        // response.writeHead(200, {"Content-Type":"application/json"});
        // response.write(JSON.stringify(data_list, null, 2));
        // response.end();

    }

    if(request.method==="DELETE" && url_obj.pathname=="/deleteData"){
        let st_id = url_obj.searchParams.get("id");
        console.log(st_id);

        data_list.forEach((bx, index)=>{
            if(data_list[index].id==st_id){
                data_list.splice(index, 1);
            }
        })

        fs.writeFile(file_name, JSON.stringify(data_list, null, 5), (err)=>{
            if(err){
                let msg = {status:"error", msg:"Data not deleted."}
                response.writeHead(500, {"Content-Type":"application/json"});
                response.write(JSON.stringify(msg));
                response.end();
            }else{
                response.writeHead(500, {"Content-Type":"application/json"});
                response.write(JSON.stringify(data_list));
                response.end();
            }
        })
        // response.writeHead(200, {"Content-Type":"applcation/json"});
        // response.write(JSON.stringify(data_list, null, 2));
        // response.end();

    }

    // response.writeHead(400, {"Content-Type":"application/json"});
    // response.write(`Your request could not be perform on this url ${url_obj.href}`);
    // response.end();

}).listen(listen_port, err => {
    if(err) throw err;

    const msg = `Your server listen on port: http://localhost:${listen_port}`;
    console.log(msg);
})
