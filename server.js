const express = require('express');
const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/upload', async (req, res) => {
    const { fileUrl } = req.body;

    if (!fileUrl) {
        console.error('fileUrl is missing in request body');
        res.status(400).send('fileUrl is required');
        return;
    }

    console.log('Received request to download:', fileUrl);

    try {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(__dirname, fileName);
        const fileStream = fs.createWriteStream(filePath);

        const response = await request({
            uri: fileUrl,
            resolveWithFullResponse: true,
            encoding: null
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
            console.log(`File downloaded successfully: ${fileName}`);
            res.status(200).send(`File downloaded successfully: ${fileName}`);
        });

        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            res.status(500).send('File download failed');
        });

    } catch (err) {
        console.error('Request error:', err.message);
        res.status(500).send('An error occurred while downloading the file');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
