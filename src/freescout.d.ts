interface IconPickerAjaxOptions {
    url?: string;
    data?: unknown;
    success?: (data: IconPickerResponse) => void;
}

interface IconPickerResponse {
    status?: string;
    id?: number;
    msg?: string;
}

interface IconPickerAjaxFn {
    (
        data: Record<string, string | number>,
        url: string,
        success?: (response: IconPickerResponse) => void,
        noLoader?: boolean,
        error?: () => void
    ): void;
}

interface IconPickerJQuery {
    ajaxPrefilter(fn: (options: IconPickerAjaxOptions) => void): void;
}

declare const $: IconPickerJQuery;

declare var fsAjax: IconPickerAjaxFn;

declare function showFloatingAlert(type: string, message: string, noAutohide?: boolean): void;

interface InitNewFolderFn {
    (modal: { 0?: HTMLElement } | HTMLElement): void;
    __iconpicker?: boolean;
}

interface InitCustomFoldersFormFn {
    (selector: string, action: string): void;
    __iconpicker?: boolean;
}

interface Window {
    initNewFolder?: InitNewFolderFn;
    initCustomFoldersForm?: InitCustomFoldersFormFn;
    iconpickerStart?: (config: unknown) => void;
}
