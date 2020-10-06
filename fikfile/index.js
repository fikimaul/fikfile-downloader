const fs = require('fs'),
    http = require('http'),
    https = require('https'),
    dotenv = require('dotenv'),
    path = require('path'),
    liburl = require('url');
    _colors = require('colors');
    cliProgress = require('cli-progress');
    client = http;

dotenv.config();
const data_source = require(process.env.DATA_SOURCE);
let receivedBytes = 0, totalBytes = 0;

const b1 = new cliProgress.SingleBar({
    format: 'Downloading Progress |' + _colors.green('{bar}') + '| {percentage}%',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});


async function doDownloadFile(url) {
    const filePath = process.env.SAVE_PATH;

    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath)
    }

    console.log("Downloading File ... ");
    let res = await doRequest(url);
    totalBytes = res.headers['content-length'];
    await new Promise(resolve => {
        let filename, contentDisp = res.headers['content-disposition'];
        if (contentDisp && /^attachment/i.test(contentDisp)) {
            filename = contentDisp.toLowerCase()
                .split('filename=')[1]
                .split(';')[0]
                .replace(/"/g, '');
        } else {
            filename = path.basename(liburl.parse(url).path);
        }
        b1.start(totalBytes, 0, {
            speed: "N/A"
        });
        res.on("data", chunk => {
            receivedBytes += chunk.length;
            b1.increment();
            b1.update(receivedBytes);
        });
        var file = fs.createWriteStream(filePath + "/" + filename);
        res.pipe(file);
        file.on('finish', function () {
            b1.stop();
            console.log("File Saved : " + filePath + "/" + filename);
            console.log("=====================");
            totalBytes = 0;
            receivedBytes = 0;
        });

        file.on("close", resolve);
        file.on("error", console.error);
    })
}

function doRequest(url) {
    let client = (url.match(/^https:/)) ? https : client;
    return new Promise((resolve, reject) => {
        let req = client.get(url);
        req.on('response', res => {
            resolve(res);
        });
        req.on('error', err => {
            reject(err);
        });
    });
}

async function DownloadFile() {
    console.log("Total File : " + data_source.length);
    console.log("=====================");
    for (const i in data_source) {
        await doDownloadFile(data_source[i]);
    }
    ;
    console.log("Done..");
    console.log("=====================");
}


module.exports = {DownloadFile};
