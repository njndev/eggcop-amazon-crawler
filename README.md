# Amazon Scraper

- [Features](#features)
- [Sample result](#sample-result)
- [Proxy](#proxy)
- [Asin crawling](#asin-crawling)
- [Direct URLs crawling](#direct-urls-crawling)
- [Compute unit consumption](#compute-unit-consumption)
- [Changelog](#changelog)

## Features

This actor will crawl items for specified keywords on Amazon and will automatically extract all pages for those keywords. The scraper then extracts all seller offers for each given keyword, so if there is pagination on the seller offers page, note that you will get all offers.

Find out more about why you should use this scraper for your business and suggestions on how to use the data in this [YouTube Video](https://www.youtube.com/watch?v=BsidLZKdYWQ).

## Sample result
```
[{
  "Title": "Argyle Face Mask Neck Warmer",
  "Description": "<div class=\"product-description\" style=\"text-align: center;\"><strong>NECK GAITER</strong></div>\n<div class=\"product-description\" style=\"text-align: center;\">&nbsp;</div>\n<div class=\"product-description\">&nbsp;This neck gaiter is a versatile accessory that can be used as a face covering, headband, bandana, wristband, and neck warmer. Upgrade your accessory game and find a matching face shield for each of your outfits. <br /><br />&bull; 95% polyester, 5% elastane (fabric composition may vary by 1%)<br />&bull; Fabric weight: 6.19 oz/yd&sup2; (210 g/m&sup2;)<br />&bull; Breathable fabric<br />&bull; Washable and reusable<br />&bull; Four-way stretch fabric that stretches and recovers on the cross and lengthwise grains<br />&bull; One size<br />&bull; Printed on one side, reverse side is left blank</div>",
  "Sku": null,
  "Url": null,
  "SeoName": null,
  "Slug": null,
  "CategoryId": 0,
  "Variants": [
    {
      "Type": "Neck Gaiter",
      "TypeDescription": "",
      "Price": 18.99,
      "ShirtColors": [],
      "ProductAttributeValueId": 0,
      "IsPrimaryShirt": true,
      "ImageUrl": "",
      "SunfrogSKU": null,
      "Sizes": [
        {
          "SizeName": "ONE ITEM",
          "Price": 0
        },
        {
          "SizeName": "PACK 3",
          "Price": 27
        },
        {
          "SizeName": "PACK 5",
          "Price": 41
        },
        {
          "SizeName": "PACK 10",
          "Price": 81
        }
      ]
    }
  ],
  "ShopifyCollectionId": 0,
  "Tags": null,
  "ProductPictures": [
    "https://sportychimp.com/wp-content/uploads/2020/04/blue-red-classic-argyle-face-mask-neck-gaiter-headband-gear.jpg"
  ]
},
{
  "Title": "Bandage Stripe Spaghetti Face Mask Neck Warmer",
  "Description": "<div class=\"product-description\" style=\"text-align: center;\"><strong>NECK GAITER</strong></div>\n<div class=\"product-description\" style=\"text-align: center;\">&nbsp;</div>\n<div class=\"product-description\">&nbsp;This neck gaiter is a versatile accessory that can be used as a face covering, headband, bandana, wristband, and neck warmer. Upgrade your accessory game and find a matching face shield for each of your outfits. <br /><br />&bull; 95% polyester, 5% elastane (fabric composition may vary by 1%)<br />&bull; Fabric weight: 6.19 oz/yd&sup2; (210 g/m&sup2;)<br />&bull; Breathable fabric<br />&bull; Washable and reusable<br />&bull; Four-way stretch fabric that stretches and recovers on the cross and lengthwise grains<br />&bull; One size<br />&bull; Printed on one side, reverse side is left blank</div>",
  "Sku": null,
  "Url": null,
  "SeoName": null,
  "Slug": null,
  "CategoryId": 0,
  "Variants": [
    {
      "Type": "Neck Gaiter",
      "TypeDescription": "",
      "Price": 18.99,
      "ShirtColors": [],
      "ProductAttributeValueId": 0,
      "IsPrimaryShirt": true,
      "ImageUrl": "",
      "SunfrogSKU": null,
      "Sizes": [
        {
          "SizeName": "ONE ITEM",
          "Price": 0
        },
        {
          "SizeName": "PACK 3",
          "Price": 27
        },
        {
          "SizeName": "PACK 5",
          "Price": 41
        },
        {
          "SizeName": "PACK 10",
          "Price": 81
        }
      ]
    }
  ],
  "ShopifyCollectionId": 0,
  "Tags": null,
  "ProductPictures": [
    "https://sportychimp.com/wp-content/uploads/2020/04/black-stripe-spaghetti-bandage-face-mask-neck-gaiter-headband-gear.jpg"
  ]}]
```
## Proxy
The actor needs proxies to function correctly. We don't recommend running it on a free account for more than a sample of results. If you plan to run it for more than a few results, subscribing to the Apify platform will give you access to a large pool of proxies.


## Product URLs crawling
If you already have your ASINs and don't want to crawl them manually, you can enqueue the requests from the input.


## Additional options
maxResults - If you want to limit the number of results to be extracted, set this value with that number of results, otherwise keep it blank or 0. It doesn't work 100% precisely, in that, if you specify five results, it will create more records because of concurrency.

## Compute unit consumption
Using raw requests - 0.0884 CU when extracting 20 results from keyword search
Using a browser - 0.6025 CU when extracting 20 results from keyword search

## Supported countries * US - https://www.amazon.com


## Changelog
Changes related to new versions are listed in the [CHANGELOG file](https://github.com/VaclavRut/actor-amazon-crawler/blob/master/CHANGELOG.md).
