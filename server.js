import express from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from "node:crypto";

const app = express()
const port = 3000
const password = "574e80594b0528fea3e72810690107337df9a5b245ee193ed84e88fb16627ea0938a6de3bd9856f34a39e779ed02591fc10d6cd9303c67ab8b8e3d88a1cd58fd";
const salt = "9e91b9c85710750b07c7013b2e21f5a3";

app.set('view engine', 'ejs')
app.use(express.json());
app.use(express.static('public'))

app.post('/login', (req, res) => {
    const hashedPassword = hashPassword(req.body.password, salt);
    if (hashedPassword.hash === password) {
        res.send({success: 'Login successful'});
    } else {
        res.status(401).send({error: 'Login failed'});
    }
})

app.post('/data', (req, res) => {
    console.log("Data received:", req.body);
    const hashedPassword = hashPassword(req.body.password, salt);
    if (hashedPassword.hash !== password) {
        return res.status(401).send({error: 'Unauthorized'});
    }
    writeDataToFile(`public/data/${req.body.selectedData}.json`, req.body.data);

    res.send({success: 'Yeah!'});
})

app.get('/{*splat}', async (req, res) => {
    res.render("index", {
        concerts: readDataFromFile('public/data/concerts.json'),
        musicItems: readDataFromFile('public/data/music.json'),
    });
})

app.listen(port, () => {
    console.log(`⚡️ Schlünd website running on port ${port}`)
})

function writeDataToFile(filePath, data) {
    const absolutePath = path.resolve(filePath)
    fs.writeFileSync(absolutePath, data, 'utf8');
}

function readDataFromFile(filePath) {
    const absolutePath = path.resolve(filePath)
    try {
        const data = fs.readFileSync(absolutePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading file from disk: ${err}`);
        return null;
    }
}

function hashPassword(password, salt) {
    salt = salt ?? crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return {salt, hash};
}
