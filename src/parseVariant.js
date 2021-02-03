const Apify = require('apify');
const { log } = Apify.utils;
async function parseVariant($, request, requestQueue) {
    const { url, userData } = request;
    const { itemDetail, asin, variants, total } = userData;
    let _availables = variants;
    let _currents = _availables.filter(v => v.asin == asin);

    log.info(`">>> Navigate to ${asin}"`);
    //get variant price
    let price = $("#price_inside_buybox").text() || "";
    if (price == "")
        price = $("#priceblock_ourprice").text() || "";
    if (price == "")
        price = $("#newBuyBoxPrice").text() || "";
    if (price && price.indexOf("$") >= 0)
        price = price.replace("$", "");
    let priceValue = price != "" ? parseFloat(price) : 0;
    priceValue = priceValue || 0;
    //get variant images
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

    for (let current of _currents) {
        //parse style
        if (current.type == "style") {
            //on parse style
        }

        //parse color
        if (current.type == "color") {
            const variant = {};
            variant.Color = current.name;
            variant.Rgb = current.name;
            variant.IsPreselect = current.selected;
            variant.ImageUrl = "";
            variant.SunfrogSKU = current.asin;
            variant.Price = priceValue;
            variant.Sides = [];
            for (let image of images) {
                if (!variant.ImageUrl)
                    variant.ImageUrl = image;
                variant.Sides.push({ ImageUrl: image, Side: "Front", IsPreselect: image == images[0] });
            }
            itemDetail.Variants[0].ShirtColors.push(variant);
        }
        //parse size
        if (current.type == "size") {
            if (!itemDetail.Variants[0].Sizes.includes(current.name))
                itemDetail.Variants[0].Sizes.push({ SizeName: current.name, Price: priceValue });
        }

        //remove current variant
        let index = _availables.indexOf(current);
        if (index > -1)
            _availables.splice(index, 1);

        log.info(`"_______Variant ${current.type} ${current.name} - parsed: ${total - variants.length}/${total} variants"`);
    }

    //remove current variant
    if (_availables.length > 0) {
        let _continue = _availables[0];
        await requestQueue.addRequest({
            url: `https://www.amazon.com/dp/${_continue.asin}?_encoding=UTF8&psc=1`,
            userData: {
                label: 'variant',
                itemDetail: itemDetail,
                asin: _continue.asin,
                variants: _availables,
                total: total
            },
        }, { forefront: true });
    }
    else {
        //prepare variant price
        for (let mainVariant of itemDetail.Variants) {
            if (mainVariant.Sizes.length > 0) {
                let minSizePrice = Math.min.apply(null, mainVariant.Sizes.map(s => s.Price)) || 0;
                if (minSizePrice == 0) {
                    for (let size of mainVariant.Sizes) {
                        if (size.Price == 0)
                            size.Price = Math.max.apply(null, mainVariant.Sizes.map(s => s.Price));
                    }
                }
                let basePrice = Math.min.apply(null, mainVariant.Sizes.map(s => s.Price)) || 0;
                mainVariant.Price = +basePrice.toFixed(2);
                //size price adjustment
                for (let size of mainVariant.Sizes) {
                    size.Price = size.Price > basePrice ? +(size.Price - basePrice).toFixed(2) : 0;
                }
            }
            //validate
            if (!mainVariant.Price)
                mainVariant.Price = 0;
        }
        if (itemDetail.ProductPictures.length == 0 && images.length>0)
            itemDetail.ProductPictures = images;
        itemDetail.Status = "completed";
    }
    return itemDetail;
}

module.exports = parseVariant;
