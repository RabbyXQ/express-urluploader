const express = require('express');
const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

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
        return res.status(400).send('fileUrl is required');
    }

    console.log('Received request to download:', fileUrl);

    try {
        // Generate a unique file name
        const fileName = `${crypto.randomBytes(16).toString('hex')}.tmp`;
        const filePath = path.join(os.tmpdir(), fileName);
        const fileStream = fs.createWriteStream(filePath);

        // Download and save the file
        const response = await request({
            uri: fileUrl,
            resolveWithFullResponse: true,
            encoding: null
        });

        if (response.statusCode === 403) {
            console.error('Access denied to the file. Status Code: 403');
            return res.status(403).send('Access denied to the file');
        } else if (response.statusCode >= 400) {
            console.error('Failed to download file. Status Code:', response.statusCode);
            return res.status(response.statusCode).send('Failed to download file');
        }

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
