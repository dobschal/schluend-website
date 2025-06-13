import express from 'express';
import expressCms, {readData} from "@dobschal/express-cms";

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
    });
})

app.listen(port, () => {
    console.log(` ⚡️ Schlünd website running on port ${port}`)
})
