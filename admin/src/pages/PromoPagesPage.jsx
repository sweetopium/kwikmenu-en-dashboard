import { useEffect, useState } from 'react';
import { Plus, Trash, Edit, RefreshCw, Layers } from 'lucide-react';
import { DataTable } from '../components/admin/DataTable';
import { PageHeader } from '../components/admin/PageHeader';
import { Button } from '../components/ui/Button';
import {
  fetchPromoPages,
  createPromoPage,
  updatePromoPage,
  deletePromoPage,
  convertHtmlToJson,
} from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const DEFAULT_PROMO_TEMPLATE = {
  "pageType": "commercialLanding",
  "cluster": "online-menu",
  "slug": "online-menu-dlya-kafe",
  "url": "https://kwikmenu.ru/online-menu-dlya-kafe",
  "canonicalUrl": "https://kwikmenu.ru/online-menu-dlya-kafe",
  "intent": "online-menu-dlya-kafe",
  "pageLabel": "Онлайн-меню для кафе",
  "meta": {
    "title": "Онлайн-меню для кафе без ручного переноса | KwikMenu",
    "description": "Создайте онлайн-меню для кафе из PDF, фото или скана. Без ручного переноса и новой печати: KwikMenu помогает быстро обновлять цены, стоп-лист и позиции.",
    "robots": "index,follow"
  },
  "hero": {
    "title": "Онлайн-меню для кафе",
    "titleHtml": "Онлайн-меню<br />для кафе",
    "description": "Создайте онлайн-меню для кафе из PDF, фото или скана с помощью ИИ за несколько минут. Обновляйте завтраки, напитки, десерты и стоп-лист без новой печати.",
    "primaryBtnText": "Создать онлайн-меню",
    "secondaryBtnText": "Нужна помощь",
    "image": {
      "src": "/assets/hero-product-preview.png",
      "alt": "Демо KwikMenu: из действующего меню в онлайн-меню для гостей"
    }
  },
  "cta": {
    "registerUrl": "https://app.kwikmenu.ru/register?source=seo&intent=online-menu-dlya-kafe",
    "helpUrl": "https://app.kwikmenu.ru/?source=seo&intent=online-menu-dlya-kafe&action=help",
    "loginUrl": "https://app.kwikmenu.ru/login?source=seo&intent=online-menu-dlya-kafe"
  },
  "process": {
    "title": "Создайте онлайн-меню для кафе за 4 простых шага",
    "titleHtml": "Создайте онлайн-меню для кафе <br class=\"process-title-break\"><span class=\"process-title-tail\">за 4 простых шага</span>",
    "steps": [
      {
        "num": 1,
        "title": "Загрузите ваше меню",
        "description": "Подойдут PDF, фотография или скан. Можно начать с почти любого формата."
      },
      {
        "num": 2,
        "title": "ИИ подготовит основу",
        "description": "Распознает категории, позиции, описания и цены, чтобы не переносить меню вручную."
      },
      {
        "num": 3,
        "title": "Проверьте онлайн-меню",
        "description": "Проверьте данные, поправьте детали и подготовьте меню к публикации."
      },
      {
        "num": 4,
        "title": "Разместите QR и ссылку",
        "description": "QR-код — на столах, стойке или входе. Ссылку на меню — в профилях, соцсетях и сообщениях гостям."
      }
    ]
  },
  "formats": {
    "title": "Форматы онлайн-меню для кафе",
    "description": "Для короткого меню подойдёт базовое меню, для визуальной подачи — расширенное онлайн-меню для кафе с фото и карточками блюд.",
    "items": [
      {
        "type": "basic",
        "title": "Базовое меню",
        "tagline": "быстрый запуск",
        "description": "Гость быстро видит завтраки, напитки, десерты, цены и позиции, которые временно недоступны. Формат подходит, когда меню должно быстро читаться с телефона.",
        "image": {
          "src": "/assets/basic-menu-template.png",
          "alt": "Превью формата Базовое меню на телефоне"
        }
      },
      {
        "type": "extended",
        "title": "Расширенное меню",
        "tagline": "больше деталей",
        "description": "Расширенное меню помогает показать фото блюд, состав, КБЖУ, аллергены, варианты и добавки, чтобы гостю было проще выбрать без лишних вопросов.",
        "image": {
          "src": "/assets/extended-menu-template.png",
          "alt": "Превью формата Расширенное меню на телефоне"
        }
      }
    ]
  },
  "business": {
    "title": "Онлайн-меню для заведения",
    "description": "Меню кафе часто меняется в течение дня: завтраки, напитки, десерты и стоп-лист нужно быстро держать в актуальном виде без новой печати.",
    "items": [
      {
        "icon": "launch",
        "title": "Быстрый запуск из текущего меню",
        "description": "Загрузите PDF, фото или скан меню — ИИ поможет собрать завтраки, напитки, десерты и основное меню. Вы проверяете результат перед публикацией."
      },
      {
        "icon": "savings",
        "title": "Меньше затрат на правки и печать",
        "description": "Когда меняются завтраки, напитки, десерты или цены, меню обновляется в панели, а QR-код остаётся прежним."
      },
      {
        "icon": "fresh",
        "title": "Актуальное меню в течение дня",
        "description": "Скрывайте закончившиеся позиции, меняйте цены и добавляйте новые блюда в течение дня. Гость видит актуальную версию по тому же QR-коду."
      },
      {
        "icon": "control",
        "title": "Управление меню в одном месте",
        "description": "Редактируйте категории, позиции, цены, фото, описания, КБЖУ, аллергены, варианты, модификаторы и переводы в личном кабинете."
      },
      {
        "icon": "format",
        "title": "Подача под формат заведения",
        "description": "Для быстрого просмотра подойдёт базовое меню, для визуальной подачи — расширенное меню с фото блюд, вариантами и добавками."
      },
      {
        "icon": "questions",
        "title": "Меньше базовых вопросов к команде",
        "description": "В меню можно показать состав, КБЖУ, аллергены, варианты блюда, Wi-Fi, режим работы и телефон. Гость сам видит базовую информацию, а команда меньше отвлекается на повторяющиеся вопросы."
      }
    ]
  },
  "guest": {
    "title": "Онлайн-меню для гостя",
    "description": "В кафе гость часто выбирает между завтраками, напитками и десертами. Онлайн-меню помогает сразу увидеть актуальные позиции и вернуться к меню, если хочется выбрать ещё напиток или десерт.",
    "items": [
      {
        "title": "Быстрый доступ к меню",
        "description": "Гостю не нужно ждать бумажное меню после посадки. Меню открывается по QR-коду или ссылке и сразу доступно с телефона.",
        "size": "large"
      },
      {
        "title": "Меню под рукой для дозаказа",
        "description": "Когда гость хочет ещё напиток или десерт, ему не нужно снова просить меню. Он может открыть его с телефона и быстрее определиться с выбором.",
        "size": "large"
      },
      {
        "title": "Актуальные позиции и цены",
        "description": "Гость видит, какие завтраки, напитки и десерты доступны сейчас, и актуальные цены. Если позиция закончилась или ушла в стоп-лист, её можно скрыть, чтобы гость не выбирал то, чего уже нет.",
        "size": "medium"
      },
      {
        "title": "Больше деталей",
        "description": "Фото, описание, состав, КБЖУ and аллергены помогают быстрее понять завтрак, десерт, напиток или добавку до заказа и меньше уточнять у команды.",
        "size": "medium"
      },
      {
        "title": "Понятные варианты выбора",
        "description": "Объёмы напитков, варианты состава, добавки и модификаторы можно показать рядом с завтраком, напитком или десертом, чтобы гостю было проще выбрать подходящий вариант.",
        "size": "small"
      },
      {
        "title": "Информация о заведении рядом",
        "description": "Wi-Fi, режим работы и телефон доступны в меню. Гостю не нужно искать эту информацию отдельно или задавать повторяющиеся вопросы сотрудникам.",
        "size": "info"
      }
    ]
  },
  "faq": {
    "title": "Частые вопросы об онлайн-меню для кафе",
    "items": [
      {
        "question": "Можно ли создать онлайн-меню для кафе из PDF?",
        "answer": "Да. PDF можно загрузить как исходный материал, затем проверить подготовленное меню перед публикацией."
      },
      {
        "question": "Можно ли сделать онлайн-меню для кафе из фото или скана?",
        "answer": "Да. Фото меню, скан, прайс-лист или другой читаемый материал могут быть исходной точкой."
      },
      {
        "question": "Нужно ли переносить меню вручную?",
        "answer": "Не с пустой страницы. KwikMenu помогает разобрать структуру, а вы проверяете и правите данные."
      },
      {
        "question": "Можно ли проверить меню перед публикацией?",
        "answer": "Да. Вы или сотрудник заведения проверяете данные, исправляете детали и только потом публикуете меню для гостей."
      },
      {
        "question": "Что если ИИ ошибся?",
        "answer": "Ошибку можно исправить на этапе проверки перед публикацией или позже в личном кабинете."
      },
      {
        "question": "Чем онлайн-меню для кафе отличается от PDF?",
        "answer": "PDF — это исходный материал или статичный файл. Онлайн-меню для кафе удобнее, когда нужно обновлять цены, скрывать позиции в стоп-листе и добавлять фото, описания и детали завтраков, напитков и десертов без новой печати."
      },
      {
        "question": "Можно ли менять цены и стоп-лист?",
        "answer": "Да. Цены на завтраки, напитки и десерты можно обновлять в панели, а позиции, которые закончились или ушли в стоп-лист, скрывать из меню."
      },
      {
        "question": "Нужно ли менять QR-код после правок?",
        "answer": "Обычно нет. Онлайн-меню для кафе обновляется по той же ссылке и QR-коду."
      },
      {
        "question": "Можно ли добавлять новые категории и позиции?",
        "answer": "Да. После запуска меню можно добавлять завтраки, напитки, десерты, комбо и новые разделы."
      },
      {
        "question": "Можно ли открыть меню без QR-кода?",
        "answer": "Да. Онлайн-меню для кафе можно открыть по обычной ссылке: разместить её в профилях, соцсетях, сообщениях гостям или на сайте."
      },
      {
        "question": "Чем отличаются базовое и расширенное меню?",
        "answer": "Базовое меню подходит для быстрого выбора завтраков, напитков и десертов по разделам. Расширенное — когда нужно показать фото, состав, КБЖУ, аллергены, варианты и добавки."
      },
      {
        "question": "Что можно показать в карточке блюда?",
        "answer": "Фото, цену, описание, состав, КБЖУ, аллергены, объёмы, варианты и добавки для завтрака, напитка или десерта."
      },
      {
        "question": "Можно ли показать КБЖУ?",
        "answer": "Да, если эти данные указаны для позиции."
      },
      {
        "question": "Можно ли показать аллергены?",
        "answer": "Да, если эти данные указаны для позиции. Аллергены показываются как информация в карточке блюда."
      },
      {
        "question": "Можно ли добавить варианты блюда или напитка?",
        "answer": "Да. Можно показать разные объёмы, варианты состава, добавки и модификаторы для завтрака, напитка или десерта."
      },
      {
        "question": "Можно ли добавить Wi‑Fi, режим работы и телефон?",
        "answer": "Да. Эти данные можно показать в блоке информации о заведении, отдельно от карточки блюда."
      }
    ]
  },
  "venues": {
    "title": "Онлайн-меню для других заведений",
    "description": "Посмотрите соседние страницы кластера, если нужно онлайн-меню для другого формата заведения.",
    "chips": [
      { "label": "Онлайн-меню", "href": "https://kwikmenu.ru/online-menu" },
      { "label": "Ресторанам", "href": "https://kwikmenu.ru/online-menu-dlya-restorana" },
      { "label": "Кофейням", "href": "https://kwikmenu.ru/online-menu-dlya-kofeyni" },
      { "label": "Барам", "href": "https://kwikmenu.ru/online-menu-dlya-bara" },
      { "label": "Пиццериям", "href": "https://kwikmenu.ru/online-menu-dlya-pitstserii" },
      { "label": "Пекарням", "href": "https://kwikmenu.ru/online-menu-dlya-pekarni" },
      { "label": "Кондитерским", "href": "https://kwikmenu.ru/online-menu-dlya-konditerskoy" },
      { "label": "Суши-барам", "href": "https://kwikmenu.ru/online-menu-dlya-sushi-bara" },
      { "label": "Бистро", "href": "https://kwikmenu.ru/online-menu-dlya-bistro" }
    ]
  },
  "finalCta": {
    "title": "Готовы создать онлайн-меню для кафе?",
    "description": "Загрузите PDF, фото или скан. ИИ подготовит основу онлайн-меню для кафе, вы проверите результат и опубликуете его для гостей по QR-коду или ссылке.",
    "primaryBtnText": "Создать онлайн-меню",
    "secondaryBtnText": "Нужна помощь"
  }
};

const slugify = (text) => {
  if (!text) return '';

  const cyrillicToLatin = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ъ': '', 'ь': '',
    'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g'
  };

  let str = text.toString().toLowerCase().trim();

  let transliterated = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    transliterated += cyrillicToLatin[char] !== undefined ? cyrillicToLatin[char] : char;
  }

  return transliterated
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const PromoPagesPage = () => {
  const [data, setData] = useState({ items: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit / Create State
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentStr, setContentStr] = useState('{}');
  const [jsonError, setJsonError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // HTML Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importHtml, setImportHtml] = useState('');
  const [importing, setImporting] = useState(false);

  const loadPromoPages = () => {
    setLoading(true);
    fetchPromoPages()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPromoPages();
  }, []);

  const handleTitleChange = (val) => {
    setTitle(val);
    if (!editingPage) {
      setSlug(slugify(val));
    }
  };

  const handleJsonChange = (val) => {
    setContentStr(val);
    if (!val.trim()) {
      setJsonError('JSON не должен быть пустым');
      return;
    }
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (e) {
      setJsonError(`Ошибка JSON: ${e.message}`);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(contentStr);
      setContentStr(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e) {
      setJsonError(`Нельзя отформатировать: ${e.message}`);
    }
  };

  const handleFillTemplate = () => {
    setContentStr(JSON.stringify(DEFAULT_PROMO_TEMPLATE, null, 2));
    setJsonError(null);
  };

  const handleOpenImport = () => {
    setImportHtml('');
    setImporting(false);
    setShowImportModal(true);
  };

  const handleImportHtml = async () => {
    if (!importHtml.trim()) return;
    setImporting(true);
    try {
      const result = await convertHtmlToJson(importHtml);
      if (result && result.content) {
        setContentStr(JSON.stringify(result.content, null, 2));
        if (result.content.pageLabel) {
          setTitle(result.content.pageLabel);
        } else if (result.content.meta && result.content.meta.title) {
          const cleanTitle = result.content.meta.title.split('|')[0].trim();
          setTitle(cleanTitle);
        } else {
          setTitle('');
        }

        if (result.content.slug) {
          setSlug(result.content.slug);
        } else if (result.content.meta && result.content.meta.title) {
          const cleanTitle = result.content.meta.title.split('|')[0].trim();
          setSlug(slugify(cleanTitle));
        } else {
          setSlug('');
        }
        setShowImportModal(false);
        setShowModal(true);
      } else {
        alert("Не удалось распознать структуру из HTML.");
      }
    } catch (err) {
      alert(`Ошибка импорта: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPage(null);
    setTitle('');
    setSlug('');
    setContentStr('{}');
    setJsonError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (page) => {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setContentStr(JSON.stringify(page.content, null, 2));
    setJsonError(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || jsonError) return;

    let parsedContent;
    try {
      parsedContent = JSON.parse(contentStr);
    } catch (e) {
      setJsonError(`Ошибка JSON: ${e.message}`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        content: parsedContent,
      };

      if (editingPage) {
        await updatePromoPage(editingPage.id, payload);
      } else {
        await createPromoPage(payload);
      }

      setShowModal(false);
      loadPromoPages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту промо-страницу?')) return;
    setError('');
    try {
      await deletePromoPage(id);
      loadPromoPages();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Промо-страницы"
        description="Контент сео-лендингов и промо-статей KwikMenu."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenImport}>
              <RefreshCw size={16} />
              Импорт из HTML
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus size={16} />
              Добавить страницу
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <DataTable
        rows={data.items}
        empty={loading ? 'Загрузка данных...' : 'Нет данных'}
        columns={[
          { key: 'title', label: 'Название', render: (row) => <span className="font-bold">{row.title}</span> },
          { 
            key: 'slug', 
            label: 'Адрес / Ссылка', 
            render: (row) => (
              <span className="font-mono text-xs text-brand-purple">
                /{row.slug}
              </span>
            ) 
          },
          { key: 'createdAt', label: 'Создано', render: (row) => formatDateTime(row.createdAt) },
          {
            key: 'actions',
            label: 'Действия',
            render: (row) => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(row)} title="Редактировать">
                  <Edit size={14} className="text-muted-foreground hover:text-foreground" />
                </Button>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(row.id)} title="Удалить">
                  <Trash size={14} className="text-red-500 hover:text-red-700" />
                </Button>
              </div>
            )
          }
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[90vh]">
            <h3 className="text-lg font-black text-foreground mb-4">
              {editingPage ? 'Редактировать страницу' : 'Добавить промо-страницу'}
            </h3>
            
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">
                    Заголовок страницы (title)
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Онлайн-меню для кафе"
                    className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">
                    Slug (URL адрес)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="online-menu-dlya-kafe"
                    className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                  />
                </div>
              </div>
              <div className="flex-grow flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider font-sans">
                    Контент страницы (JSON)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImportHtml('');
                        setShowImportModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:underline bg-violet-50 dark:bg-violet-950/40 rounded-full px-2.5 py-1"
                    >
                      <RefreshCw size={10} />
                      Импорт из HTML
                    </button>
                    <button
                      type="button"
                      onClick={handleFillTemplate}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-purple hover:underline bg-brand-purple/5 rounded-full px-2.5 py-1"
                    >
                      <Layers size={10} />
                      Заполнить шаблоном
                    </button>
                    <button
                      type="button"
                      onClick={handleFormatJson}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:underline bg-zinc-100 dark:bg-zinc-800 rounded-full px-2.5 py-1"
                    >
                      <RefreshCw size={10} />
                      Форматировать JSON
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 relative">
                  <textarea
                    value={contentStr}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="w-full h-full min-h-[300px] p-3.5 font-mono text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple resize-none"
                    placeholder="{}"
                  />
                </div>

                {jsonError && (
                  <div className="mt-2 text-xs font-semibold text-red-500">
                    {jsonError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !title || !slug || jsonError !== null}
                >
                  {submitting ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[85vh]">
            <h3 className="text-lg font-black text-foreground mb-1">
              Импорт страницы из HTML
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Вставьте полный исходный HTML-код страницы. ИИ распознает структуру и заполнит форму.
            </p>
            
            <div className="flex-grow flex-1 flex flex-col min-h-0 space-y-4">
              <div className="flex-grow flex-1 min-h-[300px] relative">
                <textarea
                  value={importHtml}
                  onChange={(e) => setImportHtml(e.target.value)}
                  placeholder="<!doctype html>..."
                  className="w-full h-full p-3.5 font-mono text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple resize-none"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button type="button" variant="ghost" onClick={() => setShowImportModal(false)}>
                  Отмена
                </Button>
                <Button 
                  type="button"
                  onClick={handleImportHtml} 
                  disabled={importing || !importHtml.trim()}
                >
                  {importing ? 'Конвертация...' : 'Конвертировать'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PromoPagesPage;
