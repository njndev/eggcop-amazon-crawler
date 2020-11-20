const Apify = require('apify');
const { log } = Apify.utils;

async function parseImportLink($, request, requestQueue) {
    const item = {};
    item.Url = request.url;
    item.Title = $('#productTitle').text();
    item.Code = $("#ASIN").text();
    var images = [];
    if ($('script:contains("ImageBlockATF")').length !== 0) {
        const scriptText = $('script:contains("ImageBlockATF")').html();
        if (scriptText.indexOf("'colorImages':").length !== 0
            && scriptText.indexOf("'colorToAsin'").length !== 0
            && scriptText.indexOf("'initial': ").length !== 0) {
            const textParse = scriptText.split("'colorImages':")[1].split("'colorToAsin'")[0].trim().replace("'initial': ", '').replace(/(},$|^{)/g, '');
            const parsedImageArray = JSON.parse(textParse);
            for (const image of parsedImageArray) {
                if (image.hiRes && image.hiRes !== null) {
                    images.push(image.hiRes);
                } else if (image.large && image.large !== null) {
                    images.push(image.large);
                } else {
                    log.info(`Bad image, report to github, please (debug info item url: ${request.url})`);
                }
            }
        }
    }
    item.Image = images[0]  || '';
    item.Platform = "amazon";
    return item;
}

module.exports = parseImportLink;
