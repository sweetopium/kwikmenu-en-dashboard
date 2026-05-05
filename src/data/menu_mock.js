export const simpleMenuPayload = {
    "schemaVersion": 2,
    "defaultLanguage": "ru",
    "currency": "RUB",
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
        },
        {
            "code": "en",
            "shortLabel": "EN",
            "nativeName": "English",
            "flag": "🇬🇧"
        }
    ],
    "menuMeta": {
        "id": "main-menu",
        "slug": "main-menu",
        "name": "Основное меню",
        "description": "Основное меню кофейни с классическими напитками, сезонными позициями и едой.",
        "translations": {
            "en": {
                "name": "Main Menu",
                "description": "Core coffee shop menu with classic drinks, seasonal specials, and food."
            }
        }
    },
    "venue": {
        "name": "Skuratov Coffee",
        "description": "Собственная обжарка и формат брю-бара: классика, спешлы, сезонные напитки, выпечка, десерты, завтраки и лёгкая еда.",
        "logoUrl": null,
        "coverImageUrl": null
    },
    "categories": [
        {
            "id": "classic-drinks",
            "name": "Классика",
            "description": "Классические кофейные напитки. Можно приготовить кофе без кофеина; допшот эспрессо +110 ₽.",
            "sortOrder": 1,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "skuratov-espresso",
                    "name": "Скуратов эспрессо",
                    "price": "280 ₽",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Skuratov Espresso"
                        }
                    }
                },
                {
                    "id": "seasonal-espresso",
                    "name": "Сезонный эспрессо",
                    "price": "310 ₽",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Seasonal Espresso"
                        }
                    }
                },
                {
                    "id": "espresso-set",
                    "name": "Эспрессо-сет",
                    "price": "570 ₽",
                    "sortOrder": 3,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Espresso Set"
                        }
                    }
                },
                {
                    "id": "americano",
                    "name": "Американо",
                    "sortOrder": 4,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "americano-250ml",
                            "label": "250 мл",
                            "price": "250 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "250 ml"
                                }
                            }
                        },
                        {
                            "id": "americano-350ml",
                            "label": "350 мл",
                            "price": "310 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "americano-450ml",
                            "label": "450 мл",
                            "price": "390 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Americano"
                        }
                    }
                },
                {
                    "id": "filter-coffee",
                    "name": "Фильтр-кофе",
                    "sortOrder": 5,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "filter-coffee-250ml",
                            "label": "250 мл",
                            "price": "310 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "250 ml"
                                }
                            }
                        },
                        {
                            "id": "filter-coffee-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "filter-coffee-450ml",
                            "label": "450 мл",
                            "price": "450 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Filter Coffee"
                        }
                    }
                },
                {
                    "id": "filter-coffee-cherry",
                    "name": "Фильтр-кофе с вишней",
                    "price": "370 ₽",
                    "measureValue": 350,
                    "measureUnit": "ml",
                    "sortOrder": 6,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Cherry Filter Coffee"
                        }
                    }
                },
                {
                    "id": "v60",
                    "name": "Воронка V60",
                    "price": "410 ₽",
                    "sortOrder": 7,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "V60 Pour Over"
                        }
                    }
                },
                {
                    "id": "cappuccino",
                    "name": "Капучино",
                    "sortOrder": 8,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "cappuccino-250ml",
                            "label": "250 мл",
                            "price": "290 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "250 ml"
                                }
                            }
                        },
                        {
                            "id": "cappuccino-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "cappuccino-450ml",
                            "label": "450 мл",
                            "price": "420 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Cappuccino"
                        }
                    }
                },
                {
                    "id": "latte",
                    "name": "Латте",
                    "sortOrder": 9,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "latte-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "latte-450ml",
                            "label": "450 мл",
                            "price": "420 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Latte"
                        }
                    }
                },
                {
                    "id": "flat-white",
                    "name": "Флет Уайт",
                    "price": "290 ₽",
                    "sortOrder": 10,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Flat White"
                        }
                    }
                },
                {
                    "id": "matcha-latte",
                    "name": "Матча латте",
                    "sortOrder": 11,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "matcha-latte-250ml",
                            "label": "250 мл",
                            "price": "430 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "250 ml"
                                }
                            }
                        },
                        {
                            "id": "matcha-latte-350ml",
                            "label": "350 мл",
                            "price": "490 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "matcha-latte-450ml",
                            "label": "450 мл",
                            "price": "530 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [
                        "vegetarian",
                        "contains-dairy"
                    ],
                    "badge": "hit",
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Matcha Latte"
                        }
                    }
                },
                {
                    "id": "cocoa",
                    "name": "Какао",
                    "sortOrder": 12,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "cocoa-250ml",
                            "label": "250 мл",
                            "price": "450 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "250 ml"
                                }
                            }
                        },
                        {
                            "id": "cocoa-350ml",
                            "label": "350 мл",
                            "price": "490 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        }
                    ],
                    "tags": [
                        "vegetarian",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Cocoa"
                        }
                    }
                },
                {
                    "id": "bean-to-bar-cocoa",
                    "name": "Какао Бин Ту Бар",
                    "sortOrder": 13,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "bean-to-bar-cocoa-350ml",
                            "label": "350 мл",
                            "price": "510 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        }
                    ],
                    "tags": [
                        "vegetarian",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Bean-to-Bar Cocoa"
                        }
                    }
                },
                {
                    "id": "americano-seasonal-espresso",
                    "name": "Американо на сезонном эспрессо",
                    "price": "350 ₽",
                    "sortOrder": 14,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Americano with Seasonal Espresso"
                        }
                    }
                }
            ],
            "availableHours": null,
            "translations": {
                "en": {
                    "name": "Classics",
                    "description": "Classic coffee drinks. Decaf is available; extra espresso shot +110 RUB."
                }
            }
        },
        {
            "id": "special-drinks",
            "name": "Спешл",
            "sortOrder": 2,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "vanilla-raf",
                    "name": "Ванильный раф",
                    "price": "470 ₽",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "citrus-raf",
                    "name": "Раф с цитрусами",
                    "price": "490 ₽",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "halva-latte",
                    "name": "Латте с халвой",
                    "price": "450 ₽",
                    "sortOrder": 3,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "contains-nuts",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "peanut-latte",
                    "name": "Латте с арахисом",
                    "price": "470 ₽",
                    "sortOrder": 4,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "contains-nuts",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "salted-caramel-latte",
                    "name": "Латте с соленой карамелью",
                    "price": "450 ₽",
                    "sortOrder": 5,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "vegetarian",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                }
            ],
            "availableHours": null,
            "translations": {
                "en": {
                    "name": "Specials"
                }
            }
        },
        {
            "id": "cold-drinks",
            "name": "Холодные напитки",
            "sortOrder": 3,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "bumble",
                    "name": "Бамбл",
                    "price": "550 ₽",
                    "measureValue": 300,
                    "measureUnit": "ml",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "espresso-tonic",
                    "name": "Эспрессо-тоник",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "espresso-tonic-400ml",
                            "label": "400 мл",
                            "price": "410 ₽",
                            "measureValue": 400,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "400 ml"
                                }
                            }
                        },
                        {
                            "id": "espresso-tonic-500ml",
                            "label": "500 мл",
                            "price": "470 ₽",
                            "measureValue": 500,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "500 ml"
                                }
                            }
                        }
                    ],
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "homemade-lemonade",
                    "name": "Домашний лимонад",
                    "sortOrder": 3,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "homemade-lemonade-400ml",
                            "label": "400 мл",
                            "price": "390 ₽",
                            "measureValue": 400,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "400 ml"
                                }
                            }
                        },
                        {
                            "id": "homemade-lemonade-500ml",
                            "label": "500 мл",
                            "price": "430 ₽",
                            "measureValue": 500,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "500 ml"
                                }
                            }
                        }
                    ],
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "cold-brew",
                    "name": "Колд брю",
                    "price": "350 ₽",
                    "sortOrder": 4,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": "new",
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "cold-brew-cherry",
                    "name": "Колд брю с вишней",
                    "price": "410 ₽",
                    "sortOrder": 5,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "nitro",
                    "name": "Нитро",
                    "description": "Есть везде, кроме кофейни в Аптекарском огороде.",
                    "price": "430 ₽",
                    "sortOrder": 6,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "air-latte",
                    "name": "Эйр Латте",
                    "description": "Есть везде, кроме кофейни в Аптекарском огороде.",
                    "price": "470 ₽",
                    "sortOrder": 7,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                }
            ],
            "availableHours": null,
            "translations": {
                "en": {
                    "name": "Cold Drinks"
                }
            }
        },
        {
            "id": "seasonal-drinks",
            "name": "Сезонное",
            "description": "Сезонное меню «Весна зеленая».",
            "sortOrder": 4,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "filter-strawberry-tarragon",
                    "name": "Фильтр с клубникой и тархуном",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "filter-strawberry-tarragon-250ml",
                            "label": "250 мл",
                            "price": "310 ₽",
                            "measureValue": 250,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "250 ml"
                                }
                            }
                        },
                        {
                            "id": "filter-strawberry-tarragon-350ml",
                            "label": "350 мл",
                            "price": "370 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "filter-strawberry-tarragon-450ml",
                            "label": "450 мл",
                            "price": "450 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 3,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [],
                    "badge": "season",
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "matcha-raspberry-foam",
                    "name": "Матча-латте с малиновой пеной",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "matcha-raspberry-foam-350ml",
                            "label": "350 мл",
                            "price": "470 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "matcha-raspberry-foam-450ml",
                            "label": "450 мл",
                            "price": "490 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [
                        "vegetarian",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "mint-melissa-latte",
                    "name": "Латте с мятой и мелиссой",
                    "sortOrder": 3,
                    "isAvailable": true,
                    "imageUrl": null,
                    "variants": [
                        {
                            "id": "mint-melissa-latte-350ml",
                            "label": "350 мл",
                            "price": "450 ₽",
                            "measureValue": 350,
                            "measureUnit": "ml",
                            "sortOrder": 1,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "350 ml"
                                }
                            }
                        },
                        {
                            "id": "mint-melissa-latte-450ml",
                            "label": "450 мл",
                            "price": "490 ₽",
                            "measureValue": 450,
                            "measureUnit": "ml",
                            "sortOrder": 2,
                            "isAvailable": true,
                            "translations": {
                                "en": {
                                    "label": "450 ml"
                                }
                            }
                        }
                    ],
                    "tags": [
                        "vegetarian",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "sea-buckthorn-honey",
                    "name": "Облепиха-мёд",
                    "price": "450 ₽",
                    "sortOrder": 4,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "vegetarian",
                        "caffeine-free"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Sea Buckthorn & Honey"
                        }
                    }
                },
                {
                    "id": "rosehip",
                    "name": "Шиповник",
                    "price": "390 ₽",
                    "sortOrder": 5,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Rosehip"
                        }
                    }
                },
                {
                    "id": "tea-without-tea",
                    "name": "Чай без чая",
                    "description": "Сезонный некофейный напиток.",
                    "sortOrder": 6,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "vegan",
                        "caffeine-free"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "Tea Without Tea",
                            "description": "Seasonal caffeine-free signature drink."
                        }
                    }
                }
            ],
            "availableHours": null,
            "translations": {
                "en": {
                    "name": "Seasonal Menu",
                    "description": "Seasonal menu “Green Spring”."
                }
            }
        },
        {
            "id": "add-ons",
            "name": "Допы, сиропы",
            "description": "Овсяное, обезжиренное молоко и кофе без кофеина доступны; миндальное или кокосовое молоко +90 ₽; допшот эспрессо +110 ₽.",
            "sortOrder": 5,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "extra-espresso-shot",
                    "name": "Допшот эспрессо",
                    "price": "110 ₽",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "decaf",
                    "name": "Кофе без кофеина",
                    "price": "100 ₽",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "almond-coconut-milk",
                    "name": "Миндальное / кокосовое молоко",
                    "price": "90 ₽",
                    "sortOrder": 3,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "oat-skimmed-milk",
                    "name": "Овсяное / обезжиренное молоко",
                    "description": "Доступно как замена молока.",
                    "sortOrder": 4,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "syrup",
                    "name": "Сироп",
                    "description": "Уточните доступные вкусы у бариста.",
                    "sortOrder": 5,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                }
            ],
            "availableHours": null,
            "translations": {
                "en": {
                    "name": "Add-ons & Syrups",
                    "description": "Oat and skim milk plus decaf are available; almond or coconut milk +90 RUB; extra espresso shot +110 RUB."
                }
            }
        },
        {
            "id": "cookies-and-buns",
            "name": "Печенья и булочки",
            "sortOrder": 6,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "oat-cookie",
                    "name": "Печенье овсяное",
                    "price": "230 ₽",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "chocolate-cookie",
                    "name": "То самое шоколадное печенье",
                    "price": "270 ₽",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "peanut-cookie",
                    "name": "Печенье арахисовое",
                    "price": "230 ₽",
                    "sortOrder": 3,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "contains-nuts"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "canele",
                    "name": "Канеле",
                    "price": "250 ₽",
                    "sortOrder": 4,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "banana-bread",
                    "name": "Банановый хлеб",
                    "price": "280 ₽",
                    "sortOrder": 5,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "condensed-milk-tube",
                    "name": "Трубочка со сгущенкой",
                    "price": "280 ₽",
                    "sortOrder": 6,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "raisin-roll",
                    "name": "Улитка с изюмом",
                    "price": "360 ₽",
                    "sortOrder": 7,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "blueberry-danish",
                    "name": "Дэниш с голубикой",
                    "price": "530 ₽",
                    "sortOrder": 8,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "currant-galette",
                    "name": "Галета со смородиной",
                    "price": "310 ₽",
                    "sortOrder": 9,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "almond-croissant",
                    "name": "Круассан миндальный",
                    "price": "460 ₽",
                    "sortOrder": 10,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "contains-nuts",
                        "contains-dairy"
                    ],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "christmas-cake",
                    "name": "Рождественский кекс",
                    "price": "380 ₽",
                    "sortOrder": 11,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "poppy-bun",
                    "name": "Маковая булочка",
                    "price": "290 ₽",
                    "sortOrder": 12,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "cardamom-bun",
                    "name": "Булка с кардамоном",
                    "price": "320 ₽",
                    "sortOrder": 13,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                }
            ],
            "availableHours": null,
            "translations": {
                "en": {
                    "name": "Cookies & Buns"
                }
            }
        },
        {
            "id": "food",
            "name": "Плотно перекусить",
            "sortOrder": 7,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "sous-vide-chicken-croissant",
                    "name": "Круассан с курой су-вид",
                    "price": "610 ₽",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "ham-mozzarella-croissant",
                    "name": "Круассан с ветчиной и моцареллой",
                    "price": "610 ₽",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "salmon-croissant",
                    "name": "Круассан с лососем",
                    "price": "695 ₽",
                    "sortOrder": 3,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "blueberry-pie",
                    "name": "Черничный пирог",
                    "price": "470 ₽",
                    "sortOrder": 4,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "san-sebastian-cheesecake",
                    "name": "Чизкейк Сан-Себастьян",
                    "price": "490 ₽",
                    "sortOrder": 5,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": "chefs-choice",
                    "availableHours": null,
                    "translations": {
                        "en": {
                            "name": "San Sebastian Cheesecake"
                        }
                    }
                },
                {
                    "id": "mortadella-curd-cheese-sandwich",
                    "name": "Сендвич мортаделла с творожным сыром",
                    "price": "550 ₽",
                    "sortOrder": 6,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "turkey-pastrami-cherry-sandwich",
                    "name": "Сендвич пастрами из индейки и томленая вишня",
                    "price": "560 ₽",
                    "sortOrder": 7,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "chicken-sandwich",
                    "name": "Сэндвич с курицей",
                    "price": "590 ₽",
                    "sortOrder": 8,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                },
                {
                    "id": "duck-sandwich",
                    "name": "Сэндвич с уткой",
                    "price": "650 ₽",
                    "sortOrder": 9,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": null,
                    "translations": {}
                }
            ],
            "availableHours": null,
            "translations": {
                "en": {
                    "name": "Food"
                }
            }
        },
        {
            "id": "breakfasts-in-jar",
            "name": "Завтраки в банке",
            "sortOrder": 8,
            "isHidden": false,
            "imageUrl": null,
            "items": [
                {
                    "id": "grain-porridge",
                    "name": "Злаковая каша",
                    "price": "330 ₽",
                    "sortOrder": 1,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [],
                    "badge": null,
                    "availableHours": {
                        "start": "08:00",
                        "end": "12:00"
                    },
                    "translations": {
                        "en": {
                            "name": "Grain Porridge"
                        }
                    }
                },
                {
                    "id": "granola-strawberry-yogurt",
                    "name": "Гранола с клубникой и йогуртом",
                    "price": "360 ₽",
                    "sortOrder": 2,
                    "isAvailable": true,
                    "imageUrl": null,
                    "tags": [
                        "vegetarian"
                    ],
                    "badge": null,
                    "availableHours": {
                        "start": "08:00",
                        "end": "12:00"
                    },
                    "translations": {
                        "en": {
                            "name": "Granola with Strawberry and Yogurt"
                        }
                    }
                }
            ],
            "availableHours": {
                "start": "08:00",
                "end": "12:00"
            },
            "translations": {
                "en": {
                    "name": "Breakfast in a Jar"
                }
            }
        }
    ],
    "wifi": {
        "ssid": "Skuratov_Guest",
        "password": "coffee2026",
        "note": "Демо-данные Wi‑Fi. Замените сеть и пароль на реальные перед публикацией."
    }
};
