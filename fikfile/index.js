var fs      = require('fs'),
   http     = require('http'),
   https    = require('https'),
   dotenv   = require('dotenv'),
   path     = require('path'),
   ProgressBar = require('progress'),
   liburl   = require('url')
   client  = http

   dotenv.config();
var data_source = require(process.env.DATA_SOURCE)

async function doDownloadFile(url){
   var filePath = process.env.SAVE_PATH

   if(!fs.existsSync(filePath)){
      fs.mkdirSync(filePath)
   }
   
   console.log("Downloading File ... ")
   let res = await doRequest(url);

   await new Promise(resolve=> {
      var filename, contentDisp = res.headers['content-disposition'];
      
      if (contentDisp && /^attachment/i.test(contentDisp)) {
         filename = contentDisp.toLowerCase()
            .split('filename=')[1]
            .split(';')[0]
            .replace(/"/g, '');
      }else{
         filename = path.basename(liburl.parse(url).path);
      }

      var file = fs.createWriteStream(filePath+"/"+filename)
      res.pipe(file)
      file.on('finish', function() {
         console.log("File Saved : "+filePath+"/"+filename)
         console.log("=====================")
      })
      
      file.on("close", resolve)
      file.on("error", console.error)
   })
}

function doRequest(url) {
   client=(url.match(/^https:/)) ? https : client;
   return new Promise ((resolve, reject) => {
     let req = client.get(url)
     req.on('response', res => {
		 var len = parseInt(res.headers['content-length'], 10);
		if(!len)
			len = 10;
	  
	  let bar = new ProgressBar('  downloading [:bar] :rate/bps :percent :etas', {
		complete: '\u2588',
		incomplete: ' ',
		width: 20,
		total: len
	  });
	 
	  res.on('data', function (chunk) {
		bar.tick(chunk.length);
	  });
      
	  res.on('end', function () {
		  bar.terminate();
		console.log('\n');
	  });
  
	  resolve(res);
     });
     
	 req.on('error', err => {
       reject(err);
     });
		
	 req.end();
   }); 
}

async function DownloadFile(){
   console.log("Total File : "+data_source.length);
   console.log("=====================");   
   for(var i in data_source ){
      await doDownloadFile(data_source[i])
   };
   console.log("Done..");
   console.log("=====================");
}

module.exports  = {DownloadFile}
