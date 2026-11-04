interface IconRow {
    kind: string;
    value: string;
    color?: string;
}

interface IconBoot {
    url: string;
    base: string;
    mailboxId: number;
    icons: Record<string, IconRow>;
    failed: string;
}

interface IconItem {
    kind: string;
    value: string;
    label: string;
    aliases: string[];
}

interface PendingChoice {
    kind: string;
    value: string;
    color?: string;
}

(function () {
const LUCIDE_COLORS = ['', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#ffffff'];
const THEMES: { id: string; label: string; words: string[] }[] = [
    { id: 'arrows', label: 'Pfeile', words: ['arrow', 'chevron', 'caret', 'triangle'] },
    { id: 'mail', label: 'Kommunikation', words: ['mail', 'envelope', 'inbox', 'send', 'message', 'chat', 'comment', 'phone', 'bell', 'megaphone', 'bullhorn', 'at-sign', 'rss', 'earphone'] },
    { id: 'people', label: 'Personen', words: ['user', 'users', 'person', 'contact', 'baby', 'hand', 'thumbs', 'smile', 'frown', 'meh'] },
    { id: 'files', label: 'Dateien', words: ['file', 'files', 'folder', 'document', 'clipboard', 'paperclip', 'archive', 'book', 'bookmark', 'notebook', 'newspaper', 'scroll'] },
    { id: 'edit', label: 'Bearbeiten', words: ['pencil', 'pen', 'edit', 'scissors', 'copy', 'trash', 'eraser', 'bold', 'italic', 'font', 'align', 'list', 'indent', 'quote', 'type', 'heading', 'pilcrow', 'baseline'] },
    { id: 'security', label: 'Sicherheit', words: ['lock', 'key', 'shield', 'eye', 'fingerprint', 'scan', 'badge', 'schloss'] },
    { id: 'status', label: 'Status', words: ['check', 'alert', 'info', 'help', 'ban', 'bug', 'circle-x', 'x-circle', 'warning', 'octagon', 'siren', 'flag'] },
    { id: 'time', label: 'Zeit', words: ['calendar', 'clock', 'timer', 'hourglass', 'history', 'alarm', 'watch'] },
    { id: 'place', label: 'Ort und Reise', words: ['map', 'home', 'house', 'building', 'globe', 'navigation', 'compass', 'plane', 'car', 'train', 'ship', 'truck', 'bike', 'bed', 'hotel', 'luggage', 'anchor'] },
    { id: 'shop', label: 'Handel', words: ['cart', 'credit', 'bank', 'wallet', 'coin', 'dollar', 'euro', 'shopping', 'gift', 'tag', 'tags', 'barcode', 'qr', 'receipt', 'store', 'pound', 'yen', 'bitcoin'] },
    { id: 'media', label: 'Medien', words: ['image', 'camera', 'video', 'film', 'music', 'mic', 'volume', 'play', 'pause', 'headphone', 'tv', 'clapper', 'podcast', 'radio', 'speaker'] },
    { id: 'devices', label: 'Geräte', words: ['monitor', 'laptop', 'smartphone', 'tablet', 'printer', 'cpu', 'server', 'hard-drive', 'wifi', 'battery', 'plug', 'keyboard', 'mouse', 'hdmi', 'usb', 'router', 'pc'] },
    { id: 'nature', label: 'Natur', words: ['sun', 'moon', 'cloud', 'tree', 'leaf', 'flower', 'droplet', 'flame', 'zap', 'snow', 'wind', 'mountain', 'umbrella'] },
    { id: 'other', label: 'Sonstiges', words: [] }
];
const COLUMNS = 8;
const RECENT_KEY = 'iconpicker.recent';

let boot: IconBoot | null = null;
let items: IconItem[] = [];
let ready = false;
let pending: PendingChoice | null = null;
let catalogsRequested = false;

function iconpickerStart(config: IconBoot): void {
    boot = config;
    if (!boot.icons) {
        boot.icons = {};
    }
    bindSave();
    mount(document);
    paintFolders();
    paintAdmin();
    watchFolders();
    document.addEventListener('click', function (event) {
        installNewFolderHook();
        installFormHook();
        const target = event.target as Element | null;
        if (!target || !target.closest) {
            return;
        }
        if (!target.closest('.iconpicker')) {
            closePanels(null);
        }
    }, true);
    document.addEventListener('nestedtags:folder-icons', function (event) {
        applyFolderIcons((event as CustomEvent).detail);
    });
    installNewFolderHook();
    installFormHook();
    ensureCatalogs(function () {
        paintFolders();
        paintAdmin();
    });
}

function bindSave(): void {
    $.ajaxPrefilter(function (options) {
        if (!boot || !options.url || options.url.indexOf('custom-folders/ajax') === -1) {
            return;
        }
        const fields = fieldsOf(options.data);
        if (fields.action !== 'create' && fields.action !== 'update' && fields.action !== 'delete') {
            return;
        }
        const previous = options.success;
        options.success = function (data) {
            const finish = function () {
                if (previous) {
                    previous(data);
                }
            };
            if (!boot || !data || data.status !== 'success') {
                finish();
                return;
            }
            const id = data.id ? Number(data.id) : Number(fields.folder_id || 0);
            if (!id) {
                showFloatingAlert('error', boot.failed, true);
                return;
            }
            const failed = boot.failed;
            const url = boot.url;
            const choice = fields.action === 'delete' ? null : pending;
            if (fields.action !== 'delete') {
                pending = null;
            }
            const payload: Record<string, string | number> = {
                action: fields.action === 'delete' ? 'delete' : 'save',
                folder_id: id,
                mailbox_id: fields.mailbox_id || String(boot.mailboxId),
                kind: choice ? choice.kind : 'glyph',
                value: choice ? choice.value : '',
                color: choice && choice.color ? choice.color : ''
            };
            fsAjax(payload, url, function (response) {
                if (response && response.status === 'success') {
                    rememberBoot(String(id), payload.kind as string, payload.value as string, payload.color as string);
                    paintFolders();
                    paintAdmin();
                    finish();
                    return;
                }
                showFloatingAlert('error', (response && response.msg) || failed, true);
            }, true, function () {
                showFloatingAlert('error', failed, true);
            });
        };
    });
}

function applyFolderIcons(detail: unknown): void {
    if (!boot) {
        return;
    }
    const next: Record<string, IconRow> = {};
    if (detail && typeof detail === 'object') {
        const rows = detail as Record<string, IconRow>;
        for (const id in rows) {
            if (!Object.prototype.hasOwnProperty.call(rows, id)) {
                continue;
            }
            const row = rows[id];
            if (!row || !row.kind) {
                continue;
            }
            next[id] = {
                kind: row.kind,
                value: row.value || '',
                color: row.color || ''
            };
        }
    }
    boot.icons = next;
    paintFolders();
}

function rememberBoot(id: string, kind: string, value: string, color: string): void {
    if (!boot) {
        return;
    }
    if (kind === 'lucide' || kind === 'emoji' || (kind === 'glyph' && color)) {
        boot.icons[id] = { kind: kind, value: value, color: color };
        return;
    }
    delete boot.icons[id];
}

function mount(root: ParentNode): void {
    const selects = root.querySelectorAll('select[name="icon"]');
    for (let i = 0; i < selects.length; i++) {
        mountSelect(selects[i] as HTMLSelectElement);
    }
}

function mountSelect(select: HTMLSelectElement): void {
    if (select.getAttribute('data-iconpicker') === '1') {
        return;
    }
    select.setAttribute('data-iconpicker', '1');
    select.classList.add('iconpicker-select');
    const form = select.closest('form');
    const help = select.parentElement ? select.parentElement.querySelector('.form-help') : null;
    if (help) {
        help.setAttribute('hidden', 'hidden');
    }
    const folderId = form ? form.getAttribute('data-folder_id') || '' : '';
    const row = boot && folderId ? boot.icons[folderId] : undefined;
    if (row && (row.kind === 'lucide' || row.kind === 'emoji') && !select.value) {
        setChoice(form, row.kind, row.value, select, row.color || '');
    } else if (select.value) {
        const color = row && row.kind === 'glyph' ? (row.color || '') : '';
        setChoice(form, 'glyph', select.value, select, color);
    } else if (row) {
        setChoice(form, row.kind, row.value, select, row.color || '');
    } else {
        setChoice(form, 'clear', '', select, '');
    }

    const holder = document.createElement('div');
    holder.className = 'iconpicker';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-default iconpicker-button';
    const panel = document.createElement('div');
    panel.className = 'iconpicker-panel';
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'form-control iconpicker-search';
    const switcher = document.createElement('div');
    switcher.className = 'iconpicker-switch';
    const emojiTab = document.createElement('button');
    emojiTab.type = 'button';
    emojiTab.className = 'iconpicker-switch-btn';
    emojiTab.textContent = 'Emoji';
    const iconTab = document.createElement('button');
    iconTab.type = 'button';
    iconTab.className = 'iconpicker-switch-btn';
    iconTab.textContent = 'Icons';
    switcher.appendChild(emojiTab);
    switcher.appendChild(iconTab);
    const colors = document.createElement('div');
    colors.className = 'iconpicker-colors';
    const bar = document.createElement('div');
    bar.className = 'iconpicker-bar';
    const nameEl = document.createElement('span');
    nameEl.className = 'iconpicker-name';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'btn btn-link btn-sm iconpicker-clear';
    clear.textContent = 'Icon entfernen';
    bar.appendChild(nameEl);
    bar.appendChild(clear);
    const grid = document.createElement('div');
    grid.className = 'iconpicker-grid';
    panel.appendChild(search);
    panel.appendChild(switcher);
    panel.appendChild(colors);
    panel.appendChild(bar);
    panel.appendChild(grid);
    holder.appendChild(button);
    holder.appendChild(panel);
    if (!select.parentNode) {
        return;
    }
    select.parentNode.insertBefore(holder, select.nextSibling);

    let matches: IconItem[] = [];
    let active = 0;
    let mode: 'icon' | 'emoji' = 'icon';
    let iconColor = '';

    const drawButton = function () {
        const current = readChoice(form, select);
        const known = findItem(current.kind, current.value);
        const title = known ? iconTitle(known) : current.value;
        button.innerHTML = '';
        button.title = title;
        button.setAttribute('aria-label', title || 'Icon');
        button.appendChild(renderIcon(current.kind, current.value, current.color || ''));
    };

    const drawGrid = function () {
        active = 0;
        grid.innerHTML = '';
        grid.scrollTop = 0;
        let lastTheme = '';
        for (let i = 0; i < matches.length; i++) {
            if (mode === 'icon') {
                const theme = themeOf(matches[i]);
                if (theme !== lastTheme) {
                    const head = document.createElement('div');
                    head.className = 'iconpicker-theme';
                    head.textContent = themeLabel(theme);
                    grid.appendChild(head);
                    lastTheme = theme;
                }
            }
            grid.appendChild(cell(matches[i], i));
        }
        markActive(false);
    };

    const cell = function (item: IconItem, index: number) {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'iconpicker-cell';
        node.setAttribute('data-index', String(index));
        node.title = iconTitle(item);
        node.setAttribute('aria-label', iconTitle(item));
        node.appendChild(renderIcon(item.kind, item.value, mode === 'icon' ? iconColor : ''));
        node.addEventListener('mouseenter', function () {
            active = index;
            markActive(false);
        });
        node.addEventListener('click', function () {
            applyItem(item);
        });
        return node;
    };

    const showName = function (item: IconItem | null) {
        nameEl.textContent = item ? iconTitle(item) : '';
    };

    const markActive = function (scroll: boolean) {
        const cells = grid.querySelectorAll('.iconpicker-cell');
        let current: HTMLElement | null = null;
        for (let i = 0; i < cells.length; i++) {
            const node = cells[i] as HTMLElement;
            const index = Number(node.getAttribute('data-index'));
            if (index === active) {
                node.classList.add('is-active');
                current = node;
            } else {
                node.classList.remove('is-active');
            }
        }
        showName(matches[active] || null);
        if (scroll && current) {
            current.scrollIntoView({ block: 'nearest' });
        }
    };

    const applyItem = function (item: IconItem | null) {
        if (!item) {
            setChoice(form, 'clear', '', select, '');
        } else if (item.kind === 'glyph') {
            setChoice(form, 'glyph', item.value, select, iconColor);
            select.value = item.value;
        } else if (item.kind === 'lucide') {
            setChoice(form, 'lucide', item.value, select, iconColor);
            select.value = '';
        } else {
            setChoice(form, 'emoji', item.value, select, '');
            select.value = '';
        }
        pushRecent(readChoice(form, select));
        panel.classList.remove('is-open');
        drawButton();
    };

    const paintSwitch = function () {
        emojiTab.classList.toggle('is-on', mode === 'emoji');
        iconTab.classList.toggle('is-on', mode === 'icon');
        colors.style.display = mode === 'icon' ? '' : 'none';
    };

    const paintColors = function () {
        colors.innerHTML = '';
        for (let i = 0; i < LUCIDE_COLORS.length; i++) {
            const value = LUCIDE_COLORS[i];
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'iconpicker-swatch' + (value === iconColor ? ' is-on' : '') + (value === '' ? ' is-default' : '');
            swatch.title = value === '' ? 'Standard' : value;
            if (value) {
                swatch.style.background = value;
            }
            swatch.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                iconColor = value;
                const current = readChoice(form, select);
                if (current.kind === 'lucide' || current.kind === 'glyph') {
                    setChoice(form, current.kind, current.value, select, iconColor);
                    drawButton();
                }
                paintColors();
                refill();
            });
            colors.appendChild(swatch);
        }
    };

    const useMode = function (next: 'icon' | 'emoji') {
        mode = next;
        paintSwitch();
        refill();
    };

    const refill = function () {
        const found = filterItems(search.value || '', mode);
        matches = mode === 'icon' ? sortByTheme(found) : found;
        drawGrid();
    };

    clear.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        applyItem(null);
    });

    button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const open = panel.classList.contains('is-open');
        closePanels(panel);
        if (open) {
            panel.classList.remove('is-open');
            return;
        }
        panel.classList.add('is-open');
        search.value = '';
        const current = readChoice(form, select);
        mode = current.kind === 'emoji' ? 'emoji' : 'icon';
        iconColor = current.color || '';
        paintSwitch();
        paintColors();
        search.focus();
        ensureCatalogs(function () {
            refill();
        });
    });

    emojiTab.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        useMode('emoji');
    });
    iconTab.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        useMode('icon');
    });

    search.addEventListener('input', refill);
    search.addEventListener('keydown', function (event) {
        if (!panel.classList.contains('is-open')) {
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            panel.classList.remove('is-open');
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            applyItem(matches[active] || null);
            return;
        }
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveActive(event.key);
        }
    });
    grid.addEventListener('wheel', function (event) {
        if (grid.scrollHeight <= grid.clientHeight) {
            return;
        }
        grid.scrollTop += event.deltaY;
        event.preventDefault();
        event.stopPropagation();
    });

    const moveActive = function (key: string) {
        if (!matches.length) {
            return;
        }
        if (key === 'ArrowRight') {
            active = Math.min(matches.length - 1, active + 1);
        } else if (key === 'ArrowLeft') {
            active = Math.max(0, active - 1);
        } else if (key === 'ArrowDown') {
            active = Math.min(matches.length - 1, active + COLUMNS);
        } else if (key === 'ArrowUp') {
            active = Math.max(0, active - COLUMNS);
        }
        markActive(true);
    };

    drawButton();
}

function setChoice(form: HTMLFormElement | null, kind: string, value: string, select: HTMLSelectElement, color: string): void {
    if (!form) {
        return;
    }
    form.setAttribute('data-iconpicker-kind', kind);
    form.setAttribute('data-iconpicker-value', value);
    form.setAttribute('data-iconpicker-color', color || '');
    if (kind === 'glyph' && value) {
        select.value = value;
    }
    if (kind === 'lucide' || kind === 'emoji' || kind === 'clear') {
        select.value = '';
    }
}

function readChoice(form: HTMLFormElement | null, select: HTMLSelectElement): PendingChoice {
    const kind = form ? form.getAttribute('data-iconpicker-kind') || '' : '';
    const value = form ? form.getAttribute('data-iconpicker-value') || '' : '';
    const color = form ? form.getAttribute('data-iconpicker-color') || '' : '';
    if (kind === 'lucide' || kind === 'emoji') {
        return { kind: kind, value: value, color: kind === 'lucide' ? color : '' };
    }
    if (select.value) {
        return { kind: 'glyph', value: select.value, color: color };
    }
    return { kind: 'clear', value: '', color: '' };
}

function closePanels(except: HTMLElement | null): void {
    const panels = document.querySelectorAll('.iconpicker-panel.is-open');
    for (let i = 0; i < panels.length; i++) {
        if (panels[i] !== except) {
            panels[i].classList.remove('is-open');
        }
    }
}

function installFormHook(): void {
    const current = window.initCustomFoldersForm;
    if (!current || current.__iconpicker) {
        return;
    }
    const wrapped: InitCustomFoldersFormFn = function (selector, action) {
        current(selector, action);
        const nodes = document.querySelectorAll(selector);
        for (let i = 0; i < nodes.length; i++) {
            mount(nodes[i]);
        }
    };
    wrapped.__iconpicker = true;
    window.initCustomFoldersForm = wrapped;
}

function installNewFolderHook(): void {
    const current = window.initNewFolder;
    if (!current || current.__iconpicker) {
        return;
    }
    const wrapped: InitNewFolderFn = function (modal) {
        current(modal);
        const root = modal && (modal as { 0?: HTMLElement })[0] ? (modal as { 0?: HTMLElement })[0] : document;
        mount(root || document);
    };
    wrapped.__iconpicker = true;
    window.initNewFolder = wrapped;
}

function paintFolders(): void {
    const root = document.getElementById('folders');
    if (!root || !boot) {
        return;
    }
    const rows = root.querySelectorAll('li[data-folder_id]');
    for (let i = 0; i < rows.length; i++) {
        paintFolder(rows[i]);
    }
}

function paintFolder(row: Element): void {
    if (!boot) {
        return;
    }
    const id = row.getAttribute('data-folder_id') || '';
    const icon = row.querySelector('i.glyphicon, i.iconpicker-mark');
    if (!icon) {
        return;
    }
    const choice = boot.icons[id];
    if (icon.className.indexOf('glyphicon-star') !== -1 || glyphSuffix(icon) !== '') {
        if (choice && choice.color && icon instanceof HTMLElement) {
            icon.style.color = choice.color;
        }
        return;
    }
    if (!choice) {
        return;
    }
    icon.className = 'iconpicker-mark';
    icon.innerHTML = '';
    icon.appendChild(renderIcon(choice.kind, choice.value, choice.color || ''));
}

function glyphSuffix(icon: Element): string {
    const parts = icon.className.split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
        const name = parts[i];
        if (name.indexOf('glyphicon-') === 0 && name.length > 'glyphicon-'.length) {
            return name.substring('glyphicon-'.length);
        }
    }
    return '';
}

function watchFolders(): void {
    const root = document.querySelector('#folders');
    if (!root || typeof MutationObserver === 'undefined') {
        return;
    }
    const observer = new MutationObserver(function () {
        paintFolders();
    });
    observer.observe(root, { childList: true });
}

function paintAdmin(): void {
    if (!boot) {
        return;
    }
    const forms = document.querySelectorAll('form.custom-folders-form');
    for (let i = 0; i < forms.length; i++) {
        const form = forms[i] as HTMLFormElement;
        const id = form.getAttribute('data-folder_id') || '';
        const panel = document.getElementById('folder-' + id);
        const title = panel ? panel.querySelector('.panel-title a') : null;
        if (!title) {
            continue;
        }
        let mark = title.querySelector('.iconpicker-admin');
        if (!mark) {
            mark = document.createElement('span');
            mark.className = 'iconpicker-admin';
            title.insertBefore(mark, title.firstChild);
        }
        const select = form.querySelector('select[name="icon"]') as HTMLSelectElement | null;
        const choice = readChoice(form, select || document.createElement('select'));
        mark.innerHTML = '';
        if (choice.kind === 'clear') {
            continue;
        }
        mark.appendChild(renderIcon(choice.kind, choice.value, choice.color || ''));
    }
}

function renderIcon(kind: string, value: string, color: string): Node {
    if (kind === 'emoji' && value) {
        const text = document.createElement('span');
        text.textContent = value;
        return text;
    }
    if (kind === 'lucide' && value) {
        const body = lucideBody(value);
        if (body) {
            const wrap = document.createElement('div');
            wrap.innerHTML = '<svg viewBox="0 0 24 24" class="iconpicker-svg" aria-hidden="true">' + body + '</svg>';
            if (wrap.firstChild) {
                if (color) {
                    (wrap.firstChild as HTMLElement).style.color = color;
                }
                return wrap.firstChild;
            }
        }
    }
    if (kind === 'glyph' && value) {
        const glyph = document.createElement('i');
        glyph.className = 'glyphicon glyphicon-' + value;
        if (color) {
            glyph.style.color = color;
        }
        return glyph;
    }
    const empty = document.createElement('span');
    empty.textContent = '–';
    return empty;
}

function lucideBody(name: string): string {
    const found = items.filter(function (item) {
        return item.kind === 'lucide' && item.value === name;
    })[0] as (IconItem & { body?: string }) | undefined;
    return found && found.body ? found.body : '';
}

function themeOf(item: IconItem): string {
    const raw = (item.value + ' ' + item.label + ' ' + item.aliases.join(' ')).toLowerCase();
    const tokens = raw.split(/[^a-z0-9äöüß]+/);
    const blob = ' ' + tokens.join(' ') + ' ';
    for (let i = 0; i < THEMES.length; i++) {
        const words = THEMES[i].words;
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            if (word.indexOf('-') !== -1) {
                if (raw.indexOf(word) !== -1) {
                    return THEMES[i].id;
                }
            } else if (blob.indexOf(' ' + word + ' ') !== -1) {
                return THEMES[i].id;
            }
        }
    }
    return 'other';
}

function themeLabel(id: string): string {
    for (let i = 0; i < THEMES.length; i++) {
        if (THEMES[i].id === id) {
            return THEMES[i].label;
        }
    }
    return 'Sonstiges';
}

function sortByTheme(list: IconItem[]): IconItem[] {
    const order: Record<string, number> = { other: THEMES.length };
    for (let i = 0; i < THEMES.length; i++) {
        order[THEMES[i].id] = i;
    }
    const copy = list.slice();
    copy.sort(function (a, b) {
        const diff = (order[themeOf(a)] || 0) - (order[themeOf(b)] || 0);
        if (diff !== 0) {
            return diff;
        }
        if (a.label < b.label) {
            return -1;
        }
        if (a.label > b.label) {
            return 1;
        }
        return a.kind < b.kind ? -1 : 1;
    });
    return copy;
}

function filterItems(query: string, mode: string): IconItem[] {
    const needle = query.replace(/^\s+|\s+$/g, '').toLowerCase();
    const recent = needle ? [] : recentItems().filter(function (item) {
        return mode === 'emoji' ? item.kind === 'emoji' : item.kind !== 'emoji';
    });
    const pool = items.filter(function (item) {
        if (mode === 'emoji' && item.kind !== 'emoji') {
            return false;
        }
        if (mode === 'icon' && item.kind === 'emoji') {
            return false;
        }
        if (!needle) {
            return true;
        }
        if (item.label.toLowerCase().indexOf(needle) !== -1 || item.value.toLowerCase().indexOf(needle) !== -1) {
            return true;
        }
        for (let i = 0; i < item.aliases.length; i++) {
            if (item.aliases[i].toLowerCase().indexOf(needle) !== -1) {
                return true;
            }
        }
        return false;
    });
    if (mode === 'icon') {
        const lucide: IconItem[] = [];
        const glyphs: IconItem[] = [];
        for (let i = 0; i < pool.length; i++) {
            if (pool[i].kind === 'lucide') {
                lucide.push(pool[i]);
            } else {
                glyphs.push(pool[i]);
            }
        }
        pool.length = 0;
        for (let k = 0; k < glyphs.length; k++) {
            pool.push(glyphs[k]);
        }
        for (let j = 0; j < lucide.length; j++) {
            pool.push(lucide[j]);
        }
    }
    const seen: Record<string, boolean> = {};
    const out: IconItem[] = [];
    const push = function (item: IconItem) {
        const key = item.kind + ':' + item.value;
        if (seen[key]) {
            return;
        }
        seen[key] = true;
        out.push(item);
    };
    for (let i = 0; i < recent.length; i++) {
        push(recent[i]);
    }
    for (let j = 0; j < pool.length; j++) {
        push(pool[j]);
    }
    return out;
}

function recentItems(): IconItem[] {
    const stored = readRecent();
    const out: IconItem[] = [];
    for (let i = 0; i < stored.length; i++) {
        const found = findItem(stored[i].kind, stored[i].value);
        if (found) {
            out.push(found);
        }
    }
    return out;
}

function iconTitle(item: IconItem): string {
    const extras: string[] = [];
    for (let i = 0; i < item.aliases.length; i++) {
        const alias = item.aliases[i];
        if (alias && alias !== item.value && alias !== item.label) {
            extras.push(alias);
        }
    }
    if (!extras.length) {
        return item.label;
    }
    return item.label + ' (' + extras.join(', ') + ')';
}

function findItem(kind: string, value: string): IconItem | null {
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === kind && items[i].value === value) {
            return items[i];
        }
    }
    return null;
}

function pushRecent(choice: PendingChoice): void {
    if (!choice.value) {
        return;
    }
    const stored = readRecent().filter(function (row) {
        return !(row.kind === choice.kind && row.value === choice.value);
    });
    stored.unshift(choice);
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(stored.slice(0, 12)));
    } catch (error) {
        return;
    }
}

function readRecent(): PendingChoice[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        if (!parsed || !parsed.length) {
            return [];
        }
        const out: PendingChoice[] = [];
        for (let i = 0; i < parsed.length; i++) {
            if (parsed[i] && parsed[i].kind && parsed[i].value) {
                out.push({ kind: String(parsed[i].kind), value: String(parsed[i].value) });
            }
        }
        return out;
    } catch (error) {
        return [];
    }
}

function ensureCatalogs(done: () => void): void {
    if (ready) {
        done();
        return;
    }
    if (catalogsRequested || !boot) {
        return;
    }
    catalogsRequested = true;
    const base = boot.base;
    loadJson(base + '/icons/glyphs.json', function (glyphs) {
        loadJson(base + '/icons/aliases.json', function (aliases) {
            loadJson(base + '/icons/lucide.json', function (lucide) {
                loadJson(base + '/icons/emoji.json', function (emoji) {
                    items = buildItems(glyphs, aliases, lucide, emoji);
                    ready = true;
                    done();
                });
            });
        });
    });
}

function buildItems(glyphs: string[], aliases: Record<string, string>, lucide: Record<string, string>, emoji: Array<{ char: string; de: string; en: string }>): IconItem[] {
    const out: IconItem[] = [];
    const aliasOf: Record<string, string[]> = {};
    for (const key in aliases) {
        if (Object.prototype.hasOwnProperty.call(aliases, key)) {
            const target = aliases[key];
            if (!aliasOf[target]) {
                aliasOf[target] = [];
            }
            aliasOf[target].push(key);
        }
    }
    for (let i = 0; i < glyphs.length; i++) {
        const name = glyphs[i];
        out.push({ kind: 'glyph', value: name, label: name, aliases: aliasOf[name] || [] });
    }
    for (const name in lucide) {
        if (Object.prototype.hasOwnProperty.call(lucide, name)) {
            const item: IconItem & { body?: string } = { kind: 'lucide', value: name, label: name, aliases: [] };
            item.body = lucide[name];
            out.push(item);
        }
    }
    for (let j = 0; j < emoji.length; j++) {
        const row = emoji[j];
        out.push({ kind: 'emoji', value: row.char, label: row.en, aliases: [row.de, row.char] });
    }
    return out;
}

function loadJson(url: string, done: (data: any) => void): void {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                done(JSON.parse(xhr.responseText));
            } catch (error) {
                catalogsRequested = false;
            }
            return;
        }
        catalogsRequested = false;
    };
    xhr.onerror = function () {
        catalogsRequested = false;
    };
    xhr.send();
}

function fieldsOf(data: unknown): Record<string, string> {
    const out: Record<string, string> = {};
    if (typeof data === 'string') {
        const params = new URLSearchParams(data);
        params.forEach(function (value, key) {
            out[key] = value;
        });
        return out;
    }
    if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        for (const key in record) {
            if (Object.prototype.hasOwnProperty.call(record, key)) {
                const value = record[key];
                if (typeof value === 'string' || typeof value === 'number') {
                    out[key] = String(value);
                }
            }
        }
    }
    return out;
}

document.addEventListener('submit', function (event) {
    const form = event.target as HTMLFormElement | null;
    if (!form || !form.querySelector) {
        return;
    }
    const select = form.querySelector('select[name="icon"]') as HTMLSelectElement | null;
    if (!select) {
        return;
    }
    pending = readChoice(form, select);
}, true);

(window as { iconpickerStart?: (config: IconBoot) => void }).iconpickerStart = iconpickerStart;
})();
