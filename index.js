const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const authHeader = ""; // APIKEY
const apiUrl = ""; // API URL
const delayMs = 2000;  // 2 secs delay
const imageCount = 100; // Number of images to download

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getUniqueFileName = () => {
    let nextNumber = 1;
    let filePath;

    do {
        filePath = path.join(__dirname, `${nextNumber}.jpg`);
        nextNumber++;
    } while (fs.existsSync(filePath));

    return filePath;
};

const calculateHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

const isDuplicateImage = (buffer) => {
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.jpg'));
    const fileHashes = files.map(file => {
        const filePath = path.join(__dirname, file);
        const fileBuffer = fs.readFileSync(filePath);
        return calculateHash(fileBuffer);
    });

    return fileHashes.includes(calculateHash(buffer));
};

const saveImage = async () => {
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: authHeader
            }
        });

        const imageUrl = response.data.file;
        console.log('Image URL:', imageUrl);

        const imageResponse = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        const imageBuffer = Buffer.from(imageResponse.data);

        if (isDuplicateImage(imageBuffer)) {
            console.log('Duplicate image detected. Skipping...');
            return;
        }

        const imagePath = getUniqueFileName();
        fs.writeFileSync(imagePath, imageBuffer);
        console.log('Image saved successfully:', imagePath);
    } catch (error) {
        console.error('Error fetching or saving the image:', error.response ? error.response.data : error.message);
    }
};

const saveMultipleImages = async (count) => {
    for (let i = 0; i < count; i++) {
        console.log(`Attempt ${i + 1}`);
        await saveNsfwImage();
        if (i < count - 1) { // Avoid delay after the last image
            await delay(delayMs);
        }
    }
};

saveMultipleImages(imageCount);
