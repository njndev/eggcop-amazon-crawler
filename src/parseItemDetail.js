const Apify = require('apify');
const { log } = Apify.utils;

async function parseItemDetail($, request, requestQueue) {
    const item = {};
    let _total = 0;
    //Prepare product info
    const breadCrumbs = $('#wayfinding-breadcrumbs_feature_div').text().trim().split('\n')
        .filter(el => el.trim() != '')
        .map(el => el.trim())
    var productType = "default-type";
    if (breadCrumbs.length > 0)
        productType = breadCrumbs[breadCrumbs.length - 1];
    let _ASIN = $("#ASIN").val();
    if (!_ASIN) {
        var _url = request.url;
        let index = _url.indexOf('dp/');
        if (index > 0) {
            _ASIN = _url.slice(index, index + 13);
            _ASIN = _ASIN.replace("dp/", "");
        }
    }
    //var deliver = $("#glow-ingress-block").text() || "";
    //log.info(`deliver - ${deliver}`);
    let title = $('#productTitle').text() || "";
    item.Title = title.trim();
    log.info(`--------------CRAWLING ${item.Title}--------------`);
    item.Tags = "";
    item.ShopifyCollectionId = 0;
    item.CategoryId = 0;
    item.SeoName = "";
    item.Sku = _ASIN;
    item.Url = request.url;
    item.Description = $('#featurebullets_feature_div').length > 0 ? $('#featurebullets_feature_div').html() : "";
    if (!item.Description)
        item.Description = $('#aplus').length > 0 ? $('#aplus').html() : $('#productDescription').html();

    item.Status = "pending";
    item.ProductPictures = [];
    item.Variants = [];
    let price = $("#price_inside_buybox").text() || "";
    if (price == "")
        price = $("#priceblock_ourprice").text() || "";
    if (price == "")
        price = $("#newBuyBoxPrice").text() || "";

    if (price && price.indexOf("$") >= 0)
        price = price.replace("$", "");
    let priceValue = price != "" ? parseFloat(price) : 0;
    priceValue = priceValue || 0;
    let mainVariant = { Type: productType, TypeDescription: "", IsPrimaryShirt: true, Price: priceValue, ProductAttributeValueId: 0, ImageUrl: "", ShirtColors: [], Sizes: [] }
    //prepare sizes
    if ($("select[name='dropdown_selected_size_name']").length !== 0) {
        $("select[name='dropdown_selected_size_name'] option").each(function () {
            var size = $(this).text() || "";
            if ($(this).attr("value") != "-1" && size != "")
                mainVariant.Sizes.push({ SizeName: size, Price: 0 });
        });
    }
    item.Variants.push(mainVariant);
    //prepare variants
    let variants = [];
    if ($('.swatches').length !== 0) {
        //{"name":"twister_size_name"} size prefix
        //{"name":"twister_color_name"} color prefix
        //{"name":"twister_style_name"} style prefix
        $('.swatches').each(function () {
            let variantGroup = $(this).data("a-button-group");
            let variantGroupName = variantGroup["name"] || "twister_color_name";
            var squareItems = $(this).find("li");
            squareItems.each(function () {
                var name = $(this).attr('title');
                if (name && name.indexOf("Click to select") >= 0)
                    name = name.replace("Click to select ", "");
                var dpUrl = $(this).data('dp-url');
                var asin = $(this).data('defaultasin');
                if (!asin && dpUrl) {
                    asin = dpUrl.replace('/dp/', '');
                    if (asin.indexOf("/") > 0)
                        asin = asin.slice(0, asin.indexOf("/"))
                }
                if (!name)
                    name = $(this).text();
                name = name.trim();
                switch (variantGroupName) {
                    case "twister_color_name":
                        variants.push({type: "color", name: name, asin: asin, selected: asin == _ASIN });
                        break;
                    case "twister_style_name":
                        variants.push({ type: "style", name: name, asin: asin, selected: asin == _ASIN});
                        break;
                    case "twister_size_name":
                        variants.push({ type: "size", name: name, asin: asin, selected: asin == _ASIN });
                        //if (!mainVariant.Sizes.includes(name))
                        //    mainVariant.Sizes.push({ SizeName: name, Price: 0 });
                        break;
                    default: break;
                }
            });
        });
    }

    //get images
    let images = [];
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
    console.info(`Found ${images.length} image(s).`);
    item.ProductPictures = images;
    if (variants.length > 0) {
        //ensure variant asin is existed
        variants = variants.filter(v => v.asin != "");

        ///*
        //remove style if color variants are existed
        var styleVariants = variants.filter(v => v.type == "style");
        if (variants.filter(v => v.type == "color").length > 0 && styleVariants.length > 0) {
            variants = variants.filter(v => v.type != "style");
            for (let style of styleVariants) {
                log.info(`"**Remove style ${style.name} - ${style.asin} from variants"`);
            }
        }
        //*/
        _total = variants.length;
        //get current variant
        log.info(`">>> Navigate to ${_ASIN}"`);
        var currents = variants.filter(v => v.asin == _ASIN);
        if (currents.length > 0) {
            for (let current of currents) {
                //parse color
                if (current.type == "color") {
                    const variant = {};
                    variant.Color = current.name;
                    variant.Rgb = current.name;
                    variant.IsPreselect = true;
                    variant.ImageUrl = "";
                    variant.SunfrogSKU = _ASIN;
                    variant.Price = priceValue;
                    variant.Sides = [];
                    for (let image of images) {
                        if (!variant.ImageUrl)
                            variant.ImageUrl = image;
                        variant.Sides.push({ ImageUrl: image, Side: "Front", IsPreselect: image == images[0] });
                    }
                    item.Variants[0].ShirtColors.push(variant);
                }
                //parse size
                if (current.type == "size") {
                    if (!item.Variants[0].Sizes.includes(current.name))
                        item.Variants[0].Sizes.push({ SizeName: current.name, Price: priceValue });
                }

                //remove current variant
                let index = variants.indexOf(current);
                if (index > -1)
                    variants.splice(index, 1);

                log.info(`"_______Variant ${current.type} ${current.name} - parsed: ${_total - variants.length}/${_total} variants"`);
            }
        }
        //continue parse variants
        let _continue = variants[0];
        await requestQueue.addRequest({
            url: `https://www.amazon.com/dp/${_continue.asin}?_encoding=UTF8&psc=1`,
            userData: {
                label: 'variant',
                itemDetail: item,
                asin: _continue.asin,
                variants: variants,
                total: _total
            },
        }, { forefront: true });
    }
    else {
        item.Status = "completed";
    }

    return item;
}

module.exports = parseItemDetail;
