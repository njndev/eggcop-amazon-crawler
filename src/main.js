/* global $, window */
const Apify = require('apify');
const cheerio = require('cheerio');
const createSearchUrls = require('./createSearchUrls');
const CloudFlareUnBlocker = require('./unblocker');
const runCrawler = require('./runCrawler');
const { updateCookies } = require('./updateCookies');

const { log } = Apify.utils;
// TODO: Add an option to limit number of results for each keyword
Apify.main(async () => {
    // Get queue and enqueue first url.
    const requestQueue = await Apify.openRequestQueue();
    const input = await Apify.getValue('INPUT');
    const env = await Apify.getEnv();
    const { scraper, maxResults } = input;
    let limitResults = maxResults === 0 ? maxResults : maxResults * 3;
    limitResults = !maxResults ? null : limitResults; //handle undefined or null
    const urls = await createSearchUrls(input);

    for (const searchUrl of urls) {
        console.log(searchUrl.url);
        await requestQueue.addRequest(searchUrl);
    }
    const proxyConfiguration = { ...input.proxy };
    const cloudFlareUnBlocker = new CloudFlareUnBlocker({
        proxyConfiguration,
    });

    // Create crawler.
    const crawler = new Apify.BasicCrawler({
        requestQueue,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: 30,
            persistStateKeyValueStoreId: 'amazon-sessions',
            sessionOptions: {
                maxUsageCount: 50,
            },
        },
        maxConcurrency: input.maxConcurrency || 5,
        maxRequestsPerCrawl: limitResults || null,
        handlePageTimeoutSecs: 2.5 * 60,
        persistCookiesPerSession: true,
        handleRequestFunction: async ({ request, session }) => {
            // log.info(session.id);
            if(input.delivery !== ''){
                let kukies = await Apify.getValue('puppeteerCookies');
                if (!kukies) {
                    const puppeteerCookies = await updateCookies({domain: request.userData.domain});
                    kukies = puppeteerCookies;
                    await Apify.setValue('puppeteerCookies',puppeteerCookies);
                }
                const cookies = [];
                kukies.forEach(kukie => {
                    if (kukie.name === "sp-cdn") {
                        cookies.push({name: kukie.name, value: kukie.value});
                    }
                });
                session.setPuppeteerCookies(cookies, request.url);
            }
            // console.log(kukies)
            // log.info(session.getCookieString(request.url));
            const responseRequest = await cloudFlareUnBlocker.unblock({ request, session });
            const $ = cheerio.load(responseRequest.body);
            // to handle blocked requests
            const title = $('title').length !== 0 ? $('title').text().trim() : '';
            const { statusCode } = responseRequest;
            if (statusCode !== 200
                || title.includes('Robot Check')
                || title.includes('CAPTCHA')
                || title.includes('Toutes nos excuses')
                || title.includes('Tut uns Leid!')
                || title.includes('Service Unavailable Error')) {
                session.retire();
                // dont mark this request as bad, it is probably looking for working session
                request.retryCount--;
                // dont retry the request right away, wait a little bit
                await Apify.utils.sleep(5000);
                throw new Error('Session blocked, retiring. If you see this for a LONG time, stop the run - you don\'t have any working proxy right now.'
                    + ' But by default this can happen for some time until we find working session.');
            }
            await runCrawler({$, session, request, requestQueue, input, env});
        },
        handleFailedRequestFunction: async ({ request }) => {
            log.info(`Request ${request.url} failed 4 times`);
            await Apify.setValue(`bug_${Math.random()}.html`, $('body').html(), { contentType: 'text/html' });
        },
    });

    const pptr = new Apify.PuppeteerCrawler({
        requestQueue,
        launchPuppeteerOptions: {
            headless: true,
            slowMo: Apify.isAtHome() ? 100 : undefined,
        },
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: 30,
            persistStateKeyValueStoreId: 'amazon-sessions',
            sessionOptions: {
                maxUsageCount: 50,
            },
        },
        maxConcurrency: input.maxConcurrency || 5,
        maxRequestsPerCrawl: limitResults || null,
        handlePageTimeoutSecs: 2.5 * 60,
        handleRequestTimeoutSecs: 60,
        persistCookiesPerSession: true,
        handlePageFunction: async ({ page, request, session }) => {
            const { url, userData, userData: { label } } = request;
            try {
                await page.waitFor(3000);
                await page.waitForSelector('#a-popover-root');
            } catch (e) {
                await page.waitFor(10000);
                await page.waitForSelector('body')
            }
            const pageHTML = await page.evaluate(() => {
                return document.body.outerHTML;
            });
            const $ = cheerio.load(pageHTML);
            await runCrawler({$, session, request, requestQueue, input, env});
        },
        handleFailedRequestFunction: async ({ page, request }) => {
            log.info(`Request ${request.url} failed 4 times`);
            const html = await page.evaluate(() => document.body.outerHTML);
            const $ = cheerio.load(html);
            await Apify.setValue(`bug_${Math.random()}.html`, $('body').html(), { contentType: 'text/html' });
        },
    })
    scraper === true ? await pptr.run() : await crawler.run();
});
