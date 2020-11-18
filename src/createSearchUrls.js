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
  
    if ((!input.keywords) && (!input.productUrl)) {
        throw new Error('Keywords/Url required');
    }
    if (!input.searchType) {
        throw new Error('SearchType required');
    }
    if (input.searchType === "keywords") {
        try {
            searchUrlBase = getBaseUrl();
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

        }
    }

    if (input.searchType === "productUrl" ) {
        try {
            try {
                request.userData.domain = input.search;
                urlsToProcess.push(request);
            } catch (e) {
                const searchUrl =  input.search;
                for (const url of searchUrl.split(","))   {
                    const request = {
                        url: url,
                        userData:{
                            // label: url.includes('/s?k=') ? 'page' : 'detail',
                            label: 'page',
                            domain: url.split('/').splice(0,3).filter(el => el!== "").join('//'),
                            // keyword: url.split('s?k=').pop().split('&')[0].replace('+',' ')
                        }
                    };
                    urlsToProcess.push(request)
                }
            }
        } catch (e) {

        }

    }

    if (input.keywords) {
        searchUrlBase = getBaseUrl();
        if (input.keywords.length !== 0) {
            if (input.keywords.indexOf(',').length !== -1) {
                const keywords = input.keywords.split(',');
                for (const keyword of keywords) {
                    urlsToProcess.push({
                        url: `${searchUrlBase}s?k=${keyword.replace(/\s+/g, '+').trim()}`,
                        userData: {
                            label: 'page',
                            keyword,
                        },
                    });
                }
            } else {
                urlsToProcess.push({
                    url: `${searchUrlBase}s?k=${input.keywords.replace(/\s+/g, '+').trim()}`,
                    userData: {
                        label: 'page',
                        keyword: input.keywords,
                    },
                });
            }
        }
    }

    if (input.productUrl) {
        urlsToProcess.push(input.productUrl);
    }
    if (urlsToProcess.length !== 0) {
        log.info(`Going to enqueue ${urlsToProcess.length} requests from input.`);
        return urlsToProcess;
    }

    throw new Error('Can\'t add any requests, check your input.');
}

module.exports = createSearchUrls;
