import express from 'express';
import expressCms, {readData} from "@dobschal/express-cms";
import {collectImages, formatDate, renderRichText} from "./lib/format.js";

const app = express()
const port = 3004

expressCms(app, {
    models: {
        concerts: {
            title: "text",
            date: "text",
            link: "text",
        },
        music: {
            title: "text",
            releaseDate: "text",
            spotify: "text",
            bandcamp: "text",
            image: "text",
        },
        photos: {
            author: "text",
            file: "file",
        },
        recommendations: {
            author: "text",
            text: "longtext",
        },
        blog: {
            title: "text",
            date: "date",
            content: "longtext",
            image: "image",
            image2: "image",
            image3: "image",
            image4: "image",
        }
    }
});

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/{*splat}', async (req, res) => {
    res.render("index", {
        concerts: readData("concerts"),
        musicItems: readData("music"),
        photos: readData("photos"),
        recommendations: readData("recommendations"),
        blogEntries: readData("blog").sort((a, b) => new Date(b.date) - new Date(a.date)),
        collectImages,
        formatDate,
        renderRichText,
    });
})

app.listen(port, () => {
    console.log(` ⚡️ Schlünd website running on port ${port}`)
})
