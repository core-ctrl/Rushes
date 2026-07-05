const fs = require('fs');
const https = require('https');
const path = require('path');

const sizes = [72, 96, 128, 192, 512];
const dir = path.join(__dirname, 'public/favicons');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

sizes.forEach(size => {
    const url = `https://res.cloudinary.com/dkrvtfbor/image/upload/c_pad,w_${size},h_${size},b_black/v1782761174/RUSHES_uupcnx.png`;
    const dest = path.join(dir, `icon-${size}.png`);
    
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close();  
            console.log(`Downloaded icon-${size}.png`);
        });
    }).on('error', function(err) {
        fs.unlink(dest);
        console.error(`Error downloading ${size}:`, err.message);
    });
});
