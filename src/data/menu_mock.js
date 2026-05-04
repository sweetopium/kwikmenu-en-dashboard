export const simpleMenuPayload = {
    "defaultLanguage": "ru",
    "settings": {
        "templateType": "simple-menu",
        "showItemImages": false,
        "theme": "skuratov",
        "showLocalSubcategoryNav": false,
        "variantsLayout": "rows",
        "showVariantPrices": true,
        "addonsMode": "separate-category"
    },
    "languages": [
        {
            "code": "ru",
            "shortLabel": "RU",
            "nativeName": "Русский",
            "flag": "🇷🇺"
        }
    ],
    "venue": {
        "name": "Skuratov Coffee",
        "description": "Собственная обжарка и формат брю-бара: классика, спешлы, сезонные напитки, выпечка, десерты, завтраки и лёгкая еда."
    },
    "categories": [
        {
            "id": "classic-drinks",
            "name": "Классика",
            "description": "Классические кофейные напитки. Можно приготовить кофе без кофеина; допшот эспрессо +110 ₽.",
            "items": [
                {
                    "id": "skuratov-espresso",
                    "name": "Скуратов эспрессо",
                    "price": "280 ₽"
                },
                {
                    "id": "seasonal-espresso",
                    "name": "Сезонный эспрессо",
                    "price": "310 ₽"
                },
                {
                    "id": "espresso-set",
                    "name": "Эспрессо-сет",
                    "price": "570 ₽"
                },
                {
                    "id": "americano",
                    "name": "Американо",
                    "variants": [
                        {
                            "id": "americano-250ml",
                            "label": "250 мл",
                            "price": "250 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1
                        },
                        {
                            "id": "americano-350ml",
                            "label": "350 мл",
                            "price": "310 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2
                        },
                        {
                            "id": "americano-450ml",
                            "label": "450 мл",
                            "price": "390 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3
                        }
                    ]
                },
                {
                    "id": "filter-coffee",
                    "name": "Фильтр-кофе",
                    "variants": [
                        {
                            "id": "filter-coffee-250ml",
                            "label": "250 мл",
                            "price": "310 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1
                        },
                        {
                            "id": "filter-coffee-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2
                        },
                        {
                            "id": "filter-coffee-450ml",
                            "label": "450 мл",
                            "price": "450 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3
                        }
                    ]
                },
                {
                    "id": "filter-coffee-cherry",
                    "name": "Фильтр-кофе с вишней",
                    "price": "370 ₽",
                    "measureValue": 350,
                    "measureUnit": "ml"
                },
                {
                    "id": "v60",
                    "name": "Воронка V60",
                    "price": "410 ₽"
                },
                {
                    "id": "cappuccino",
                    "name": "Капучино",
                    "variants": [
                        {
                            "id": "cappuccino-250ml",
                            "label": "250 мл",
                            "price": "290 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1
                        },
                        {
                            "id": "cappuccino-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2
                        },
                        {
                            "id": "cappuccino-450ml",
                            "label": "450 мл",
                            "price": "420 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3
                        }
                    ]
                },
                {
                    "id": "latte",
                    "name": "Латте",
                    "variants": [
                        {
                            "id": "latte-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 1
                        },
                        {
                            "id": "latte-450ml",
                            "label": "450 мл",
                            "price": "420 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 2
                        }
                    ]
                },
                {
                    "id": "flat-white",
                    "name": "Флет Уайт",
                    "price": "290 ₽"
                },
                {
                    "id": "matcha-latte",
                    "name": "Матча латте",
                    "variants": [
                        {
                            "id": "matcha-latte-250ml",
                            "label": "250 мл",
                            "price": "430 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1
                        },
                        {
                            "id": "matcha-latte-350ml",
                            "label": "350 мл",
                            "price": "490 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2
                        },
                        {
                            "id": "matcha-latte-450ml",
                            "label": "450 мл",
                            "price": "530 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3
                        }
                    ]
                },
                {
                    "id": "cocoa",
                    "name": "Какао",
                    "variants": [
                        {
                            "id": "cocoa-250ml",
                            "label": "250 мл",
                            "price": "450 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml"
                        },
                        {
                            "id": "cocoa-350ml",
                            "label": "350 мл",
                            "price": "490 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml"
                        }
                    ]
                },
                {
                    "id": "bean-to-bar-cocoa",
                    "name": "Какао Бин Ту Бар",
                    "variants": [
                        {
                            "id": "bean-to-bar-cocoa-350ml",
                            "label": "350 мл",
                            "price": "510 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml"
                        }
                    ]
                },
                {
                    "id": "americano-seasonal-espresso",
                    "name": "Американо на сезонном эспрессо",
                    "price": "350 ₽"
                }
            ]
        },
        {
            "id": "special-drinks",
            "name": "Спешл",
            "items": [
                {
                    "id": "vanilla-raf",
                    "name": "Ванильный раф",
                    "price": "470 ₽"
                },
                {
                    "id": "citrus-raf",
                    "name": "Раф с цитрусами",
                    "price": "490 ₽"
                },
                {
                    "id": "halva-latte",
                    "name": "Латте с халвой",
                    "price": "450 ₽"
                },
                {
                    "id": "peanut-latte",
                    "name": "Латте с арахисом",
                    "price": "470 ₽"
                },
                {
                    "id": "salted-caramel-latte",
                    "name": "Латте с соленой карамелью",
                    "price": "450 ₽"
                }
            ]
        },
        {
            "id": "cold-drinks",
            "name": "Холодные напитки",
            "items": [
                {
                    "id": "bumble",
                    "name": "Бамбл",
                    "price": "550 ₽",
                    "measureValue": 300,
                    "measureUnit": "ml"
                },
                {
                    "id": "espresso-tonic",
                    "name": "Эспрессо-тоник",
                    "variants": [
                        {
                            "id": "espresso-tonic-400ml",
                            "label": "400 мл",
                            "price": "410 ₽",
                            "measureValue": 400,
                            "measureUnit": "ml"
                        },
                        {
                            "id": "espresso-tonic-500ml",
                            "label": "500 мл",
                            "price": "470 ₽",
                            "measureValue": 500,
                            "measureUnit": "ml"
                        }
                    ]
                },
                {
                    "id": "homemade-lemonade",
                    "name": "Домашний лимонад",
                    "variants": [
                        {
                            "id": "homemade-lemonade-400ml",
                            "label": "400 мл",
                            "price": "390 ₽",
                            "measureValue": 400,
                            "measureUnit": "ml"
                        },
                        {
                            "id": "homemade-lemonade-500ml",
                            "label": "500 мл",
                            "price": "430 ₽",
                            "measureValue": 500,
                            "measureUnit": "ml"
                        }
                    ]
                },
                {
                    "id": "cold-brew",
                    "name": "Колд брю",
                    "price": "350 ₽"
                },
                {
                    "id": "cold-brew-cherry",
                    "name": "Колд брю с вишней",
                    "price": "410 ₽"
                },
                {
                    "id": "nitro",
                    "name": "Нитро",
                    "price": "430 ₽",
                    "description": "Есть везде, кроме кофейни в Аптекарском огороде."
                },
                {
                    "id": "air-latte",
                    "name": "Эйр Латте",
                    "price": "470 ₽",
                    "description": "Есть везде, кроме кофейни в Аптекарском огороде."
                }
            ]
        },
        {
            "id": "seasonal-drinks",
            "name": "Сезонное",
            "description": "Сезонное меню «Весна зеленая».",
            "items": [
                {
                    "id": "filter-strawberry-tarragon",
                    "name": "Фильтр с клубникой и тархуном",
                    "variants": [
                        {
                            "id": "filter-strawberry-tarragon-250ml",
                            "label": "250 мл",
                            "price": "310 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml"
                        },
                        {
                            "id": "filter-strawberry-tarragon-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml"
                        },
                        {
                            "id": "filter-strawberry-tarragon-450ml",
                            "label": "450 мл",
                            "price": "450 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml"
                        }
                    ]
                },
                {
                    "id": "matcha-raspberry-foam",
                    "name": "Матча-латте с малиновой пеной",
                    "variants": [
                        {
                            "id": "matcha-raspberry-foam-350ml",
                            "label": "350 мл",
                            "price": "470 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml"
                        },
                        {
                            "id": "matcha-raspberry-foam-450ml",
                            "label": "450 мл",
                            "price": "490 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml"
                        }
                    ]
                },
                {
                    "id": "mint-melissa-latte",
                    "name": "Латте с мятой и мелиссой",
                    "variants": [
                        {
                            "id": "mint-melissa-latte-350ml",
                            "label": "350 мл",
                            "price": "450 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml"
                        },
                        {
                            "id": "mint-melissa-latte-450ml",
                            "label": "450 мл",
                            "price": "490 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml"
                        }
                    ]
                },
                {
                    "id": "sea-buckthorn-honey",
                    "name": "Облепиха-мёд",
                    "price": "450 ₽"
                },
                {
                    "id": "rosehip",
                    "name": "Шиповник",
                    "price": "390 ₽"
                },
                {
                    "id": "tea-without-tea",
                    "name": "Чай без чая",
                    "description": "Сезонный некофейный напиток."
                }
            ]
        },
        {
            "id": "add-ons",
            "name": "Допы, сиропы",
            "description": "Овсяное, обезжиренное молоко и кофе без кофеина доступны; миндальное или кокосовое молоко +90 ₽; допшот эспрессо +110 ₽.",
            "items": [
                {
                    "id": "extra-espresso-shot",
                    "name": "Допшот эспрессо",
                    "price": "110 ₽"
                },
                {
                    "id": "decaf",
                    "name": "Кофе без кофеина",
                    "price": "100 ₽"
                },
                {
                    "id": "almond-coconut-milk",
                    "name": "Миндальное / кокосовое молоко",
                    "price": "90 ₽"
                },
                {
                    "id": "oat-skimmed-milk",
                    "name": "Овсяное / обезжиренное молоко",
                    "description": "Доступно как замена молока."
                },
                {
                    "id": "syrup",
                    "name": "Сироп",
                    "description": "Уточните доступные вкусы у бариста."
                }
            ]
        },
        {
            "id": "cookies-and-buns",
            "name": "Печенья и булочки",
            "items": [
                {
                    "id": "oat-cookie",
                    "name": "Печенье овсяное",
                    "price": "230 ₽"
                },
                {
                    "id": "chocolate-cookie",
                    "name": "То самое шоколадное печенье",
                    "price": "270 ₽"
                },
                {
                    "id": "peanut-cookie",
                    "name": "Печенье арахисовое",
                    "price": "230 ₽"
                },
                {
                    "id": "canele",
                    "name": "Канеле",
                    "price": "250 ₽"
                },
                {
                    "id": "banana-bread",
                    "name": "Банановый хлеб",
                    "price": "280 ₽"
                },
                {
                    "id": "condensed-milk-tube",
                    "name": "Трубочка со сгущенкой",
                    "price": "280 ₽"
                },
                {
                    "id": "raisin-roll",
                    "name": "Улитка с изюмом",
                    "price": "360 ₽"
                },
                {
                    "id": "blueberry-danish",
                    "name": "Дэниш с голубикой",
                    "price": "530 ₽"
                },
                {
                    "id": "currant-galette",
                    "name": "Галета со смородиной",
                    "price": "310 ₽"
                },
                {
                    "id": "almond-croissant",
                    "name": "Круассан миндальный",
                    "price": "460 ₽"
                },
                {
                    "id": "christmas-cake",
                    "name": "Рождественский кекс",
                    "price": "380 ₽"
                },
                {
                    "id": "poppy-bun",
                    "name": "Маковая булочка",
                    "price": "290 ₽"
                },
                {
                    "id": "cardamom-bun",
                    "name": "Булка с кардамоном",
                    "price": "320 ₽"
                }
            ]
        },
        {
            "id": "food",
            "name": "Плотно перекусить",
            "items": [
                {
                    "id": "sous-vide-chicken-croissant",
                    "name": "Круассан с курой су-вид",
                    "price": "610 ₽"
                },
                {
                    "id": "ham-mozzarella-croissant",
                    "name": "Круассан с ветчиной и моцареллой",
                    "price": "610 ₽"
                },
                {
                    "id": "salmon-croissant",
                    "name": "Круассан с лососем",
                    "price": "695 ₽"
                },
                {
                    "id": "blueberry-pie",
                    "name": "Черничный пирог",
                    "price": "470 ₽"
                },
                {
                    "id": "san-sebastian-cheesecake",
                    "name": "Чизкейк Сан-Себастьян",
                    "price": "490 ₽"
                },
                {
                    "id": "mortadella-curd-cheese-sandwich",
                    "name": "Сендвич мортаделла с творожным сыром",
                    "price": "550 ₽"
                },
                {
                    "id": "turkey-pastrami-cherry-sandwich",
                    "name": "Сендвич пастрами из индейки и томленая вишня",
                    "price": "560 ₽"
                },
                {
                    "id": "chicken-sandwich",
                    "name": "Сэндвич с курицей",
                    "price": "590 ₽"
                },
                {
                    "id": "duck-sandwich",
                    "name": "Сэндвич с уткой",
                    "price": "650 ₽"
                }
            ]
        },
        {
            "id": "breakfasts-in-jar",
            "name": "Завтраки в банке",
            "items": [
                {
                    "id": "grain-porridge",
                    "name": "Злаковая каша",
                    "price": "330 ₽"
                },
                {
                    "id": "granola-strawberry-yogurt",
                    "name": "Гранола с клубникой и йогуртом",
                    "price": "360 ₽"
                }
            ]
        }
    ],
    "wifi": {
        "ssid": "Skuratov_Guest",
        "password": "coffee2026",
        "note": "Демо-данные Wi‑Fi. Замените сеть и пароль на реальные перед публикацией."
    }
};