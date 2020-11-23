const Apify = require('apify');
const { log } = Apify.utils;

async function parseItemDetail($, request, requestQueue) {
    const item = {};

    //Prepare product info
    const breadCrumbs = $('#wayfinding-breadcrumbs_feature_div').text().trim().split('\n')
        .filter(el => el.trim() != '')
        .map(el => el.trim())
    var productType = "default-type";
    if (breadCrumbs.length > 0)
        productType = breadCrumbs[breadCrumbs.length - 1];
    let _ASIN = $("#ASIN").val();
    if (!_ASIN) {
        var link = $("link[rel='canonical']").attr("href");
        if (link.indexOf("dp/")>0) {
            let arr = link.split('dp/');
            _ASIN = arr[arr.length - 1];
        }
    }

    let title = $('#productTitle').text() || "";
    item.Title = title.trim();
    log.info(`--------------CRAWLING ${item.Title}--------------`);
    item.Tags = "";
    item.ShopifyCollectionId = 0;
    item.CategoryId = 0;
    item.SeoName = "";
    item.Sku = _ASIN;
    item.Url = request.url;
    item.Description = $('#featurebullets_feature_div').length !== 0 ? $('#featurebullets_feature_div').html() : "";
    if (!item.Description)
        item.Description = $('#productDescription').length !== 0 ? $('#productDescription').html() : null;
    item.Status = "pending";
    item.ProductPictures = [];
    item.Variants = [];
 
    let price = $("#price_inside_buybox").text() || "";
    if (price == "")
        price = $("#priceblock_ourprice").text() || "";

    if (price && price.indexOf("$") >= 0)
        price = price.replace("$", "");
    let priceValue = price != "" ? parseFloat(price) : 0;
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
            log.info(JSON.stringify(variantGroup));
            var squareItems = $(this).find("li");
            squareItems.each(function () {
                var name = $(this).attr('title');
                if (name && name.indexOf("Click to select") >= 0)
                    name = name.replace("Click to select ", "");
                var asin = $(this).data('defaultasin');
                if (!name)
                    name = $(this).text();
                name = name.trim();
                if (variantGroupName == "twister_color_name" || variantGroupName == "twister_style_name")
                    variants.push({ name: name, asin: asin, selected: asin == _ASIN });
                else {
                    if (!mainVariant.Sizes.includes(sizename))
                        mainVariant.Sizes.push({ SizeName: name, Price: 0 });
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
    if (variants.length > 0) {
        var current = variants.filter(v => v.asin == _ASIN)[0];
        if (current) {
            const variant = {};
            log.info(`"Prepare variant: ${current.name} - ${_ASIN}"`);
            variant.Color = current.name;
            variant.Rgb = current.name;
            variant.IsPreselect = true;
            variant.ImageUrl = "";
            variant.SunfrogSKU = _ASIN;
            variant.Sides = [];
            for (let image of images) {
                if (!variant.ImageUrl)
                    variant.ImageUrl = image;
                variant.Sides.push({ ImageUrl: image, Side: "Front", IsPreselect: image == images[0] });
            }
            item.Variants[0].ShirtColors.push(variant);
            //remove current variant
            variants = variants.filter(v => v.asin != _ASIN);
        }
        //continue parse variants
        let _continue = variants[0];
        await requestQueue.addRequest({
            url: `https://www.amazon.com/dp/${_continue.asin}?_encoding=UTF8&psc=1`,
            userData: {
                label: 'variant',
                itemDetail: item,
                asin: _continue.asin,
                variants: variants
            },
        }, { forefront: true });
    }
    else {
        item.ProductPictures = images;
        item.Status = "completed";
    }

    return item;
}

module.exports = parseItemDetail;
