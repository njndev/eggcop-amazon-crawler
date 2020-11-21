const Apify = require('apify');
const { parseItemUrls } = require('./parseItemUrls');
const parsePaginationUrl = require('./parsePaginationUrl');
const { saveItem, getOriginUrl } = require('./utils');
const detailParser = require('./parseItemDetail');
const importLinkParser = require('./parseImportLink');
const variantParser = require('./parseVariant');
const { log } = Apify.utils;
async function runCrawler(params) {
    const {$, session, request, requestQueue, input, env} = params;
    const { label } = request.userData;
    const urlOrigin = await getOriginUrl(request);
    if (label === 'page') {
        // solve pagination if on the page, now support two layouts
        const enqueuePagination = await parsePaginationUrl($, request);
        if (enqueuePagination !== false) {
            log.info(`Adding new pagination of search ${enqueuePagination}`);
            await requestQueue.addRequest({
                url: enqueuePagination,
                userData: {
                    label: 'page',
                    keyword: request.userData.keyword,
                },
            });
        }
        // add items to the queue
        try {
            const itemUrls = await parseItemUrls($, request);
            for (const itemUrl of itemUrls) {
                await requestQueue.addRequest({
                    url: itemUrl,
                    userData: {
                        label: 'detail',
                    },
                }, { forefront: true });
            }

            if (itemUrls.length === 0) {
                await Apify.pushData({
                    status: 'No items for this keyword.',
                    url: request.url,
                    keyword: request.userData.keyword,
                });
            }
        } catch (error) {
            await Apify.pushData({
                status: 'No items for this keyword.',
                url: request.url,
                keyword: request.userData.keyword,
            });
        }
    } else if (label === 'detail') {
        try {
            var detail = await detailParser($, request, requestQueue);
            if (detail.Status == "completed") {
                log.info(`--------------COMPLETED ${detail.Title}--------------`);
                await saveItem('RESULT', request, detail, input, env.defaultDatasetId);
            }
        } catch (e) {
            log.error('Detail parsing failed', e);
            await saveItem('NORESULT', request, null, input, env.defaultDatasetId);
        }
    } else if (label === 'link') {
        try {
            var link = await importLinkParser($, request, requestQueue);
            await saveItem('RESULT', request, link, input, env.defaultDatasetId);
        } catch (e) {
            log.error('Link parsing failed', e);
            await saveItem('NORESULT', request, null, input, env.defaultDatasetId);
        }
    }
    else if (label === 'variant') {
        try {
            var product = await variantParser($, request, requestQueue);
            if (product.Status == "completed") {
                log.info(`--------------COMPLETED ${product.Title}--------------`);
                await saveItem('RESULT', request, product, input, env.defaultDatasetId);
            }
        } catch (e) {
            log.error('Variant parsing failed', e);
        }
    }
}

module.exports = runCrawler;
