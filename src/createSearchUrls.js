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
  
    if ((!input.keywords) && (!input.directUrls) && (!input.search)) {
        throw new Error('Keywords/Asins required');
    }
    if (!input.searchType) {
        throw new Error('SearchType required');
    }
    if (input.searchType === "keywords") {
        try {
            searchUrlBase = getBaseUrl();
            const cat = input.country.toUpperCase() == 'US' ? getCatPath(input.category) : ``;
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

    if (input.searchType === "directUrls" ) {
        try {
            try {
                const directSearchUrl = JSON.parse(input.search)
                for (const request of directSearchUrl) {
                    request.userData.domain = getBaseUrl();
                    urlsToProcess.push(request);
                }
            } catch (e) {
                const directSearchUrl =  input.search;
                for (const url of directSearchUrl.split(","))   {
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
    //Handle older schema
    if (input.asins) {
        for (const item of input.asins) {
            for (const country of item.countries) {
                searchUrlBase = getBaseUrl();
                const sellerUrl = `${searchUrlBase}gp/offer-listing/${item.asin}`;
                urlsToProcess.push({
                    url: sellerUrl,
                    userData: {
                        label: 'seller',
                        asin: item.asin,
                        detailUrl: `${searchUrlBase}dp/${item.asin}`,
                        sellerUrl,
                        country: country.toUpperCase(),
                    },
                });
            }
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

    if (input.directUrls) {
        for (const request of input.directUrls) {
            urlsToProcess.push(request);
        }
    }
    if (urlsToProcess.length !== 0) {
        log.info(`Going to enqueue ${urlsToProcess.length} requests from input.`);
        return urlsToProcess;
    }

    throw new Error('Can\'t add any requests, check your input.');
}

module.exports = createSearchUrls;
