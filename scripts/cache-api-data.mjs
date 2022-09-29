import fs from 'fs';

import doFetchItems from '../src/features/items/do-fetch-items.js';
import doFetchBarters from '../src/features/barters/do-fetch-barters.js';
import doFetchCrafts from '../src/features/crafts/do-fetch-crafts.js';
import doFetchTraders from '../src/features/traders/do-fetch-traders.js';
import doFetchMaps from '../src/features/maps/do-fetch-maps.js';

const langs = [
    'es',
    'de',
    'fr',
    'cz',
    'hu',
    'it',
    'jp',
    'pl',
    'pt',
    'ru',
    'sk',
    'tr',
    'zh',
];

console.time('Caching API data');
try {
    const apiPromises = [];
    apiPromises.push(doFetchItems('en', true).then(items => {
        for (const item of items) {
            item.lastLowPrice = 0;
            item.avg24hPrice = 0;
            item.buyFor = item.buyFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
            item.sellFor = item.sellFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
            item.cached = true;
        }
        fs.writeFileSync('./src/data/items.json', JSON.stringify(items));
    }));
    apiPromises.push(new Promise(resolve => {
        const itemLangs = {};
        const itemLangPromises = [];
        for (const lang of langs) {
            itemLangPromises.push(doFetchItems(lang, true).then(items => {
                const localization = {};
                items.forEach(item => {
                    localization[item.id] =  {
                        name: item.name,
                        shortName: item.shortName
                    };
                });
                itemLangs[lang] = localization;
            }));
        }
        Promise.all(itemLangPromises).then(() => {
            fs.writeFileSync(`./src/data/items_locale.json`, JSON.stringify(itemLangs));
            resolve();
        });
    }));

    apiPromises.push(doFetchBarters('en').then(barters => {
        for (const barter of barters) {
            barter.rewardItems.forEach(containedItem => {
                const item = containedItem.item;
                item.lastLowPrice = 0;
                item.avg24hPrice = 0;
                item.buyFor = item.buyFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.sellFor = item.sellFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.cached = true;
            });
            barter.requiredItems.forEach(containedItem => {
                const item = containedItem.item;
                item.lastLowPrice = 0;
                item.avg24hPrice = 0;
                item.buyFor = item.buyFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.sellFor = item.sellFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.cached = true;
            });
            barter.cached = true;
        }
        fs.writeFileSync('./src/data/barters.json', JSON.stringify(barters));
    }));

    apiPromises.push(doFetchCrafts('en').then(crafts => {
        for (const craft of crafts) {
            craft.rewardItems.forEach(containedItem => {
                const item = containedItem.item;
                item.lastLowPrice = 0;
                item.avg24hPrice = 0;
                item.buyFor = item.buyFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.sellFor = item.sellFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.cached = true;
            });
            craft.requiredItems.forEach(containedItem => {
                const item = containedItem.item;
                item.lastLowPrice = 0;
                item.avg24hPrice = 0;
                item.buyFor = item.buyFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.sellFor = item.sellFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
                item.cached = true;
            });
            craft.cached = true;
        }
        fs.writeFileSync('./src/data/crafts.json', JSON.stringify(crafts));
    }));

    apiPromises.push(doFetchTraders('en').then(traders => {
        fs.writeFileSync('./src/data/traders.json', JSON.stringify(traders));
    }));
    apiPromises.push(new Promise(resolve => {
        const traderLangs = {};
        const traderLangPromises = [];
        for (const lang of langs) {
            traderLangPromises.push(doFetchTraders(lang, true).then(traders => {
                const localization = {};
                traders.forEach(trader => {
                    localization[trader.id] =  {
                        name: trader.name
                    };
                });
                traderLangs[lang] = localization;
            }));
        }
        Promise.all(traderLangPromises).then(() => {
            fs.writeFileSync(`./src/data/traders_locale.json`, JSON.stringify(traderLangs));
            resolve();
        });
    }));

    apiPromises.push(doFetchMaps('en').then(maps => {
        fs.writeFileSync('./src/data/maps_cached.json', JSON.stringify(maps));
    }));

    await Promise.all(apiPromises);
} catch (error) {
    console.log(error);
}
console.timeEnd('Caching API data');
