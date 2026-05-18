import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Code2, Eye, Plus, Save, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/admin/PageHeader';
import { StatusBadge } from '../components/admin/StatusBadge';
import { Button } from '../components/ui/Button';
import { fetchMenuDetail, updateMenu } from '../lib/adminApi';
import { cn } from '../lib/utils';

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const TextInput = ({ label, value, onChange, placeholder }) => (
  <label className="block">
    <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
    <input
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-brand-purple"
    />
  </label>
);

const TextArea = ({ label, value, onChange, rows = 3 }) => (
  <label className="block">
    <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
    <textarea
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-brand-purple"
    />
  </label>
);

const MenuEditorPage = () => {
  const { id } = useParams();
  const [menuRecord, setMenuRecord] = useState(null);
  const [payload, setPayload] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [status, setStatus] = useState('draft');
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMenuDetail(id)
      .then((data) => {
        setMenuRecord(data);
        setPayload(data.payload);
        setStatus(data.status);
        setActiveCategoryId(data.payload.categories?.[0]?.id || null);
        setActiveItemId(data.payload.categories?.[0]?.items?.[0]?.id || null);
        setJsonText(JSON.stringify(data.payload, null, 2));
      })
      .catch((nextError) => setError(nextError.message));
  }, [id]);

  const activeCategory = useMemo(
    () => payload?.categories?.find((category) => category.id === activeCategoryId) || payload?.categories?.[0] || null,
    [payload, activeCategoryId],
  );
  const activeItem = useMemo(
    () => activeCategory?.items?.find((item) => item.id === activeItemId) || activeCategory?.items?.[0] || null,
    [activeCategory, activeItemId],
  );

  const setNextPayload = (updater) => {
    setPayload((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const updateMenuMeta = (patch) => {
    setNextPayload((current) => ({
      ...current,
      menuMeta: { ...current.menuMeta, ...patch },
    }));
  };

  const updateVenue = (patch) => {
    setNextPayload((current) => ({
      ...current,
      venue: { ...current.venue, ...patch },
    }));
  };

  const updateActiveCategory = (patch) => {
    setNextPayload((current) => ({
      ...current,
      categories: current.categories.map((category) => (
        category.id === activeCategory.id ? { ...category, ...patch } : category
      )),
    }));
  };

  const updateActiveItem = (patch) => {
    setNextPayload((current) => ({
      ...current,
      categories: current.categories.map((category) => (
        category.id === activeCategory.id
          ? {
              ...category,
              items: category.items.map((item) => (
                item.id === activeItem.id ? { ...item, ...patch } : item
              )),
            }
          : category
      )),
    }));
  };

  const addCategory = () => {
    const category = {
      id: makeId('cat'),
      name: 'Новая категория',
      description: '',
      sortOrder: (payload.categories?.length || 0) + 1,
      isHidden: false,
      imageUrl: null,
      items: [],
      translations: {},
    };
    setNextPayload((current) => ({ ...current, categories: [...current.categories, category] }));
    setActiveCategoryId(category.id);
    setActiveItemId(null);
  };

  const deleteCategory = () => {
    if (!activeCategory || !window.confirm(`Удалить категорию "${activeCategory.name}" со всеми позициями?`)) {
      return;
    }
    setNextPayload((current) => {
      const categories = current.categories.filter((category) => category.id !== activeCategory.id);
      setActiveCategoryId(categories[0]?.id || null);
      setActiveItemId(categories[0]?.items?.[0]?.id || null);
      return { ...current, categories };
    });
  };

  const addItem = () => {
    if (!activeCategory) {
      return;
    }
    const item = {
      id: makeId('item'),
      name: 'Новая позиция',
      description: '',
      price: '',
      measureValue: null,
      measureUnit: 'portion',
      sortOrder: (activeCategory.items?.length || 0) + 1,
      isAvailable: true,
      imageUrl: null,
      tags: [],
      badge: null,
      translations: {},
      variants: [],
    };
    setNextPayload((current) => ({
      ...current,
      categories: current.categories.map((category) => (
        category.id === activeCategory.id ? { ...category, items: [...category.items, item] } : category
      )),
    }));
    setActiveItemId(item.id);
  };

  const deleteItem = () => {
    if (!activeItem || !window.confirm(`Удалить позицию "${activeItem.name}"?`)) {
      return;
    }
    setNextPayload((current) => ({
      ...current,
      categories: current.categories.map((category) => (
        category.id === activeCategory.id
          ? { ...category, items: category.items.filter((item) => item.id !== activeItem.id) }
          : category
      )),
    }));
    setActiveItemId(null);
  };

  const syncJsonToPayload = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setPayload(parsed);
      setActiveCategoryId(parsed.categories?.[0]?.id || null);
      setActiveItemId(parsed.categories?.[0]?.items?.[0]?.id || null);
      setError('');
    } catch (nextError) {
      setError(`JSON невалидный: ${nextError.message}`);
    }
  };

  const saveMenu = async () => {
    const nextPayload = jsonMode ? JSON.parse(jsonText) : payload;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateMenu(id, { payload: nextPayload, status });
      setMenuRecord(updated);
      setPayload(updated.payload);
      setJsonText(JSON.stringify(updated.payload, null, 2));
      setNotice('Меню сохранено.');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!payload) {
    return (
      <>
        <PageHeader title="Редактор меню" description="Загрузка..." />
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={payload.menuMeta.name || menuRecord?.name || 'Редактор меню'}
        description={menuRecord ? `${menuRecord.venueName} · ${menuRecord.owner.email}` : 'Админское редактирование меню'}
        actions={(
          <>
            <Link to="/menus" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-secondary">
              <ArrowLeft size={16} />
              Назад
            </Link>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none">
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="published">published</option>
            </select>
            <Button variant="outline" onClick={() => setJsonMode((value) => !value)}>
              {jsonMode ? <Eye size={16} /> : <Code2 size={16} />}
              {jsonMode ? 'Форма' : 'JSON'}
            </Button>
            <Button onClick={saveMenu} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </>
        )}
      />

      <div className="flex items-center gap-2">
        <StatusBadge value={status} />
        <span className="text-xs font-bold text-muted-foreground">{menuRecord?.categoriesCount || 0} категорий · {menuRecord?.itemsCount || 0} позиций</span>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</div> : null}

      {jsonMode ? (
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Payload JSON</h2>
            <Button variant="outline" onClick={syncJsonToPayload}>Применить JSON к форме</Button>
          </div>
          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            className="h-[620px] w-full resize-y rounded-xl border border-border bg-background p-4 font-mono text-xs outline-none focus:border-brand-purple"
          />
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr_360px]">
          <aside className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-black">Категории</h2>
              <Button size="sm" variant="outline" onClick={addCategory}><Plus size={14} />Кат.</Button>
            </div>
            <div className="space-y-2">
              {payload.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategoryId(category.id);
                    setActiveItemId(category.items?.[0]?.id || null);
                  }}
                  className={cn(
                    'w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors',
                    activeCategory?.id === category.id ? 'bg-brand-purple/10 text-brand-purple' : 'hover:bg-secondary',
                  )}
                >
                  {category.name || 'Без названия'}
                  <span className="block text-xs font-semibold text-muted-foreground">{category.items?.length || 0} позиций</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-black">Основное</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Название меню" value={payload.menuMeta.name} onChange={(value) => updateMenuMeta({ name: value })} />
                <TextInput label="Slug" value={payload.menuMeta.slug} onChange={(value) => updateMenuMeta({ slug: value })} />
                <TextInput label="Валюта" value={payload.currency} onChange={(value) => setNextPayload((current) => ({ ...current, currency: value.toUpperCase() }))} />
                <TextInput label="Название заведения" value={payload.venue.name} onChange={(value) => updateVenue({ name: value })} />
                <div className="sm:col-span-2">
                  <TextArea label="Описание меню" value={payload.menuMeta.description || ''} onChange={(value) => updateMenuMeta({ description: value })} />
                </div>
              </div>
            </div>

            {activeCategory ? (
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-black">Категория</h2>
                  <Button variant="destructive" size="sm" onClick={deleteCategory}><Trash2 size={14} />Удалить</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="Название" value={activeCategory.name} onChange={(value) => updateActiveCategory({ name: value })} />
                  <TextInput label="Image URL" value={activeCategory.imageUrl || ''} onChange={(value) => updateActiveCategory({ imageUrl: value || null })} />
                  <div className="sm:col-span-2">
                    <TextArea label="Описание" value={activeCategory.description || ''} onChange={(value) => updateActiveCategory({ description: value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" checked={Boolean(activeCategory.isHidden)} onChange={(event) => updateActiveCategory({ isHidden: event.target.checked })} className="h-4 w-4 accent-brand-purple" />
                    Скрыта
                  </label>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-black">Позиции</h2>
              <Button size="sm" variant="outline" onClick={addItem} disabled={!activeCategory}><Plus size={14} />Поз.</Button>
            </div>
            <div className="mb-4 max-h-72 space-y-2 overflow-y-auto">
              {(activeCategory?.items || []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={cn(
                    'w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors',
                    activeItem?.id === item.id ? 'bg-brand-purple/10 text-brand-purple' : 'hover:bg-secondary',
                  )}
                >
                  {item.name || 'Без названия'}
                  <span className="block text-xs font-semibold text-muted-foreground">{item.price || 'без цены'}</span>
                </button>
              ))}
            </div>

            {activeItem ? (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">Позиция</h3>
                  <Button variant="destructive" size="sm" onClick={deleteItem}><Trash2 size={14} /></Button>
                </div>
                <TextInput label="Название" value={activeItem.name} onChange={(value) => updateActiveItem({ name: value })} />
                <TextInput label="Цена" value={activeItem.price || ''} onChange={(value) => updateActiveItem({ price: value })} />
                <TextInput label="Image URL" value={activeItem.imageUrl || ''} onChange={(value) => updateActiveItem({ imageUrl: value || null })} />
                <TextArea label="Описание" value={activeItem.description || ''} onChange={(value) => updateActiveItem({ description: value })} rows={4} />
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={Boolean(activeItem.isAvailable)} onChange={(event) => updateActiveItem({ isAvailable: event.target.checked })} className="h-4 w-4 accent-brand-purple" />
                  Доступна
                </label>
              </div>
            ) : (
              <div className="rounded-xl bg-secondary/50 p-4 text-sm font-semibold text-muted-foreground">Выбери позицию или создай новую.</div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};

export default MenuEditorPage;
