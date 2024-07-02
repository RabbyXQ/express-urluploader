const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/upload', async (req, res) => {
    const { fileUrl, filename, extension } = req.body;

    if (!fileUrl) {
        console.error('fileUrl is missing in request body');
        return res.status(400).send('fileUrl is required');
    }

    // Default filename and extension if not provided
    const safeFilename = filename || crypto.randomBytes(16).toString('hex');
    const safeExtension = extension ? `.${extension.replace(/^\./, '')}` : '.tmp';
    const fileName = `${safeFilename}${safeExtension}`;
    const filePath = path.join(__dirname, fileName);

    console.log('Received request to download:', fileUrl);
    console.log('Saving file as:', filePath);

    try {
        // Start downloading the file
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
        });

        // Debug: Print response status code and headers
        console.log('Response Status Code:', response.status);
        console.log('Response Headers:', response.headers);

        if (response.status === 403) {
            console.error('Access denied to the file. Status Code: 403');
            return res.status(403).send('Access denied to the file');
        } else if (response.status >= 400) {
            console.error('Failed to download file. Status Code:', response.status);
            return res.status(response.status).send('Failed to download file');
        }

        // Pipe response data to file
        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);

        fileStream.on('finish', () => {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return res.status(500).send('Error getting file stats');
                }
                console.log(`File downloaded successfully: ${fileName}, Size: ${stats.size} bytes`);
                res.status(200).send(`File downloaded successfully: ${fileName}`);
            });
        });

        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            res.status(500).send('File download failed');
        });

    } catch (err) {
        console.error('Request error:', err.message);
        res.status(500).send(`An error occurred while downloading the file: ${err.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
