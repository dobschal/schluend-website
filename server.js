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
        }
    }
});

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/{*splat}', async (req, res) => {
    res.render("index", {
        concerts: readData("concerts"),
        musicItems: readData("music"),
    });
})

app.listen(port, () => {
    console.log(` ⚡️ Schlünd website running on port ${port}`)
})
