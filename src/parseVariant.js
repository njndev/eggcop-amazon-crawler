const Apify = require('apify');
const { log } = Apify.utils;
async function parseVariant($, request, requestQueue) {
    const { url, userData } = request;
    const { itemDetail, asin, variants } = userData;
    let current = variants.filter(v => v.asin == asin)[0];
    let availables = variants.filter(p => p.asin != asin);
    const variant = {};
    log.info(`">>> Navigate to variant: ${current.name} - ${current.asin}"`);
    variant.Color = current.name;
    variant.Rgb = current.name;
    variant.IsPreselect = current.selected;
    variant.ImageUrl = "";
    variant.SunfrogSKU = asin;
    variant.Sides = [];
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
    for (let image of images) {
        if (!variant.ImageUrl)
            variant.ImageUrl = image;

        variant.Sides.push({ ImageUrl: image, Side: "Front", IsPreselect: image == images[0] });
    }
    itemDetail.Variants[0].ShirtColors.push(variant);
    availables = availables || [];
    if (availables.length > 0) {
        let preselected = availables[0];
        await requestQueue.addRequest({
            url: `https://www.amazon.com/dp/${preselected.asin}?_encoding=UTF8&psc=1`,
            userData: {
                label: 'variant',
                itemDetail: itemDetail,
                asin: preselected.asin,
                variants: availables
            },
        }, { forefront: true });
    }
    else 
        itemDetail.Status = "completed";
    return itemDetail;
}

module.exports = parseVariant;
