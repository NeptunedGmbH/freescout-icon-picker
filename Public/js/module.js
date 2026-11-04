"use strict";
(function () {
    var LUCIDE_COLORS = ['', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#ffffff'];
    var THEMES = [
        { id: 'arrows', label: 'Arrows', words: ['arrow', 'chevron', 'caret', 'triangle'] },
        { id: 'mail', label: 'Communication', words: ['mail', 'envelope', 'inbox', 'send', 'message', 'chat', 'comment', 'phone', 'bell', 'megaphone', 'bullhorn', 'at-sign', 'rss', 'earphone'] },
        { id: 'people', label: 'People', words: ['user', 'users', 'person', 'contact', 'baby', 'hand', 'thumbs', 'smile', 'frown', 'meh'] },
        { id: 'files', label: 'Files', words: ['file', 'files', 'folder', 'document', 'clipboard', 'paperclip', 'archive', 'book', 'bookmark', 'notebook', 'newspaper', 'scroll'] },
        { id: 'edit', label: 'Editing', words: ['pencil', 'pen', 'edit', 'scissors', 'copy', 'trash', 'eraser', 'bold', 'italic', 'font', 'align', 'list', 'indent', 'quote', 'type', 'heading', 'pilcrow', 'baseline'] },
        { id: 'security', label: 'Security', words: ['lock', 'key', 'shield', 'eye', 'fingerprint', 'scan', 'badge', 'schloss'] },
        { id: 'status', label: 'Status', words: ['check', 'alert', 'info', 'help', 'ban', 'bug', 'circle-x', 'x-circle', 'warning', 'octagon', 'siren', 'flag'] },
        { id: 'time', label: 'Time', words: ['calendar', 'clock', 'timer', 'hourglass', 'history', 'alarm', 'watch'] },
        { id: 'place', label: 'Places and travel', words: ['map', 'home', 'house', 'building', 'globe', 'navigation', 'compass', 'plane', 'car', 'train', 'ship', 'truck', 'bike', 'bed', 'hotel', 'luggage', 'anchor'] },
        { id: 'shop', label: 'Commerce', words: ['cart', 'credit', 'bank', 'wallet', 'coin', 'dollar', 'euro', 'shopping', 'gift', 'tag', 'tags', 'barcode', 'qr', 'receipt', 'store', 'pound', 'yen', 'bitcoin'] },
        { id: 'media', label: 'Media', words: ['image', 'camera', 'video', 'film', 'music', 'mic', 'volume', 'play', 'pause', 'headphone', 'tv', 'clapper', 'podcast', 'radio', 'speaker'] },
        { id: 'devices', label: 'Devices', words: ['monitor', 'laptop', 'smartphone', 'tablet', 'printer', 'cpu', 'server', 'hard-drive', 'wifi', 'battery', 'plug', 'keyboard', 'mouse', 'hdmi', 'usb', 'router', 'pc'] },
        { id: 'nature', label: 'Nature', words: ['sun', 'moon', 'cloud', 'tree', 'leaf', 'flower', 'droplet', 'flame', 'zap', 'snow', 'wind', 'mountain', 'umbrella'] },
        { id: 'other', label: 'Other', words: [] }
    ];
    var COLUMNS = 8;
    var RECENT_KEY = 'iconpicker.recent';
    var boot = null;
    var iconRevision = 0;
    var appliedIconSig = '';
    var items = [];
    var ready = false;
    var pending = null;
    var catalogsRequested = false;
    function iconpickerStart(config) {
        boot = config;
        iconRevision = Number(config.revision || 0);
        if (!boot.icons) {
            boot.icons = {};
        }
        appliedIconSig = iconMapSig(boot.icons);
        bindSave();
        mount(document);
        paintFolders();
        paintAdmin();
        watchFolders();
        document.addEventListener('click', function (event) {
            installNewFolderHook();
            installFormHook();
            var target = event.target;
            if (!target || !target.closest) {
                return;
            }
            if (!target.closest('.iconpicker')) {
                closePanels(null);
            }
        }, true);
        document.addEventListener('nestedtags:folder-icons', function (event) {
            applyFolderIcons(event.detail);
        });
        installNewFolderHook();
        installFormHook();
        ensureCatalogs(function () {
            paintFolders();
            paintAdmin();
        });
    }
    function bindSave() {
        $.ajaxPrefilter(function (options) {
            if (!boot || !options.url || options.url.indexOf('custom-folders/ajax') === -1) {
                return;
            }
            var fields = fieldsOf(options.data);
            if (fields.action !== 'create' && fields.action !== 'update' && fields.action !== 'delete') {
                return;
            }
            var previous = options.success;
            options.success = function (data) {
                var releaseSave = window.iconpickerReleaseFolderSave;
                window.iconpickerReleaseFolderSave = undefined;
                var finish = function () {
                    if (previous) {
                        previous(data);
                    }
                };
                var released = false;
                var release = function () {
                    if (released) {
                        return;
                    }
                    released = true;
                    if (releaseSave) {
                        releaseSave();
                    }
                };
                if (!boot || !data || data.status !== 'success') {
                    finish();
                    release();
                    return;
                }
                var id = data.id ? Number(data.id) : Number(fields.folder_id || 0);
                if (!id) {
                    showFloatingAlert('error', boot.failed, true);
                    release();
                    return;
                }
                var failed = boot.failed;
                var url = boot.url;
                var choice = fields.action === 'delete' ? null : pending;
                if (fields.action !== 'delete') {
                    pending = null;
                }
                var payload = {
                    action: fields.action === 'delete' ? 'delete' : 'save',
                    folder_id: id,
                    mailbox_id: fields.mailbox_id || String(boot.mailboxId),
                    kind: choice ? choice.kind : 'glyph',
                    value: choice ? choice.value : '',
                    color: choice && choice.color ? choice.color : ''
                };
                fsAjax(payload, url, function (response) {
                    if (response && response.status === 'success') {
                        var saved = Number(response.revision || 0);
                        if (saved > iconRevision) {
                            iconRevision = saved;
                        }
                        rememberBoot(String(id), payload.kind, payload.value, payload.color);
                        paintFolders();
                        paintAdmin();
                        finish();
                        release();
                        return;
                    }
                    showFloatingAlert('error', (response && response.msg) || failed, true);
                    release();
                }, true, function () {
                    showFloatingAlert('error', failed, true);
                    release();
                });
            };
        });
    }
    function applyFolderIcons(detail) {
        if (!boot || !detail || typeof detail !== 'object') {
            return;
        }
        var body = detail;
        if (!body.icons || typeof body.icons !== 'object' || Array.isArray(body.icons)) {
            return;
        }
        var revision = Number(body.revision || 0);
        if (revision < iconRevision) {
            return;
        }
        var next = {};
        for (var id in body.icons) {
            if (!Object.prototype.hasOwnProperty.call(body.icons, id)) {
                continue;
            }
            var row = body.icons[id];
            if (!row || !row.kind) {
                continue;
            }
            next[id] = {
                kind: row.kind,
                value: row.value || '',
                color: row.color || ''
            };
        }
        var sig = iconMapSig(next);
        if (revision === iconRevision && sig === appliedIconSig) {
            return;
        }
        boot.icons = next;
        appliedIconSig = sig;
        if (revision > iconRevision) {
            iconRevision = revision;
        }
        paintFolders();
    }
    function iconMapSig(rows) {
        var ids = Object.keys(rows).sort();
        var parts = [];
        for (var i = 0; i < ids.length; i++) {
            var row = rows[ids[i]];
            parts.push(ids[i] + '\n' + row.kind + '\n' + (row.value || '') + '\n' + (row.color || ''));
        }
        return parts.join('\n');
    }
    function rememberBoot(id, kind, value, color) {
        if (!boot) {
            return;
        }
        if ((kind === 'lucide' || kind === 'emoji' || kind === 'glyph') && value) {
            boot.icons[id] = { kind: kind, value: value, color: color };
            return;
        }
        delete boot.icons[id];
    }
    function mount(root) {
        var selects = root.querySelectorAll('select[name="icon"]');
        for (var i = 0; i < selects.length; i++) {
            mountSelect(selects[i]);
        }
    }
    function mountSelect(select) {
        if (select.getAttribute('data-iconpicker') === '1') {
            return;
        }
        select.setAttribute('data-iconpicker', '1');
        select.classList.add('iconpicker-select');
        var form = select.closest('form');
        var help = select.parentElement ? select.parentElement.querySelector('.form-help') : null;
        if (help) {
            help.setAttribute('hidden', 'hidden');
        }
        var folderId = form ? form.getAttribute('data-folder_id') || '' : '';
        var row = boot && folderId ? boot.icons[folderId] : undefined;
        if (row && (row.kind === 'lucide' || row.kind === 'emoji') && !select.value) {
            setChoice(form, row.kind, row.value, select, row.color || '');
        }
        else if (select.value) {
            var color = row && row.kind === 'glyph' ? (row.color || '') : '';
            setChoice(form, 'glyph', select.value, select, color);
        }
        else if (row) {
            setChoice(form, row.kind, row.value, select, row.color || '');
        }
        else {
            setChoice(form, 'clear', '', select, '');
        }
        var holder = document.createElement('div');
        holder.className = 'iconpicker';
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-default iconpicker-button';
        var panel = document.createElement('div');
        panel.className = 'iconpicker-panel';
        var search = document.createElement('input');
        search.type = 'search';
        search.className = 'form-control iconpicker-search';
        var switcher = document.createElement('div');
        switcher.className = 'iconpicker-switch';
        var emojiTab = document.createElement('button');
        emojiTab.type = 'button';
        emojiTab.className = 'iconpicker-switch-btn';
        emojiTab.textContent = 'Emoji';
        var iconTab = document.createElement('button');
        iconTab.type = 'button';
        iconTab.className = 'iconpicker-switch-btn';
        iconTab.textContent = 'Icons';
        switcher.appendChild(emojiTab);
        switcher.appendChild(iconTab);
        var colors = document.createElement('div');
        colors.className = 'iconpicker-colors';
        var bar = document.createElement('div');
        bar.className = 'iconpicker-bar';
        var nameEl = document.createElement('span');
        nameEl.className = 'iconpicker-name';
        var clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'btn btn-link btn-sm iconpicker-clear';
        clear.textContent = label('clear', 'Remove icon');
        bar.appendChild(nameEl);
        bar.appendChild(clear);
        var grid = document.createElement('div');
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
        var matches = [];
        var active = 0;
        var mode = 'icon';
        var iconColor = '';
        var drawButton = function () {
            var current = readChoice(form, select);
            var known = findItem(current.kind, current.value);
            var title = known ? iconTitle(known) : current.value;
            button.innerHTML = '';
            button.title = title;
            button.setAttribute('aria-label', title || 'Icon');
            button.appendChild(renderIcon(current.kind, current.value, current.color || ''));
        };
        var drawGrid = function () {
            active = 0;
            grid.innerHTML = '';
            grid.scrollTop = 0;
            var lastTheme = '';
            for (var i = 0; i < matches.length; i++) {
                if (mode === 'icon') {
                    var theme = themeOf(matches[i]);
                    if (theme !== lastTheme) {
                        var head = document.createElement('div');
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
        var cell = function (item, index) {
            var node = document.createElement('button');
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
        var showName = function (item) {
            nameEl.textContent = item ? iconTitle(item) : '';
        };
        var markActive = function (scroll) {
            var cells = grid.querySelectorAll('.iconpicker-cell');
            var current = null;
            for (var i = 0; i < cells.length; i++) {
                var node = cells[i];
                var index = Number(node.getAttribute('data-index'));
                if (index === active) {
                    node.classList.add('is-active');
                    current = node;
                }
                else {
                    node.classList.remove('is-active');
                }
            }
            showName(matches[active] || null);
            if (scroll && current) {
                current.scrollIntoView({ block: 'nearest' });
            }
        };
        var applyItem = function (item) {
            if (!item) {
                setChoice(form, 'clear', '', select, '');
            }
            else if (item.kind === 'glyph') {
                setChoice(form, 'glyph', item.value, select, iconColor);
                select.value = item.value;
            }
            else if (item.kind === 'lucide') {
                setChoice(form, 'lucide', item.value, select, iconColor);
                select.value = '';
            }
            else {
                setChoice(form, 'emoji', item.value, select, '');
                select.value = '';
            }
            pushRecent(readChoice(form, select));
            panel.classList.remove('is-open');
            drawButton();
        };
        var paintSwitch = function () {
            emojiTab.classList.toggle('is-on', mode === 'emoji');
            iconTab.classList.toggle('is-on', mode === 'icon');
            colors.style.display = mode === 'icon' ? '' : 'none';
        };
        var paintColors = function () {
            colors.innerHTML = '';
            var _loop_1 = function (i) {
                var value = LUCIDE_COLORS[i];
                var swatch = document.createElement('button');
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
                    var current = readChoice(form, select);
                    if (current.kind === 'lucide' || current.kind === 'glyph') {
                        setChoice(form, current.kind, current.value, select, iconColor);
                        drawButton();
                    }
                    paintColors();
                    refill();
                });
                colors.appendChild(swatch);
            };
            for (var i = 0; i < LUCIDE_COLORS.length; i++) {
                _loop_1(i);
            }
        };
        var useMode = function (next) {
            mode = next;
            paintSwitch();
            refill();
        };
        var refill = function () {
            var found = filterItems(search.value || '', mode);
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
            var open = panel.classList.contains('is-open');
            closePanels(panel);
            if (open) {
                panel.classList.remove('is-open');
                return;
            }
            panel.classList.add('is-open');
            search.value = '';
            var current = readChoice(form, select);
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
        var moveActive = function (key) {
            if (!matches.length) {
                return;
            }
            if (key === 'ArrowRight') {
                active = Math.min(matches.length - 1, active + 1);
            }
            else if (key === 'ArrowLeft') {
                active = Math.max(0, active - 1);
            }
            else if (key === 'ArrowDown') {
                active = Math.min(matches.length - 1, active + COLUMNS);
            }
            else if (key === 'ArrowUp') {
                active = Math.max(0, active - COLUMNS);
            }
            markActive(true);
        };
        drawButton();
    }
    function setChoice(form, kind, value, select, color) {
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
    function readChoice(form, select) {
        var kind = form ? form.getAttribute('data-iconpicker-kind') || '' : '';
        var value = form ? form.getAttribute('data-iconpicker-value') || '' : '';
        var color = form ? form.getAttribute('data-iconpicker-color') || '' : '';
        if (kind === 'lucide' || kind === 'emoji') {
            return { kind: kind, value: value, color: kind === 'lucide' ? color : '' };
        }
        if (select.value) {
            return { kind: 'glyph', value: select.value, color: color };
        }
        return { kind: 'clear', value: '', color: '' };
    }
    function closePanels(except) {
        var panels = document.querySelectorAll('.iconpicker-panel.is-open');
        for (var i = 0; i < panels.length; i++) {
            if (panels[i] !== except) {
                panels[i].classList.remove('is-open');
            }
        }
    }
    function installFormHook() {
        var current = window.initCustomFoldersForm;
        if (!current || current.__iconpicker) {
            return;
        }
        var wrapped = function (selector, action) {
            current(selector, action);
            var nodes = document.querySelectorAll(selector);
            for (var i = 0; i < nodes.length; i++) {
                mount(nodes[i]);
            }
        };
        wrapped.__iconpicker = true;
        window.initCustomFoldersForm = wrapped;
    }
    function installNewFolderHook() {
        var current = window.initNewFolder;
        if (!current || current.__iconpicker) {
            return;
        }
        var wrapped = function (modal) {
            current(modal);
            var root = modal && modal[0] ? modal[0] : document;
            mount(root || document);
        };
        wrapped.__iconpicker = true;
        window.initNewFolder = wrapped;
    }
    function paintFolders() {
        var root = document.getElementById('folders');
        if (!root || !boot) {
            return;
        }
        var rows = root.querySelectorAll('li[data-folder_id]');
        for (var i = 0; i < rows.length; i++) {
            paintFolder(rows[i]);
        }
    }
    function iconDrawn(icon, kind, value, color) {
        if (icon.getAttribute('data-iconpicker-sig') !== kind + '\n' + value + '\n' + color) {
            return false;
        }
        if (kind === 'lucide') {
            return !!icon.querySelector('svg.iconpicker-svg');
        }
        if (kind === 'emoji') {
            return (icon.textContent || '') === value;
        }
        return icon.classList.contains('glyphicon-' + value);
    }
    function rememberIcon(icon, kind, value, color) {
        icon.setAttribute('data-iconpicker-sig', kind + '\n' + value + '\n' + color);
    }
    function paintFolder(row) {
        if (!boot) {
            return;
        }
        var id = row.getAttribute('data-folder_id') || '';
        var icon = row.querySelector('i.glyphicon, i.iconpicker-mark');
        if (!icon) {
            return;
        }
        var choice = boot.icons[id];
        if (choice && (choice.kind === 'lucide' || choice.kind === 'emoji') && choice.value) {
            var color = choice.color || '';
            if (iconDrawn(icon, choice.kind, choice.value, color)) {
                return;
            }
            icon.className = 'iconpicker-mark';
            icon.innerHTML = '';
            if (icon instanceof HTMLElement) {
                icon.style.color = '';
            }
            var mark = renderIcon(choice.kind, choice.value, color);
            icon.appendChild(mark);
            var drawn = choice.kind === 'emoji'
                || (mark instanceof Element && mark.classList.contains('iconpicker-svg'));
            if (drawn) {
                rememberIcon(icon, choice.kind, choice.value, color);
            }
            return;
        }
        if (choice && choice.kind === 'glyph' && choice.value) {
            var color = choice.color || '';
            if (iconDrawn(icon, 'glyph', choice.value, color)) {
                return;
            }
            icon.className = 'glyphicon glyphicon-' + choice.value;
            icon.innerHTML = '';
            if (icon instanceof HTMLElement) {
                icon.style.color = color;
            }
            rememberIcon(icon, 'glyph', choice.value, color);
            return;
        }
        if (!choice) {
            if (icon.classList.contains('iconpicker-mark')) {
                icon.className = 'glyphicon glyphicon-';
                icon.innerHTML = '';
                icon.removeAttribute('data-iconpicker-sig');
                if (icon instanceof HTMLElement) {
                    icon.style.color = '';
                }
            }
            return;
        }
    }
    function watchFolders() {
        var root = document.querySelector('#folders');
        if (!root || typeof MutationObserver === 'undefined') {
            return;
        }
        var observer = new MutationObserver(function () {
            paintFolders();
        });
        observer.observe(root, { childList: true });
    }
    function paintAdmin() {
        if (!boot) {
            return;
        }
        var forms = document.querySelectorAll('form.custom-folders-form');
        for (var i = 0; i < forms.length; i++) {
            var form = forms[i];
            var id = form.getAttribute('data-folder_id') || '';
            var panel = document.getElementById('folder-' + id);
            var title = panel ? panel.querySelector('.panel-title a') : null;
            if (!title) {
                continue;
            }
            var mark = title.querySelector('.iconpicker-admin');
            if (!mark) {
                mark = document.createElement('span');
                mark.className = 'iconpicker-admin';
                title.insertBefore(mark, title.firstChild);
            }
            var select = form.querySelector('select[name="icon"]');
            var choice = readChoice(form, select || document.createElement('select'));
            mark.innerHTML = '';
            if (choice.kind === 'clear') {
                continue;
            }
            mark.appendChild(renderIcon(choice.kind, choice.value, choice.color || ''));
        }
    }
    function renderIcon(kind, value, color) {
        if (kind === 'emoji' && value) {
            var text = document.createElement('span');
            text.textContent = value;
            return text;
        }
        if (kind === 'lucide' && value) {
            var body = lucideBody(value);
            if (body) {
                var wrap = document.createElement('div');
                wrap.innerHTML = '<svg viewBox="0 0 24 24" class="iconpicker-svg" aria-hidden="true">' + body + '</svg>';
                if (wrap.firstChild) {
                    if (color) {
                        wrap.firstChild.style.color = color;
                    }
                    return wrap.firstChild;
                }
            }
        }
        if (kind === 'glyph' && value) {
            var glyph = document.createElement('i');
            glyph.className = 'glyphicon glyphicon-' + value;
            if (color) {
                glyph.style.color = color;
            }
            return glyph;
        }
        var empty = document.createElement('span');
        empty.textContent = '–';
        return empty;
    }
    function lucideBody(name) {
        var found = items.filter(function (item) {
            return item.kind === 'lucide' && item.value === name;
        })[0];
        return found && found.body ? found.body : '';
    }
    function themeOf(item) {
        var raw = (item.value + ' ' + item.label + ' ' + item.aliases.join(' ')).toLowerCase();
        var tokens = raw.split(/[^a-z0-9äöüß]+/);
        var blob = ' ' + tokens.join(' ') + ' ';
        for (var i = 0; i < THEMES.length; i++) {
            var words = THEMES[i].words;
            for (var j = 0; j < words.length; j++) {
                var word = words[j];
                if (word.indexOf('-') !== -1) {
                    if (raw.indexOf(word) !== -1) {
                        return THEMES[i].id;
                    }
                }
                else if (blob.indexOf(' ' + word + ' ') !== -1) {
                    return THEMES[i].id;
                }
            }
        }
        return 'other';
    }
    function label(id, fallback) {
        var labels = boot && boot.labels;
        var value = labels ? labels[id] : '';
        return value || fallback;
    }
    function themeLabel(id) {
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].id === id) {
                return label(id, THEMES[i].label);
            }
        }
        return label('other', 'Other');
    }
    function sortByTheme(list) {
        var order = { other: THEMES.length };
        for (var i = 0; i < THEMES.length; i++) {
            order[THEMES[i].id] = i;
        }
        var copy = list.slice();
        copy.sort(function (a, b) {
            var diff = (order[themeOf(a)] || 0) - (order[themeOf(b)] || 0);
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
    function filterItems(query, mode) {
        var needle = query.replace(/^\s+|\s+$/g, '').toLowerCase();
        var recent = needle ? [] : recentItems().filter(function (item) {
            return mode === 'emoji' ? item.kind === 'emoji' : item.kind !== 'emoji';
        });
        var pool = items.filter(function (item) {
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
            for (var i = 0; i < item.aliases.length; i++) {
                if (item.aliases[i].toLowerCase().indexOf(needle) !== -1) {
                    return true;
                }
            }
            return false;
        });
        if (mode === 'icon') {
            var lucide = [];
            var glyphs = [];
            for (var i = 0; i < pool.length; i++) {
                if (pool[i].kind === 'lucide') {
                    lucide.push(pool[i]);
                }
                else {
                    glyphs.push(pool[i]);
                }
            }
            pool.length = 0;
            for (var k = 0; k < glyphs.length; k++) {
                pool.push(glyphs[k]);
            }
            for (var j = 0; j < lucide.length; j++) {
                pool.push(lucide[j]);
            }
        }
        var seen = {};
        var out = [];
        var push = function (item) {
            var key = item.kind + ':' + item.value;
            if (seen[key]) {
                return;
            }
            seen[key] = true;
            out.push(item);
        };
        for (var i = 0; i < recent.length; i++) {
            push(recent[i]);
        }
        for (var j = 0; j < pool.length; j++) {
            push(pool[j]);
        }
        return out;
    }
    function recentItems() {
        var stored = readRecent();
        var out = [];
        for (var i = 0; i < stored.length; i++) {
            var found = findItem(stored[i].kind, stored[i].value);
            if (found) {
                out.push(found);
            }
        }
        return out;
    }
    function iconTitle(item) {
        var extras = [];
        for (var i = 0; i < item.aliases.length; i++) {
            var alias = item.aliases[i];
            if (alias && alias !== item.value && alias !== item.label) {
                extras.push(alias);
            }
        }
        if (!extras.length) {
            return item.label;
        }
        return item.label + ' (' + extras.join(', ') + ')';
    }
    function findItem(kind, value) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].kind === kind && items[i].value === value) {
                return items[i];
            }
        }
        return null;
    }
    function pushRecent(choice) {
        if (!choice.value) {
            return;
        }
        var stored = readRecent().filter(function (row) {
            return !(row.kind === choice.kind && row.value === choice.value);
        });
        stored.unshift(choice);
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(stored.slice(0, 12)));
        }
        catch (error) {
            return;
        }
    }
    function readRecent() {
        try {
            var parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
            if (!parsed || !parsed.length) {
                return [];
            }
            var out = [];
            for (var i = 0; i < parsed.length; i++) {
                if (parsed[i] && parsed[i].kind && parsed[i].value) {
                    out.push({ kind: String(parsed[i].kind), value: String(parsed[i].value) });
                }
            }
            return out;
        }
        catch (error) {
            return [];
        }
    }
    function ensureCatalogs(done) {
        if (ready) {
            done();
            return;
        }
        if (catalogsRequested || !boot) {
            return;
        }
        catalogsRequested = true;
        var base = boot.base;
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
    function buildItems(glyphs, aliases, lucide, emoji) {
        var out = [];
        var aliasOf = {};
        for (var key in aliases) {
            if (Object.prototype.hasOwnProperty.call(aliases, key)) {
                var target = aliases[key];
                if (!aliasOf[target]) {
                    aliasOf[target] = [];
                }
                aliasOf[target].push(key);
            }
        }
        for (var i = 0; i < glyphs.length; i++) {
            var name_1 = glyphs[i];
            out.push({ kind: 'glyph', value: name_1, label: name_1, aliases: aliasOf[name_1] || [] });
        }
        for (var name_2 in lucide) {
            if (Object.prototype.hasOwnProperty.call(lucide, name_2)) {
                var item = { kind: 'lucide', value: name_2, label: name_2, aliases: [] };
                item.body = lucide[name_2];
                out.push(item);
            }
        }
        for (var j = 0; j < emoji.length; j++) {
            var row = emoji[j];
            out.push({ kind: 'emoji', value: row.char, label: row.en, aliases: [row.de, row.char] });
        }
        return out;
    }
    function loadJson(url, done) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    done(JSON.parse(xhr.responseText));
                }
                catch (error) {
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
    function fieldsOf(data) {
        var out = {};
        if (typeof data === 'string') {
            var params = new URLSearchParams(data);
            params.forEach(function (value, key) {
                out[key] = value;
            });
            return out;
        }
        if (data && typeof data === 'object') {
            var record = data;
            for (var key in record) {
                if (Object.prototype.hasOwnProperty.call(record, key)) {
                    var value = record[key];
                    if (typeof value === 'string' || typeof value === 'number') {
                        out[key] = String(value);
                    }
                }
            }
        }
        return out;
    }
    document.addEventListener('submit', function (event) {
        var form = event.target;
        if (!form || !form.querySelector) {
            return;
        }
        var select = form.querySelector('select[name="icon"]');
        if (!select) {
            return;
        }
        pending = readChoice(form, select);
    }, true);
    window.iconpickerStart = iconpickerStart;
})();
