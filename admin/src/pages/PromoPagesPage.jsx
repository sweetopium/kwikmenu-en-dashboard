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
} from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const DEFAULT_PROMO_TEMPLATE = {
  "registerUrl": "https://app.kwikmenu.ru/register",
  "helpUrl": "https://app.kwikmenu.ru/",
  "videoUrl": "https://kinescope.io/embed/pm8atrkyhzUx836QZii3pw",
  "footerTitle": "Онлайн-меню для кафе",
  "meta": {
    "title": "Онлайн-меню для кафе без ручного переноса | KwikMenu",
    "description": "Создайте онлайн-меню для кафе из PDF, фото или скана. Без ручного переноса и новой печати: KwikMenu помогает быстро обновлять цены, стоп-лист и позиции."
  },
  "hero": {
    "title": "Онлайн-меню<br />для кафе",
    "description": "Создайте онлайн-меню для кафе из PDF, фото или скана с помощью ИИ за несколько минут. Обновляйте завтраки, напитки, десерты и стоп-лист без новой печати.",
    "primaryBtnText": "Создать онлайн-меню",
    "secondaryBtnText": "Нужна помощь",
    "image": "/assets/hero-product-preview.png"
  },
  "process": {
    "title": "Создайте онлайн-меню для кафе<br /><span class=\"text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600\">за 4 простых шага</span>",
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
    "description": "Для короткого меню подойдёт простой список, для визуальной подачи — онлайн-меню для кафе с фото и карточками блюд.",
    "items": [
      {
        "title": "Базовое меню",
        "tagline": "быстрый запуск",
        "description": "Гость быстро видит завтраки, напитки, десерты, цены и позиции, которые временно недоступны. Формат подходит, когда меню должно быстро читаться с телефона.",
        "image": "/assets/basic-menu-template.png",
        "type": "basic"
      },
      {
        "title": "Расширенное меню",
        "tagline": "больше деталей",
        "description": "Карточки помогают показать фото блюд, состав, КБЖУ, аллергены, варианты и добавки, чтобы гостю было проще выбрать без лишних вопросов.",
        "image": "/assets/extended-menu-template.png",
        "type": "extended"
      }
    ]
  },
  "value": {
    "title": "Онлайн-меню для заведения",
    "description": "Быстрый запуск, меньше ручных правок и актуальная версия для гостей: команде проще обновлять цены, стоп-лист и позиции без новой печати.",
    "items": [
      {
        "icon": "launch",
        "title": "Быстрый запуск из текущего меню",
        "description": "Загрузите PDF, фото или скан — ИИ подготовит основу онлайн-меню для кафе с разделами, позициями и ценами. Вы проверяете результат перед публикацией."
      },
      {
        "icon": "savings",
        "title": "Меньше затрат на правки и печать",
        "description": "Когда меняются цены, позиции или стоп-лист, не нужно снова возвращаться к макету, печати и замене тейбл-тентов. Онлайн-меню для кафе обновляется в панели, а QR-код остаётся прежним."
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
        "description": "Для небольшого меню подойдёт базовый список, для кафе или ресторана — расширенное онлайн-меню для кафе с фото и карточками блюд. Логотип и фон помогают сохранить стиль заведения."
      },
      {
        "icon": "questions",
        "title": "Меньше базовых вопросов к команде",
        "description": "В меню можно показать состав, КБЖУ, аллергены, варианты блюда, Wi-Fi, режим работы и телефон. Гость сам видит базовую информацию, а команда меньше отвлекается на повторяющиеся вопросы."
      }
    ]
  },
  "guestValue": {
    "title": "Онлайн-меню для гостя",
    "description": "Гость видит актуальное меню с телефона, быстрее разбирается в блюдах и может вернуться к выбору в любой момент — без ожидания бумажного меню.",
    "items": [
      {
        "title": "Быстрый доступ к меню",
        "description": "Гостю не нужно ждать бумажное меню после посадки. Меню открывается по QR-коду или ссылке и сразу доступно с телефона.",
        "size": "large"
      },
      {
        "title": "Меню под рукой для дозаказа",
        "description": "Когда гость хочет напиток, десерт или добавку, ему не нужно снова просить меню. Он может открыть его с телефона и быстрее определиться с выбором.",
        "size": "large"
      },
      {
        "title": "Актуальные позиции и цены",
        "description": "Гость видит доступные блюда и актуальные цены. Если позиция закончилась или ушла в стоп-лист, её можно скрыть, чтобы гость не выбирал то, чего уже нет.",
        "size": "medium"
      },
      {
        "title": "Больше информации о блюде",
        "description": "Фото, описание, состав, КБЖУ и аллергены помогают быстрее понять позицию до заказа и меньше уточнять у команды.",
        "size": "medium"
      },
      {
        "title": "Понятные варианты выбора",
        "description": "Объёмы напитков, варианты состава, добавки и модификаторы можно показать рядом с позицией, чтобы гостю было проще выбрать подходящий вариант.",
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
        "answer": "PDF — это исходный материал или статичный файл. Онлайн-меню для кафе удобнее, когда нужно менять цены, скрывать стоп-лист, добавлять фото, описания и детали блюд без новой печати."
      },
      {
        "question": "Можно ли менять цены и стоп-лист?",
        "answer": "Да. Цены можно обновлять в панели, а позиции, которые закончились, скрывать из меню."
      },
      {
        "question": "Нужно ли менять QR-код после правок?",
        "answer": "Обычно нет. Онлайн-меню для кафе обновляется по той же ссылке и QR-коду."
      },
      {
        "question": "Можно ли добавлять новые категории и позиции?",
        "answer": "Да. Категории и позиции можно добавлять после запуска меню."
      },
      {
        "question": "Можно ли открыть меню без QR-кода?",
        "answer": "Да. Онлайн-меню для кафе можно открыть по обычной ссылке: разместить её в профилях, соцсетях, сообщениях гостям или на сайте."
      },
      {
        "question": "Чем отличаются базовое и расширенное меню?",
        "answer": "Базовое меню подходит для быстрого выбора по разделам, расширенное — для меню с фото, описаниями, составом и деталями позиции."
      },
      {
        "question": "Что можно показать в карточке блюда?",
        "answer": "Фото, цену, описание, состав, КБЖУ, аллергены, объемы, варианты и модификаторы."
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
        "answer": "Да. Можно показать разные объемы, варианты состава, добавки и модификаторы."
      },
      {
        "question": "Можно ли показать Wi-Fi, режим работы и телефон?",
        "answer": "Да. Эти данные можно показать в блоке информации о заведении, отдельно от карточки блюда."
      }
    ]
  },
  "venues": {
    "title": "Онлайн-меню для заведений HoReCa",
    "description": "Подходит для заведений, где меню нужно быстро обновлять и показывать гостям по QR-коду или ссылке.",
    "chips": ["Кафе", "Ресторанам", "Кофейням", "Барам", "Пиццериям", "Пекарням", "Кондитерским", "Суши-барам", "Бистро"]
  },
  "cta": {
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
          <Button onClick={handleOpenCreate}>
            <Plus size={16} />
            Добавить страницу
          </Button>
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
    </>
  );
};

export default PromoPagesPage;
