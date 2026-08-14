const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

// Markdown-Link [Text](Ziel) oder eine nackte URL. Die Markdown-Variante steht
// zuerst, damit die URL innerhalb eines Links nicht ein zweites Mal getroffen wird.
const RICH_TEXT_PATTERN = /\[([^\]\n]+)]\(([^)\s]+)\)|(https?:\/\/[^\s<]+)/g;
const ALLOWED_HREF = /^(https?:\/\/|mailto:|\/)/i;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, character => HTML_ESCAPES[character]);
}

function anchor(href, label) {
    if (!ALLOWED_HREF.test(href)) {
        return `[${label}](${href})`; // Unerlaubtes Ziel bleibt sichtbarer Text
    }
    const isExternal = !href.startsWith("/");
    return `<a href="${href}"${isExternal ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
}

/**
 * Wandelt das Datum aus dem CMS ("YYYY-MM-DD") in "TT.MM.JJJJ" um.
 * Handgetippte Werte in anderem Format bleiben unverändert.
 * @param {string} value
 * @returns {string}
 */
export function formatDate(value) {
    if (typeof value !== "string") return "";
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (!match) return value;
    const [, year, month, day] = match;
    return `${day}.${month}.${year}`;
}

/**
 * Rendert Fließtext aus dem CMS als HTML. Unterstützt bewusst nur ein enges Subset:
 * [Text](https://…), nackte URLs, **fett**, Leerzeile = Absatz, Umbruch = <br>.
 * HTML wird vorher escaped, es kann also nichts aus dem Textfeld durchkommen.
 * @param {string} text
 * @returns {string} HTML, mit <%- %> ausgeben
 */
export function renderRichText(text) {
    if (typeof text !== "string" || !text.trim()) return "";
    const withLinks = escapeHtml(text).replace(RICH_TEXT_PATTERN, (match, label, href, bareUrl) => {
        if (!bareUrl) return anchor(href, label);
        const trailing = TRAILING_PUNCTUATION.exec(bareUrl)?.[0] ?? "";
        const url = bareUrl.slice(0, bareUrl.length - trailing.length);
        return anchor(url, url) + trailing;
    });
    return withLinks
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .split(/\n\s*\n/)
        .map(block => block.trim())
        .filter(Boolean)
        .map(block => `<p>${block.replace(/\n/g, "<br>")}</p>`)
        .join("");
}

/**
 * Sammelt die gefüllten Bild-Slots eines Blogeintrags in DOM-Reihenfolge.
 * Das CMS legt pro "image"-Feld zusätzlich ein <feld>_thumbnail an (300x300).
 * @param {object} entry
 * @returns {{full: string, thumbnail: string}[]}
 */
export function collectImages(entry) {
    return ["image", "image2", "image3", "image4"]
        .filter(field => entry[field])
        .map(field => ({
            full: entry[field],
            thumbnail: entry[`${field}_thumbnail`] || entry[field],
        }));
}
