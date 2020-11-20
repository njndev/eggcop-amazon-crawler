// The comment below makes sure that eslint ignores variables from inside
// of the webpage (eq. $ for jQuery and window)
/* global $ */
const Apify = require('apify');
const { getOriginUrl } = require('./utils');

const { log } = Apify.utils;

async function extractItemDetails($, request) {
    const originUrl = await getOriginUrl(request);
    const itemUrls = [];
    const items = $('.s-result-list [data-asin]');
    if (items.length !== 0) {
        items.each(function () {
            const asin = $(this).attr('data-asin');
            if (asin) {
                const itemUrl = `https://www.amazon.com/dp/${asin}`;
                itemUrls.push(itemUrl);
            }
        });
    }
    return itemUrls;
}

async function parseItemUrls($, request) {
    const urls = await extractItemDetails($, request);
    log.info(`Found ${urls.length} on a site, going to crawl them. URL: ${request.url}`);
    return urls;
}

module.exports = { parseItemUrls };
