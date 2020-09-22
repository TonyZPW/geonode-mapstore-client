/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import { setConfigProp, setLocalConfigurationFile } from 'mapstore/framework/utils/ConfigUtils';
import { setRegGeoserverRule } from 'mapstore/framework/utils/LayersUtils';
import LocaleUtils from 'mapstore/framework/utils/LocaleUtils';
import axios from 'mapstore/framework/libs/ajax';
import main from 'mapstore/framework/components/app/main';
import GeoStory from '@js/routes/GeoStory';
import Router, { withRoutes } from '@js/components/app/Router';

// Set X-CSRFToken in axios;
axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE
}))(Router);

const getScriptPath = function() {
    const scriptEl = document.getElementById('ms2-api');
    return scriptEl && scriptEl.src && scriptEl.src.substring(0, scriptEl.src.lastIndexOf('/')) || 'https://dev.mapstore2.geo-solutions.it/mapstore/dist';
};

const routes = [{
    name: 'geostory',
    path: '/',
    component: GeoStory
}];

const setLocale = (localeKey) => {
    const supportedLocales = LocaleUtils.getSupportedLocales();
    const locale = supportedLocales[localeKey]
        ? { [localeKey]: supportedLocales[localeKey] }
        : { en: supportedLocales.en };
    LocaleUtils.setSupportedLocales(locale);
};

function initMapStore() {

    const {
        language,
        userDetails,
        defaultConfig,
        geostory = {},
        plugins = []
    } = window.geoNodeMSConfig || {};

    setLocalConfigurationFile('');
    setLocale(language);
    setRegGeoserverRule(/\/[\w- ]*geoserver[\w- ]*\/|\/[\w- ]*gs[\w- ]*\//);
    setConfigProp('translationsPath', [ getScriptPath() + '/../MapStore2/web/client' ]);
    setConfigProp('loadAfterTheme', true);
    setConfigProp('themePrefix', 'msgapi');
    setConfigProp('plugins', plugins);

    if (defaultConfig && defaultConfig.localConfig) {
        Object.keys(defaultConfig.localConfig).forEach(function(key) {
            setConfigProp(key, defaultConfig.localConfig[key]);
        });
    }

    if (defaultConfig && defaultConfig.proxy) {
        setConfigProp('proxy', defaultConfig.proxy);
    }

    import('@js/plugins').then((pluginsModule) => {
        const pluginsDef = pluginsModule.default;
        main({
            targetId: 'ms-container',
            appComponent: withRoutes(routes)(ConnectedRouter),
            pluginsDef,
            themeCfg: {
                path: getScriptPath() + '/themes',
                prefixContainer: '#ms-container',
                version: '1'
            },
            initialState: {
                defaultState: {
                    map: { center: { x: 13, y: 45, crs: 'EPSG:4326' } },
                    maptype: { mapType: 'openlayers' },
                    controls: {
                        toolbar: {
                            active: null,
                            expanded: false
                        }
                    },
                    mapInfo: { enabled: true, infoFormat: 'text/html' },
                    security: userDetails,
                    geostory: {
                        currentStory: {},
                        mode: 'view',
                        isCollapsed: false,
                        focusedContent: {},
                        currentPage: {},
                        settings: {},
                        oldSettings: {},
                        updateUrlOnScroll: false,
                        ...geostory
                    }
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initMapStore);
