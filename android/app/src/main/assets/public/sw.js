/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-ca84f546'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "index.html",
    "revision": "296d2de75c88350fd226e8e30e475f9b"
  }, {
    "url": "icons/icon-512.png",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }, {
    "url": "icons/icon-192.png",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }, {
    "url": "assets/workbox-window.prod.es5-BIl4cyR9.js",
    "revision": null
  }, {
    "url": "assets/volume-2-DxMI6wBm.js",
    "revision": null
  }, {
    "url": "assets/useDebounce-B9rxr0zv.js",
    "revision": null
  }, {
    "url": "assets/universeService-ktKN7foM.js",
    "revision": null
  }, {
    "url": "assets/mcqTrackingService-oaatzhsM.js",
    "revision": null
  }, {
    "url": "assets/index-gTc9NsbL.js",
    "revision": null
  }, {
    "url": "assets/index-GZZV1oRm.css",
    "revision": null
  }, {
    "url": "assets/index-DF1pXnWF.js",
    "revision": null
  }, {
    "url": "assets/index-CxXGKCVO.js",
    "revision": null
  }, {
    "url": "assets/index-B7GyvNeH.js",
    "revision": null
  }, {
    "url": "assets/idGenerator-CPYNgnym.js",
    "revision": null
  }, {
    "url": "assets/icon-WxNW_JP-.svg",
    "revision": null
  }, {
    "url": "assets/dedupeService-aXxPfy-Q.js",
    "revision": null
  }, {
    "url": "assets/bookUtils-CgM2oPgX.js",
    "revision": null
  }, {
    "url": "assets/appConfig-DYl79ku9.js",
    "revision": null
  }, {
    "url": "assets/WordUniversePage-CgmFcosK.js",
    "revision": null
  }, {
    "url": "assets/WordUniversePage-BZV40eAE.css",
    "revision": null
  }, {
    "url": "assets/UniverseReviewPage-DJQBwA0E.js",
    "revision": null
  }, {
    "url": "assets/TopicListPage-COtZj5tq.js",
    "revision": null
  }, {
    "url": "assets/TopicDetailPage-DWLNWWxg.js",
    "revision": null
  }, {
    "url": "assets/TopBar-CTLHOqSS.js",
    "revision": null
  }, {
    "url": "assets/ThemeSelectionPage-hW_07yOu.js",
    "revision": null
  }, {
    "url": "assets/ThemeIcon-lajp7Bzb.js",
    "revision": null
  }, {
    "url": "assets/SubtopicDetailPage-pK0VhfNj.js",
    "revision": null
  }, {
    "url": "assets/SingleMCQModal-CR-oaeHu.js",
    "revision": null
  }, {
    "url": "assets/SettingsPage-DnKworl8.js",
    "revision": null
  }, {
    "url": "assets/SetDetailPage-DgbXri2b.js",
    "revision": null
  }, {
    "url": "assets/ReviewFlashcardPage-BkCN2OnB.js",
    "revision": null
  }, {
    "url": "assets/ResultPage-B1lGja0U.js",
    "revision": null
  }, {
    "url": "assets/RecentDocsPage-BGMnGHcU.js",
    "revision": null
  }, {
    "url": "assets/PrintPage-gwX37cY_.js",
    "revision": null
  }, {
    "url": "assets/PremiumModal-CZVpT5zZ.js",
    "revision": null
  }, {
    "url": "assets/PremiumInput-C9bKYvID.js",
    "revision": null
  }, {
    "url": "assets/PremiumButton-C8HKNdFz.js",
    "revision": null
  }, {
    "url": "assets/PracticeSession-uMjyzPSv.js",
    "revision": null
  }, {
    "url": "assets/PracticeFilterSheet-CO9xeFQT.js",
    "revision": null
  }, {
    "url": "assets/NewWordsPage-5PTGSJi_.js",
    "revision": null
  }, {
    "url": "assets/MergeConfigModal-CXRDTz0G.js",
    "revision": null
  }, {
    "url": "assets/MasteredWordsPage-xtp0SHen.js",
    "revision": null
  }, {
    "url": "assets/MCQBookPage-Xg2PaxyM.css",
    "revision": null
  }, {
    "url": "assets/MCQBookPage-C-rITxtu.js",
    "revision": null
  }, {
    "url": "assets/LessonListPage-CHwMPLR0.js",
    "revision": null
  }, {
    "url": "assets/LessonDetailPage-DLZfiE6J.js",
    "revision": null
  }, {
    "url": "assets/HomePage-BPKuwBpe.js",
    "revision": null
  }, {
    "url": "assets/FlashcardSession-ChFx2c42.js",
    "revision": null
  }, {
    "url": "assets/FlashcardQuizPage-D8vQW6Xf.js",
    "revision": null
  }, {
    "url": "assets/FlashcardHome-ChJyPSSq.js",
    "revision": null
  }, {
    "url": "assets/FlashcardCard-madazr7j.js",
    "revision": null
  }, {
    "url": "assets/ExamSession-tzCI2g7p.js",
    "revision": null
  }, {
    "url": "assets/ExamCenterPage-L3a6VBnc.js",
    "revision": null
  }, {
    "url": "assets/DailyWordsPage-DsFkFUS5.js",
    "revision": null
  }, {
    "url": "assets/CreatePdfPage-C7VJB8Tk.js",
    "revision": null
  }, {
    "url": "assets/CreateExamPage-CAf-5eRG.js",
    "revision": null
  }, {
    "url": "assets/CheckmarkIcon-DE2tmorL.js",
    "revision": null
  }, {
    "url": "assets/BulkImportModal-bz2CK_M7.js",
    "revision": null
  }, {
    "url": "assets/AdvancedResultPage-DzrmkDZJ.js",
    "revision": null
  }, {
    "url": "assets/ActiveExamPage-BiKDVOI1.js",
    "revision": null
  }, {
    "url": "icons/icon-192.png",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }, {
    "url": "icons/icon-512.png",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "907749c23ae2fbad76e5af3d1551fdc3"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
