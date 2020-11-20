const Apify = require('apify');

const { log } = Apify.utils;

function getCatPath(category) {
    return `&i=${category}`;
}

function getBaseUrl() {
    return 'https://www.amazon.com/';
}

async function createSearchUrls(input) {
    let searchUrlBase;
    const urlsToProcess = [];
    if ((!input.search)) {
        throw new Error('Keywords/Url required');
    }
    if (!input.searchType) {
        throw new Error('SearchType required');
    }
    if (input.searchType === "keywords") {
        try {
            searchUrlBase = getBaseUrl();
            const cat = getCatPath(input.category);
            if (input.search.length !== 0) {
                if (input.search.indexOf(',').length !== -1) {
                    const keywords = input.search.split(',');
                    for (const keyword of keywords) {
                        urlsToProcess.push({
                            url: `${searchUrlBase}s?k=${keyword.replace(/\s+/g, '+').trim()}&i=${cat}&ref=nb_sb_noss`,
                            userData: {
                                label: 'page',
                                keyword,
                                domain: searchUrlBase
                            },
                        });
                    }
                } else {
                    urlsToProcess.push({
                        url: `${searchUrlBase}s?k=${input.search.replace(/\s+/g, '+').trim()}`,
                        userData: {
                            label: 'page',
                            keyword: input.search,
                            domain: searchUrlBase
                        },
                    });
                }
            }
        } catch (e) {
            log.error(JSON.stringify(e));
        }
    }

    if (input.searchType === "productUrl" ) {
        try {
            if (input.search.indexOf(',').length !== -1) {
                const urls = input.search.split(",");
                for (const url of urls) {
                    const request = {
                        url: url,
                        userData: {
                            label: 'detail',
                            domain: url.split('/').splice(0, 3).filter(el => el !== "").join('//'),
                        }
                    };
                    urlsToProcess.push(request)
                }
            } else {
                const request = {
                    url: input.search,
                    userData: {
                        label: 'detail',
                        domain: input.search.split('/').splice(0, 3).filter(el => el !== "").join('//'),
                    }
                };
                urlsToProcess.push(request)
            }
        } catch (e) {
            log.error(JSON.stringify(e));
        }
    }
    if (urlsToProcess.length !== 0) {
        log.info(`Going to enqueue ${urlsToProcess.length} requests from input.`);
        return urlsToProcess;
    }

    throw new Error('Can\'t add any requests, check your input.');
}

module.exports = createSearchUrls;
